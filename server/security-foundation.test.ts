import { readFile } from "node:fs/promises";
import { PGlite } from "@electric-sql/pglite";
import express from "express";
import request from "supertest";
import { describe, expect, it } from "vitest";
import {
  hashPasswordArgon2id,
  passwordHashNeedsUpgrade,
  verifyPasswordArgon2id,
} from "./security/passwords.js";
import {
  hashSessionToken,
  SessionService,
  type CreateSessionRecord,
  type SessionPrincipal,
  type SessionRepository,
} from "./security/session-service.js";
import {
  createSessionAuthentication,
  requirePermission,
} from "./security/session-middleware.js";
import {
  LoginThrottleService,
  type LoginAttemptKeys,
  type LoginAttemptRepository,
} from "./security/login-throttle.js";
import {
  AuthenticationService,
  type AuthenticationUser,
  type AuthenticationUserRepository,
} from "./security/authentication-service.js";
import type { AuditWriter } from "./security/audit-repository.js";
import type { InsertAuditEvent } from "../shared/schema.js";

class MemoryLoginAttemptRepository implements LoginAttemptRepository {
  attempts: Array<LoginAttemptKeys & { successful: boolean; attemptedAt: Date }> = [];

  async countRecent(keys: LoginAttemptKeys, since: Date) {
    const failures = this.attempts.filter(
      (attempt) => !attempt.successful && attempt.attemptedAt >= since,
    );
    return {
      accountFailures: failures.filter((attempt) => attempt.accountKeyHash === keys.accountKeyHash).length,
      networkFailures: failures.filter((attempt) => attempt.networkKeyHash === keys.networkKeyHash).length,
    };
  }

  async record(keys: LoginAttemptKeys, successful: boolean, attemptedAt: Date) {
    this.attempts.push({ ...keys, successful, attemptedAt });
  }
}

class MemoryAuthenticationUserRepository implements AuthenticationUserRepository {
  failures: Array<{ count: number; lockedUntil: Date | null }> = [];
  successes = 0;

  constructor(public user: AuthenticationUser | null) {}

  async findByEmail(email: string) {
    return this.user?.email === email ? this.user : null;
  }

  async recordFailure(_userId: string, failedLoginAttempts: number, lockedUntil: Date | null) {
    this.failures.push({ count: failedLoginAttempts, lockedUntil });
    if (this.user) {
      this.user.failedLoginAttempts = failedLoginAttempts;
      this.user.lockedUntil = lockedUntil;
    }
  }

  async recordSuccess() {
    this.successes += 1;
    if (this.user) {
      this.user.failedLoginAttempts = 0;
      this.user.lockedUntil = null;
    }
  }
}

class MemoryAuditWriter implements AuditWriter {
  events: InsertAuditEvent[] = [];
  async append(event: InsertAuditEvent) {
    this.events.push(event);
    return { id: `audit-${this.events.length}` };
  }
}

class MemorySessionRepository implements SessionRepository {
  record: (CreateSessionRecord & { id: string; revokedAt: Date | null }) | null = null;
  userSecurityVersion = 1;
  status = "active";
  permissions = ["content.read", "content.publish"];
  touches = 0;

  async createSession(record: CreateSessionRecord): Promise<{ id: string }> {
    this.record = { ...record, id: "session-1", revokedAt: null };
    return { id: "session-1" };
  }

  async findPrincipalByTokenHash(tokenHash: string): Promise<SessionPrincipal | null> {
    if (!this.record || this.record.tokenHash !== tokenHash) return null;
    return {
      sessionId: this.record.id,
      userId: this.record.userId,
      email: "admin@test.invalid",
      status: this.status,
      userSecurityVersion: this.userSecurityVersion,
      sessionSecurityVersion: this.record.userSecurityVersion,
      expiresAt: this.record.expiresAt,
      idleExpiresAt: this.record.idleExpiresAt,
      revokedAt: this.record.revokedAt,
      permissions: this.permissions,
    };
  }

