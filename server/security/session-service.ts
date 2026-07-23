import crypto from "node:crypto";

export interface SessionPrincipal {
  sessionId: string;
  userId: string;
  email: string;
  status: string;
  userSecurityVersion: number;
  sessionSecurityVersion: number;
  expiresAt: Date;
  idleExpiresAt: Date;
  revokedAt: Date | null;
  permissions: string[];
}

export interface CreateSessionRecord {
  userId: string;
  tokenHash: string;
  userSecurityVersion: number;
  expiresAt: Date;
  idleExpiresAt: Date;
  ipHash?: string;
  userAgent?: string;
}

export interface SessionRepository {
  createSession(record: CreateSessionRecord): Promise<{ id: string }>;
  findPrincipalByTokenHash(tokenHash: string): Promise<SessionPrincipal | null>;
  touchSession(sessionId: string, lastSeenAt: Date, idleExpiresAt: Date): Promise<void>;
  revokeSession(sessionId: string, revokedAt: Date, reason: string): Promise<void>;
  revokeUserSessions(userId: string, revokedAt: Date, reason: string): Promise<void>;
}

export interface SessionIssueInput {
  userId: string;
  userSecurityVersion: number;
  ipHash?: string;
  userAgent?: string;
}

export interface IssuedSession {
  token: string;
  sessionId: string;
  expiresAt: Date;
  idleExpiresAt: Date;
}

export interface SessionServiceOptions {
  absoluteLifetimeMs?: number;
  idleLifetimeMs?: number;
}

const DEFAULT_ABSOLUTE_LIFETIME_MS = 8 * 60 * 60 * 1000;
const DEFAULT_IDLE_LIFETIME_MS = 30 * 60 * 1000;

export function hashSessionToken(token: string): string {
  return crypto.createHash("sha256").update(token, "utf8").digest("hex");
}

export function generateSessionToken(): string {
  return crypto.randomBytes(32).toString("base64url");
}

export class SessionService {
  private readonly absoluteLifetimeMs: number;
  private readonly idleLifetimeMs: number;

  constructor(
    private readonly repository: SessionRepository,
    options: SessionServiceOptions = {},
  ) {
    this.absoluteLifetimeMs = options.absoluteLifetimeMs ?? DEFAULT_ABSOLUTE_LIFETIME_MS;
    this.idleLifetimeMs = options.idleLifetimeMs ?? DEFAULT_IDLE_LIFETIME_MS;
  }

  async issue(input: SessionIssueInput, now = new Date()): Promise<IssuedSession> {
    const token = generateSessionToken();
    const expiresAt = new Date(now.getTime() + this.absoluteLifetimeMs);
    const idleExpiresAt = new Date(
      Math.min(expiresAt.getTime(), now.getTime() + this.idleLifetimeMs),
    );
    const created = await this.repository.createSession({
      ...input,
      tokenHash: hashSessionToken(token),
      expiresAt,
      idleExpiresAt,
    });
    return { token, sessionId: created.id, expiresAt, idleExpiresAt };
  }

  async authenticate(token: string, now = new Date()): Promise<SessionPrincipal | null> {
    if (!token || token.length > 256) return null;
    const principal = await this.repository.findPrincipalByTokenHash(hashSessionToken(token));
    if (!principal) return null;
    if (principal.status !== "active") return null;
    if (principal.revokedAt) return null;
    if (principal.userSecurityVersion !== principal.sessionSecurityVersion) return null;
    if (principal.expiresAt.getTime() <= now.getTime()) return null;
    if (principal.idleExpiresAt.getTime() <= now.getTime()) return null;

    const nextIdleExpiry = new Date(
      Math.min(principal.expiresAt.getTime(), now.getTime() + this.idleLifetimeMs),
    );
    await this.repository.touchSession(principal.sessionId, now, nextIdleExpiry);
    return { ...principal, idleExpiresAt: nextIdleExpiry };
  }

  async revoke(token: string, reason = "logout", now = new Date()): Promise<void> {
    if (!token || token.length > 256) return;
    const principal = await this.repository.findPrincipalByTokenHash(hashSessionToken(token));
    if (!principal || principal.revokedAt) return;
    await this.repository.revokeSession(principal.sessionId, now, reason);
  }

  async revokeAllForUser(
    userId: string,
    reason = "security_event",
    now = new Date(),
  ): Promise<void> {
    await this.repository.revokeUserSessions(userId, now, reason);
  }
}
