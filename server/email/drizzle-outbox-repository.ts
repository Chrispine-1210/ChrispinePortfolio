import { and, eq, gt, isNull, or, sql } from "drizzle-orm";
import { db } from "../db.js";
import {
  emailDeliveryEvents,
  emailOutbox,
  emailSuppressions,
} from "../../shared/schema.js";
import type {
  EmailOutboxRepository,
  EmailProviderResult,
  QueuedEmail,
} from "./types.js";

interface ClaimedRow extends Record<string, unknown> {
  id: string;
  to_email: string;
  from_email: string;
  from_name: string | null;
  reply_to: string | null;
  subject: string;
  html_body: string;
  text_body: string | null;
  message_type: string;
  attempt_count: number;
  max_attempts: number;
  metadata: unknown;
}

export class DrizzleEmailOutboxRepository implements EmailOutboxRepository {
  async claimBatch(workerId: string, limit: number, now: Date): Promise<QueuedEmail[]> {
    const result = await db.execute<ClaimedRow>(sql`
      WITH candidates AS (
        SELECT "id"
        FROM "email_outbox"
        WHERE "status" IN ('pending', 'retry')
          AND "available_at" <= ${now}
          AND ("locked_at" IS NULL OR "locked_at" < ${new Date(now.getTime() - 10 * 60 * 1000)})
        ORDER BY "available_at", "created_at"
        FOR UPDATE SKIP LOCKED
        LIMIT ${limit}
      )
      UPDATE "email_outbox" AS outbox
      SET "status" = 'processing',
          "locked_at" = ${now},
          "locked_by" = ${workerId},
          "updated_at" = ${now}
      FROM candidates
      WHERE outbox."id" = candidates."id"
      RETURNING outbox."id", outbox."to_email", outbox."from_email",
        outbox."from_name", outbox."reply_to", outbox."subject",
        outbox."html_body", outbox."text_body", outbox."message_type",
        outbox."attempt_count", outbox."max_attempts", outbox."metadata"
    `);
    return result.rows.map((row) => ({
      id: row.id,
      toEmail: row.to_email,
      fromEmail: row.from_email,
      fromName: row.from_name,
      replyTo: row.reply_to,
      subject: row.subject,
      htmlBody: row.html_body,
      textBody: row.text_body,
      messageType: row.message_type,
      attemptCount: row.attempt_count,
      maxAttempts: row.max_attempts,
      metadata: row.metadata,
    }));
  }

  async isSuppressed(email: string, now: Date): Promise<boolean> {
    const [suppression] = await db.select({ id: emailSuppressions.id })
      .from(emailSuppressions)
      .where(and(
        eq(emailSuppressions.email, email.trim().toLowerCase()),
        or(isNull(emailSuppressions.expiresAt), gt(emailSuppressions.expiresAt, now)),
      )).limit(1);
    return Boolean(suppression);
  }

  async markSent(id: string, result: EmailProviderResult, sentAt: Date): Promise<void> {
    await db.transaction(async (transaction) => {
      await transaction.update(emailOutbox).set({
        status: "sent",
        provider: result.provider,
        providerMessageId: result.messageId,
        attemptCount: sql`${emailOutbox.attemptCount} + 1`,
        lockedAt: null,
        lockedBy: null,
        lastError: null,
        sentAt,
        updatedAt: sentAt,
      }).where(eq(emailOutbox.id, id));
      await transaction.insert(emailDeliveryEvents).values({
        outboxId: id,
        eventType: "sent",
        provider: result.provider,
        occurredAt: sentAt,
        payload: { providerMessageId: result.messageId },
      });
    });
  }

  async markSuppressed(id: string, at: Date): Promise<void> {
    await db.transaction(async (transaction) => {
      await transaction.update(emailOutbox).set({
        status: "suppressed",
        lockedAt: null,
        lockedBy: null,
        updatedAt: at,
      }).where(eq(emailOutbox.id, id));
      await transaction.insert(emailDeliveryEvents).values({
        outboxId: id,
        eventType: "suppressed",
        occurredAt: at,
      });
    });
  }

  async markFailed(id: string, error: string, nextAttemptAt: Date | null, at: Date): Promise<void> {
    await db.transaction(async (transaction) => {
      await transaction.update(emailOutbox).set({
        status: nextAttemptAt ? "retry" : "failed",
        attemptCount: sql`${emailOutbox.attemptCount} + 1`,
        availableAt: nextAttemptAt ?? at,
        lockedAt: null,
        lockedBy: null,
        lastError: error,
        updatedAt: at,
      }).where(eq(emailOutbox.id, id));
      await transaction.insert(emailDeliveryEvents).values({
        outboxId: id,
        eventType: nextAttemptAt ? "retry_scheduled" : "failed",
        occurredAt: at,
        payload: { error, nextAttemptAt: nextAttemptAt?.toISOString() ?? null },
      });
    });
  }
}