  async touchSession(_sessionId: string, _lastSeenAt: Date, idleExpiresAt: Date): Promise<void> {
    this.touches += 1;
    if (this.record) this.record.idleExpiresAt = idleExpiresAt;
  }

  async revokeSession(_sessionId: string, revokedAt: Date): Promise<void> {
    if (this.record) this.record.revokedAt = revokedAt;
  }

  async revokeUserSessions(_userId: string, revokedAt: Date): Promise<void> {
    if (this.record) this.record.revokedAt = revokedAt;
  }
}

describe("Argon2id administrator credentials", () => {
  it("hashes and verifies a strong password with Argon2id", async () => {
    const passwordHash = await hashPasswordArgon2id("correct horse battery staple");

    expect(passwordHash).toMatch(/^\$argon2id\$/);
    await expect(
      verifyPasswordArgon2id(passwordHash, "correct horse battery staple"),
    ).resolves.toBe(true);
    await expect(verifyPasswordArgon2id(passwordHash, "wrong password"))
      .resolves.toBe(false);
    expect(passwordHashNeedsUpgrade(passwordHash)).toBe(false);
  });

  it("rejects short passwords before hashing", async () => {
    await expect(hashPasswordArgon2id("too-short")).rejects.toThrow("at least 12");
  });
});

describe("revocable opaque sessions", () => {
  it("stores only a token hash and authenticates an active session", async () => {
    const repository = new MemorySessionRepository();
    const service = new SessionService(repository, {
      absoluteLifetimeMs: 60 * 60 * 1000,
      idleLifetimeMs: 10 * 60 * 1000,
    });
    const now = new Date("2026-07-23T12:00:00Z");

    const issued = await service.issue({ userId: "user-1", userSecurityVersion: 1 }, now);
    expect(repository.record?.tokenHash).toBe(hashSessionToken(issued.token));
    expect(repository.record?.tokenHash).not.toBe(issued.token);

    const principal = await service.authenticate(
      issued.token,
      new Date("2026-07-23T12:05:00Z"),
    );
    expect(principal?.permissions).toContain("content.publish");
    expect(repository.touches).toBe(1);
  });

  it("rejects idle, absolute, revoked, disabled, and security-version-invalid sessions", async () => {
    const cases = ["idle", "absolute", "revoked", "disabled", "version"] as const;
    for (const scenario of cases) {
      const repository = new MemorySessionRepository();
      const service = new SessionService(repository, {
        absoluteLifetimeMs: 60 * 60 * 1000,
        idleLifetimeMs: 10 * 60 * 1000,
      });
      const issued = await service.issue(
        { userId: "user-1", userSecurityVersion: 1 },
        new Date("2026-07-23T12:00:00Z"),
      );

      if (scenario === "revoked" && repository.record) {
        repository.record.revokedAt = new Date("2026-07-23T12:01:00Z");
      }
      if (scenario === "disabled") repository.status = "disabled";
      if (scenario === "version") repository.userSecurityVersion = 2;
      const validationTime = scenario === "idle"
        ? new Date("2026-07-23T12:11:00Z")
        : scenario === "absolute"
          ? new Date("2026-07-23T13:01:00Z")
          : new Date("2026-07-23T12:02:00Z");

      await expect(service.authenticate(issued.token, validationTime)).resolves.toBeNull();
    }
  });

  it("revokes a session by its opaque token", async () => {
    const repository = new MemorySessionRepository();
    const service = new SessionService(repository);
    const issued = await service.issue(
      { userId: "user-1", userSecurityVersion: 1 },
      new Date("2026-07-23T12:00:00Z"),
    );

    await service.revoke(issued.token, "logout", new Date("2026-07-23T12:01:00Z"));
    await expect(
      service.authenticate(issued.token, new Date("2026-07-23T12:02:00Z")),
    ).resolves.toBeNull();
  });
});

