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
  isSuppressed(email: string, now: Date): Promise<boolean>;
  markSent(id: string, result: EmailProviderResult, sentAt: Date): Promise<void>;
  markSuppressed(id: string, at: Date): Promise<void>;
  markFailed(id: string, error: string, nextAttemptAt: Date | null, at: Date): Promise<void>;
}
