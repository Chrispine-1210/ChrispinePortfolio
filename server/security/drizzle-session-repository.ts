import { and, eq, isNull } from "drizzle-orm";
import { db } from "../db.js";
import {
  permissions,
  rolePermissions,
  sessions,
  userRoles,
  users,
} from "../../shared/schema.js";
import type {
  CreateSessionRecord,
  SessionPrincipal,
  SessionRepository,
} from "./session-service.js";

export class DrizzleSessionRepository implements SessionRepository {
  async createSession(record: CreateSessionRecord): Promise<{ id: string }> {
    const [created] = await db.insert(sessions).values(record).returning({ id: sessions.id });
    if (!created) throw new Error("Failed to create session");
    return created;
  }

  async findPrincipalByTokenHash(tokenHash: string): Promise<SessionPrincipal | null> {
    const rows = await db
      .select({
        sessionId: sessions.id,
        userId: users.id,
        email: users.email,
        status: users.status,
        userSecurityVersion: users.securityVersion,
        sessionSecurityVersion: sessions.userSecurityVersion,
        expiresAt: sessions.expiresAt,
        idleExpiresAt: sessions.idleExpiresAt,
        revokedAt: sessions.revokedAt,
        permission: permissions.key,
      })
      .from(sessions)
      .innerJoin(users, eq(sessions.userId, users.id))
      .leftJoin(userRoles, eq(userRoles.userId, users.id))
      .leftJoin(rolePermissions, eq(rolePermissions.roleId, userRoles.roleId))
      .leftJoin(permissions, eq(permissions.id, rolePermissions.permissionId))
      .where(eq(sessions.tokenHash, tokenHash));

    const first = rows[0];
    if (!first || !first.email) return null;
    return {
      sessionId: first.sessionId,
      userId: first.userId,
      email: first.email,
      status: first.status,
      userSecurityVersion: first.userSecurityVersion,
      sessionSecurityVersion: first.sessionSecurityVersion,
      expiresAt: first.expiresAt,
      idleExpiresAt: first.idleExpiresAt,
      revokedAt: first.revokedAt,
      permissions: [...new Set(rows.flatMap((row) => (row.permission ? [row.permission] : [])))],
    };
  }

  async touchSession(sessionId: string, lastSeenAt: Date, idleExpiresAt: Date): Promise<void> {
    await db
      .update(sessions)
      .set({ lastSeenAt, idleExpiresAt })
      .where(and(eq(sessions.id, sessionId), isNull(sessions.revokedAt)));
  }

  async revokeSession(sessionId: string, revokedAt: Date, reason: string): Promise<void> {
    await db
      .update(sessions)
      .set({ revokedAt, revokedReason: reason })
      .where(and(eq(sessions.id, sessionId), isNull(sessions.revokedAt)));
  }

  async revokeUserSessions(userId: string, revokedAt: Date, reason: string): Promise<void> {
    await db
      .update(sessions)
      .set({ revokedAt, revokedReason: reason })
      .where(and(eq(sessions.userId, userId), isNull(sessions.revokedAt)));
  }
}
