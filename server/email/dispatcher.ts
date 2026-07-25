import type { EmailOutboxRepository, EmailProvider } from "./types.js";

export interface DispatchSummary {
  claimed: number;
  sent: number;
  suppressed: number;
  retried: number;
  failed: number;
}

export class EmailDispatcher {
  constructor(
    private readonly repository: EmailOutboxRepository,
    private readonly provider: EmailProvider,
  ) {}

  async processBatch(workerId: string, limit = 25, now = new Date()): Promise<DispatchSummary> {
    if (!workerId || workerId.length > 120) throw new Error("A valid email worker identifier is required");
    const boundedLimit = Math.max(1, Math.min(limit, 100));
    const messages = await this.repository.claimBatch(workerId, boundedLimit, now);
    const summary: DispatchSummary = {
      claimed: messages.length,
      sent: 0,
      suppressed: 0,
      retried: 0,
      failed: 0,
    };

    for (const message of messages) {
      try {
        if (await this.repository.isSuppressed(message.toEmail, now)) {
          await this.repository.markSuppressed(message.id, now);
          summary.suppressed += 1;
          continue;
        }
        const result = await this.provider.send(message);
        await this.repository.markSent(message.id, result, now);
        summary.sent += 1;
      } catch (error) {
        const attempt = message.attemptCount + 1;
        const terminal = attempt >= message.maxAttempts;
        const nextAttemptAt = terminal
          ? null
          : new Date(now.getTime() + this.retryDelayMs(attempt));
        const detail = error instanceof Error ? error.message : "Unknown email provider failure";
        await this.repository.markFailed(message.id, detail.slice(0, 2000), nextAttemptAt, now);
        if (terminal) summary.failed += 1;
        else summary.retried += 1;
      }
    }
    return summary;
  }

  private retryDelayMs(attempt: number): number {
    return Math.min(24 * 60 * 60 * 1000, 60_000 * 2 ** Math.max(0, attempt - 1));
  }
}
