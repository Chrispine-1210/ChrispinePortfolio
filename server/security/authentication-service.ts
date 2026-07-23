import { verifyPasswordArgon2id } from "./passwords.js";
import type { AuditWriter } from "./audit-repository.js";
import type { LoginThrottleService } from "./login-throttle.js";
import type { IssuedSession, SessionService } from "./session-service.js";

// A valid, deliberately unusable Argon2id hash keeps unknown-account and known-account
// login paths computationally comparable without embedding a usable credential.
const DUMMY_PASSWORD_HASH = "$argon2id$v=19$m=65536,p=1,t=3$1rEoXjG614xMxwlh7tJlOA$SKOPnwDW5GvOAUx1N0oNcxf5u+Cztp+vXvCQ/6a4+MU";

export interface AuthenticationUser {
  id: string;
  email: string;
  passwordHash: string | null;
  status: string;
  securityVersion: number;
  failedLoginAttempts: number;
  lockedUntil: Date | null;
}

export interface AuthenticationUserRepository {
  findByEmail(email: string): Promise<AuthenticationUser | null>;
  recordFailure(userId: string, failedLoginAttempts: number, lockedUntil: Date | null): Promise<void>;
  recordSuccess(userId: string, at: Date): Promise<void>;
}

export type LoginResult =
  | { outcome: "success"; user: AuthenticationUser; session: IssuedSession }
  | { outcome: "invalid" }
  | { outcome: "throttled"; retryAfterSeconds: number };

export interface LoginContext {
  networkAddress: string;
  userAgent?: string;
  requestId?: string;
}

export class AuthenticationService {
  constructor(
    private readonly users: AuthenticationUserRepository,
    private readonly sessions: SessionService,
    private readonly throttle: LoginThrottleService,
    private readonly audit: AuditWriter,
  ) {}

  async login(emailInput: string, password: string, context: LoginContext, now = new Date()): Promise<LoginResult> {
    const email = emailInput.trim().toLowerCase();
    const throttleDecision = await this.throttle.check(email, context.networkAddress, now);
    if (!throttleDecision.allowed) {
      await this.appendAudit(null, "identity.login.throttled", "denied", context, {
        reason: throttleDecision.reason,
      });
      return { outcome: "throttled", retryAfterSeconds: throttleDecision.retryAfterSeconds };
    }

    const user = await this.users.findByEmail(email);
    const locked = Boolean(user?.lockedUntil && user.lockedUntil.getTime() > now.getTime());
    const suppliedPasswordMatches = await verifyPasswordArgon2id(
      user?.passwordHash ?? DUMMY_PASSWORD_HASH,
      password,
    );
    const passwordValid = Boolean(
      user?.passwordHash && !locked && user.status === "active" && suppliedPasswordMatches,
    );

    await this.throttle.record(email, context.networkAddress, passwordValid, now);
    if (!user || !passwordValid) {
      if (user && !locked) {
        const failures = user.failedLoginAttempts + 1;
        await this.users.recordFailure(user.id, failures, this.lockUntil(failures, now));
      }
      await this.appendAudit(user?.id ?? null, "identity.login.failed", "denied", context, {
        locked,
      });
      return { outcome: "invalid" };
    }

    await this.users.recordSuccess(user.id, now);
    const keys = this.throttle.keys(email, context.networkAddress);
    const session = await this.sessions.issue({
      userId: user.id,
      userSecurityVersion: user.securityVersion,
      ipHash: keys.networkKeyHash,
      userAgent: context.userAgent?.slice(0, 1000),
    }, now);
    await this.audit.append({
      actorUserId: user.id,
      actorSessionId: session.sessionId,
      action: "identity.login.succeeded",
      resourceType: "session",
      resourceId: session.sessionId,
      result: "success",
      requestId: context.requestId,
      ipHash: keys.networkKeyHash,
      userAgent: context.userAgent?.slice(0, 1000),
    });
    return { outcome: "success", user, session };
  }

  private lockUntil(failures: number, now: Date): Date | null {
    if (failures < 5) return null;
    const exponent = Math.min(failures - 5, 5);
    return new Date(now.getTime() + 5 * 60 * 1000 * 2 ** exponent);
  }

  private async appendAudit(
    actorUserId: string | null,
    action: string,
    result: string,
    context: LoginContext,
    metadata: Record<string, unknown>,
  ): Promise<void> {
    const keys = this.throttle.keys("audit-placeholder", context.networkAddress);
    await this.audit.append({
      actorUserId,
      action,
      resourceType: "authentication",
      result,
      requestId: context.requestId,
      ipHash: keys.networkKeyHash,
      userAgent: context.userAgent?.slice(0, 1000),
      metadata,
    });
  }
}