describe("permission middleware", () => {
  async function createProtectedFixture(permission = "content.publish") {
    const repository = new MemorySessionRepository();
    const service = new SessionService(repository);
    const issued = await service.issue({ userId: "user-1", userSecurityVersion: 1 });
    const application = express();
    application.get(
      "/protected",
      createSessionAuthentication(service),
      requirePermission(permission),
      (_request, response) => response.json({ ok: true }),
    );
    return { application, issued, repository, service };
  }

  it("rejects a request without a session cookie", async () => {
    const { application } = await createProtectedFixture();

    const response = await request(application).get("/protected");
    expect(response.status).toBe(401);
  });

  it("allows a principal with the required permission", async () => {
    const { application, issued } = await createProtectedFixture();

    const response = await request(application)
      .get("/protected")
      .set("Cookie", `admin_session=${encodeURIComponent(issued.token)}`);
    expect(response.status).toBe(200);
    expect(response.body).toEqual({ ok: true });
  });

  it("rejects a principal without the required permission", async () => {
    const { application, issued } = await createProtectedFixture("users.manage");

    const response = await request(application)
      .get("/protected")
      .set("Cookie", `admin_session=${encodeURIComponent(issued.token)}`);
    expect(response.status).toBe(403);
  });

  it("clears an invalid session cookie", async () => {
    const { application, issued, service } = await createProtectedFixture();
    await service.revoke(issued.token);

    const response = await request(application)
      .get("/protected")
      .set("Cookie", `admin_session=${encodeURIComponent(issued.token)}`);
    expect(response.status).toBe(401);
    expect(response.headers["set-cookie"]?.[0]).toContain("admin_session=");
  });
});

describe("distributed login throttling", () => {
  const pepper = "test-only-login-throttle-pepper-123456789";
  const now = new Date("2026-07-23T12:00:00Z");

  it("normalizes account identifiers and does not persist raw email or network values", () => {
    const service = new LoginThrottleService(new MemoryLoginAttemptRepository(), pepper);
    const first = service.keys(" Admin@Example.COM ", "203.0.113.9");
    const second = service.keys("admin@example.com", "203.0.113.9");

    expect(first).toEqual(second);
    expect(first.accountKeyHash).toMatch(/^[a-f0-9]{64}$/);
    expect(first.accountKeyHash).not.toContain("admin@example.com");
    expect(first.networkKeyHash).not.toContain("203.0.113.9");
  });

  it("blocks an account after five recent failures", async () => {
    const repository = new MemoryLoginAttemptRepository();
    const service = new LoginThrottleService(repository, pepper);
    for (let attempt = 0; attempt < 5; attempt += 1) {
      await service.record("admin@example.com", "203.0.113.9", false, now);
    }

    await expect(service.check("ADMIN@example.com", "198.51.100.2", now)).resolves.toMatchObject({
      allowed: false,
      reason: "account",
    });
  });

  it("blocks a network across accounts and ignores expired or successful attempts", async () => {
    const repository = new MemoryLoginAttemptRepository();
    const service = new LoginThrottleService(repository, pepper, { networkFailureLimit: 3 });
    await service.record("old@example.com", "203.0.113.9", false, new Date(now.getTime() - 16 * 60 * 1000));
    await service.record("success@example.com", "203.0.113.9", true, now);
    for (let attempt = 0; attempt < 3; attempt += 1) {
      await service.record(`${attempt}@example.com`, "203.0.113.9", false, now);
    }

    await expect(service.check("new@example.com", "203.0.113.9", now)).resolves.toMatchObject({
      allowed: false,
      reason: "network",
    });
  });

  it("rejects an inadequate hashing pepper", () => {
    expect(() => new LoginThrottleService(new MemoryLoginAttemptRepository(), "short"))
      .toThrow("at least 32");
  });
});

