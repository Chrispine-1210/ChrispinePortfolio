export interface QueuedEmail {
  id: string;
  toEmail: string;
  fromEmail: string;
  fromName: string | null;
  replyTo: string | null;
  subject: string;
  htmlBody: string;
  textBody: string | null;
  messageType: string;
  attemptCount: number;
  maxAttempts: number;
  metadata: unknown;
}

export interface EmailProviderResult {
  provider: string;
  messageId: string;
}

export interface EmailProvider {
  readonly name: string;
  send(message: QueuedEmail): Promise<EmailProviderResult>;
}

export interface EmailOutboxRepository {
  claimBatch(workerId: string, limit: number, now: Date): Promise<QueuedEmail[]>;
  isSuppressed(email: string, now: Date, messageType?: string): Promise<boolean>;
  markSent(id: string, result: EmailProviderResult, sentAt: Date, workerId: string): Promise<void>;
  markSuppressed(id: string, at: Date, workerId: string): Promise<void>;
  markFailed(id: string, error: string, nextAttemptAt: Date | null, at: Date, workerId: string): Promise<void>;
  markUncertain(id: string, detail: string, at: Date, workerId: string, accepted?: EmailProviderResult): Promise<void>;
}

// Only an explicit provider rejection establishes that a send was not accepted.
// Transport failures, timeouts and persistence failures remain uncertain.
export class DeliveryRejectedError extends Error {
  constructor(message: string, readonly retryable = false) { super(message); }
}
