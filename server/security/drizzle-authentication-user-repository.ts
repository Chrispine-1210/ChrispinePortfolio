import { eq } from "drizzle-orm";
import { db } from "../db.js";
import { users } from "../../shared/schema.js";
import type {
  AuthenticationUser,
  AuthenticationUserRepository,
} from "./authentication-service.js";

export class DrizzleAuthenticationUserRepository implements AuthenticationUserRepository {
  async findByEmail(email: string): Promise<AuthenticationUser | null> {
    const [user] = await db.select({
      id: users.id,
      email: users.email,
      passwordHash: users.passwordHash,
      status: users.status,
      securityVersion: users.securityVersion,
      failedLoginAttempts: users.failedLoginAttempts,
      lockedUntil: users.lockedUntil,
    }).from(users).where(eq(users.email, email)).limit(1);
    if (!user?.email) return null;
    return { ...user, email: user.email };
  }

  async recordFailure(userId: string, failedLoginAttempts: number, lockedUntil: Date | null): Promise<void> {
    await db.update(users).set({ failedLoginAttempts, lockedUntil, updatedAt: new Date() })
      .where(eq(users.id, userId));
  }

  async recordSuccess(userId: string, at: Date): Promise<void> {
    await db.update(users).set({
      failedLoginAttempts: 0,
      lockedUntil: null,
      lastLoginAt: at,
      updatedAt: at,
    }).where(eq(users.id, userId));
  }
}
