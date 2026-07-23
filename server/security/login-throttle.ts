import { createHmac } from "node:crypto";

export interface LoginAttemptKeys {
  accountKeyHash: string;
  networkKeyHash: string;
}

export interface LoginAttemptRepository {
  countRecent(keys: LoginAttemptKeys, since: Date): Promise<{
    accountFailures: number;
    networkFailures: number;
  }>;
  record(keys: LoginAttemptKeys, successful: boolean, attemptedAt: Date): Promise<void>;
}

export interface LoginThrottleDecision {
  allowed: boolean;
  retryAfterSeconds: number;
  reason?: "account" | "network";
}

export interface LoginThrottleOptions {
  windowMs?: number;
  accountFailureLimit?: number;
  networkFailureLimit?: number;
}

export class LoginThrottleService {
  private readonly windowMs: number;
  private readonly accountFailureLimit: number;
  private readonly networkFailureLimit: number;

  constructor(
    private readonly repository: LoginAttemptRepository,
    private readonly pepper: string,
    options: LoginThrottleOptions = {},
  ) {
    if (pepper.length < 32) throw new Error("Login throttle pepper must contain at least 32 characters");
    this.windowMs = options.windowMs ?? 15 * 60 * 1000;
    this.accountFailureLimit = options.accountFailureLimit ?? 5;
    this.networkFailureLimit = options.networkFailureLimit ?? 25;
  }

  keys(email: string, networkAddress: string): LoginAttemptKeys {
    return {
      accountKeyHash: this.hash(`account:${email.trim().toLowerCase()}`),
      networkKeyHash: this.hash(`network:${networkAddress.trim() || "unknown"}`),
    };
  }

  async check(email: string, networkAddress: string, now = new Date()): Promise<LoginThrottleDecision> {
    const keys = this.keys(email, networkAddress);
    const counts = await this.repository.countRecent(keys, new Date(now.getTime() - this.windowMs));
    if (counts.accountFailures >= this.accountFailureLimit) {
      return { allowed: false, reason: "account", retryAfterSeconds: Math.ceil(this.windowMs / 1000) };
    }
    if (counts.networkFailures >= this.networkFailureLimit) {
      return { allowed: false, reason: "network", retryAfterSeconds: Math.ceil(this.windowMs / 1000) };
    }
    return { allowed: true, retryAfterSeconds: 0 };
  }

  async record(email: string, networkAddress: string, successful: boolean, now = new Date()): Promise<void> {
    await this.repository.record(this.keys(email, networkAddress), successful, now);
  }

  private hash(value: string): string {
    return createHmac("sha256", this.pepper).update(value).digest("hex");
  }
}
