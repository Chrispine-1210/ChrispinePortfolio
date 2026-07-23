import { and, count, eq, gte } from "drizzle-orm";
import { db } from "../db.js";
import { authenticationAttempts } from "../../shared/schema.js";
import type { LoginAttemptKeys, LoginAttemptRepository } from "./login-throttle.js";

export class DrizzleLoginAttemptRepository implements LoginAttemptRepository {
  async countRecent(keys: LoginAttemptKeys, since: Date): Promise<{
    accountFailures: number;
    networkFailures: number;
  }> {
    const [accountResult, networkResult] = await Promise.all([
      db.select({ value: count() }).from(authenticationAttempts).where(and(
        eq(authenticationAttempts.accountKeyHash, keys.accountKeyHash),
        eq(authenticationAttempts.successful, false),
        gte(authenticationAttempts.attemptedAt, since),
      )),
      db.select({ value: count() }).from(authenticationAttempts).where(and(
        eq(authenticationAttempts.networkKeyHash, keys.networkKeyHash),
        eq(authenticationAttempts.successful, false),
        gte(authenticationAttempts.attemptedAt, since),
      )),
    ]);
    return {
      accountFailures: Number(accountResult[0]?.value ?? 0),
      networkFailures: Number(networkResult[0]?.value ?? 0),
    };
  }

  async record(keys: LoginAttemptKeys, successful: boolean, attemptedAt: Date): Promise<void> {
    await db.insert(authenticationAttempts).values({ ...keys, successful, attemptedAt });
  }
}