describe("database authentication service", () => {
  async function fixture(password = "correct horse battery staple") {
    const user: AuthenticationUser = {
      id: "user-1",
      email: "admin@example.com",
      passwordHash: await hashPasswordArgon2id(password),
      status: "active",
      securityVersion: 2,
      failedLoginAttempts: 0,
      lockedUntil: null,
    };
    const users = new MemoryAuthenticationUserRepository(user);
    const sessions = new SessionService(new MemorySessionRepository());
    const throttle = new LoginThrottleService(
      new MemoryLoginAttemptRepository(),
      "test-only-login-throttle-pepper-123456789",
    );
    const audit = new MemoryAuditWriter();
    return {
      service: new AuthenticationService(users, sessions, throttle, audit),
      users,
      audit,
    };
  }

  it("issues a revocable session and audits a valid login", async () => {
    const { service, users, audit } = await fixture();
    const result = await service.login(
      " ADMIN@example.com ",
      "correct horse battery staple",
      { networkAddress: "203.0.113.9", userAgent: "test-agent", requestId: "request-1" },
      new Date("2026-07-23T12:00:00Z"),
    );

    expect(result.outcome).toBe("success");
    expect(users.successes).toBe(1);
    expect(audit.events.at(-1)).toMatchObject({
      action: "identity.login.succeeded",
      result: "success",
      requestId: "request-1",
    });
  });

  it("returns a generic failure, records the attempt, and progressively locks the account", async () => {
    const { service, users, audit } = await fixture();
    if (users.user) users.user.failedLoginAttempts = 4;
    const now = new Date("2026-07-23T12:00:00Z");
    const result = await service.login(
      "admin@example.com",
      "incorrect password",
      { networkAddress: "203.0.113.9" },
      now,
    );

    expect(result).toEqual({ outcome: "invalid" });
    expect(users.failures[0]?.count).toBe(5);
    expect(users.failures[0]?.lockedUntil).toEqual(new Date("2026-07-23T12:05:00Z"));
    expect(audit.events.at(-1)?.action).toBe("identity.login.failed");
  });

  it("does not reveal whether an account exists", async () => {
    const sessions = new SessionService(new MemorySessionRepository());
    const throttle = new LoginThrottleService(
      new MemoryLoginAttemptRepository(),
      "test-only-login-throttle-pepper-123456789",
    );
    const audit = new MemoryAuditWriter();
    const service = new AuthenticationService(
      new MemoryAuthenticationUserRepository(null), sessions, throttle, audit,
    );

    await expect(service.login(
      "missing@example.com", "any supplied password", { networkAddress: "203.0.113.10" },
    )).resolves.toEqual({ outcome: "invalid" });
  });
});

describe("secure-foundation migration", () => {
  it("supports existing and fresh databases with idempotent baseline statements", async () => {
    const migration = await readFile("migrations/0000_secure_foundation.sql", "utf8");

    expect(migration).toContain('ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "password_hash"');
    expect(migration).toContain('CREATE TABLE IF NOT EXISTS "sessions"');
    expect(migration).toContain('CREATE TABLE IF NOT EXISTS "audit_events"');
    expect(migration).toContain("super_administrator");
    expect(migration).toContain("security.settings.manage");
    expect(migration).toContain('CREATE TABLE IF NOT EXISTS "blog_posts"');
    expect(migration).toContain('CREATE TABLE IF NOT EXISTS "portfolio_projects"');
    expect(migration).not.toMatch(/CREATE TABLE\s+"(?:blog_posts|portfolio_projects)"/);
  });

  it("executes twice against an isolated PostgreSQL database", async () => {
    const migration = await readFile("migrations/0000_secure_foundation.sql", "utf8");
    const database = new PGlite();
    try {
      await database.exec(migration);
      await database.exec(migration);

      const roleCount = await database.query<{ count: number }>(
        "select count(*)::int as count from roles",
      );
      const permissionCount = await database.query<{ count: number }>(
        "select count(*)::int as count from permissions",
      );
      const superAdministratorPermissionCount = await database.query<{ count: number }>(
        `select count(*)::int as count
         from role_permissions rp
         join roles r on r.id = rp.role_id
         where r.key = 'super_administrator'`,
      );

      expect(roleCount.rows[0]?.count).toBe(9);
      expect(permissionCount.rows[0]?.count).toBe(19);
      expect(superAdministratorPermissionCount.rows[0]?.count).toBe(19);
    } finally {
      await database.close();
    }
  }, 30_000);
});
