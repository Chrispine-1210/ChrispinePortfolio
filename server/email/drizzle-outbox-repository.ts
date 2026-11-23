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
      WITH expired AS (
        UPDATE email_outbox SET status='uncertain', locked_at=NULL, locked_by=NULL,
          last_error='Worker lease expired; provider acceptance must be reconciled', updated_at=${now}
        WHERE status='processing' AND locked_at < ${new Date(now.getTime() - 10 * 60 * 1000)}
        RETURNING id
      ), expired_events AS (
        INSERT INTO email_delivery_events(outbox_id,event_type,occurred_at)
        SELECT id,'acceptance_uncertain',${now} FROM expired
      ), candidates AS (
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

  async isSuppressed(email: string, now: Date, messageType = "marketing"): Promise<boolean> {
    const [suppression] = await db.select({ id: emailSuppressions.id })
      .from(emailSuppressions)
      .where(and(
        eq(emailSuppressions.email, email.trim().toLowerCase()),
        ...(messageType === "transactional" ? [sql`${emailSuppressions.reason} <> 'unsubscribe'`] : []),
        or(isNull(emailSuppressions.expiresAt), gt(emailSuppressions.expiresAt, now)),
      )).limit(1);
    return Boolean(suppression);
  }

  async markSent(id: string, result: EmailProviderResult, sentAt: Date, workerId: string): Promise<void> {
    await db.transaction(async (transaction) => {
      const changed = await transaction.update(emailOutbox).set({
        status: "sent",
        provider: result.provider,
        providerMessageId: result.messageId,
        attemptCount: sql`${emailOutbox.attemptCount} + 1`,
        lockedAt: null,
        lockedBy: null,
        lastError: null,
        sentAt,
        updatedAt: sentAt,
      }).where(and(eq(emailOutbox.id, id), eq(emailOutbox.status, "processing"), eq(emailOutbox.lockedBy, workerId))).returning({id:emailOutbox.id});
      if (!changed.length) throw new Error("Email worker lease is no longer owned");
      await transaction.insert(emailDeliveryEvents).values({
        outboxId: id,
        eventType: "sent",
        provider: result.provider,
        occurredAt: sentAt,
        payload: { providerMessageId: result.messageId },
      });
    });
  }

  async markSuppressed(id: string, at: Date, workerId: string): Promise<void> {
    await db.transaction(async (transaction) => {
      const changed = await transaction.update(emailOutbox).set({
        status: "suppressed",
        lockedAt: null,
        lockedBy: null,
        updatedAt: at,
      }).where(and(eq(emailOutbox.id, id), eq(emailOutbox.status, "processing"), eq(emailOutbox.lockedBy, workerId))).returning({id:emailOutbox.id});
      if (!changed.length) throw new Error("Email worker lease is no longer owned");
      await transaction.insert(emailDeliveryEvents).values({
        outboxId: id,
        eventType: "suppressed",
        occurredAt: at,
      });
    });
  }

  async markFailed(id: string, error: string, nextAttemptAt: Date | null, at: Date, workerId: string): Promise<void> {
    await db.transaction(async (transaction) => {
      const changed = await transaction.update(emailOutbox).set({
        status: nextAttemptAt ? "retry" : "failed",
        attemptCount: sql`${emailOutbox.attemptCount} + 1`,
        availableAt: nextAttemptAt ?? at,
        lockedAt: null,
        lockedBy: null,
        lastError: error,
        updatedAt: at,
      }).where(and(eq(emailOutbox.id, id), eq(emailOutbox.status, "processing"), eq(emailOutbox.lockedBy, workerId))).returning({id:emailOutbox.id});
      if (!changed.length) throw new Error("Email worker lease is no longer owned");
      await transaction.insert(emailDeliveryEvents).values({
        outboxId: id,
        eventType: nextAttemptAt ? "retry_scheduled" : "failed",
        occurredAt: at,
        payload: { error, nextAttemptAt: nextAttemptAt?.toISOString() ?? null },
      });
    });
  }
  async markUncertain(id: string, detail: string, at: Date, workerId: string, accepted?: EmailProviderResult): Promise<void> {
    await db.transaction(async transaction => {
      const changed = await transaction.update(emailOutbox).set({ status: "uncertain", lockedAt: null, lockedBy: null,
        lastError: detail, updatedAt: at, ...(accepted ? {provider:accepted.provider,providerMessageId:accepted.messageId} : {}) })
        .where(and(eq(emailOutbox.id,id),eq(emailOutbox.status,"processing"),eq(emailOutbox.lockedBy,workerId))).returning({id:emailOutbox.id});
      // An authenticated callback may already have resolved delivery. Never
      // overwrite that state, or the state owned by another worker.
      if (!changed.length) return;
      await transaction.insert(emailDeliveryEvents).values({outboxId:id,eventType:"acceptance_uncertain",occurredAt:at,
        payload: {detail,...(accepted ? {provider:accepted.provider,providerMessageId:accepted.messageId} : {})}});
    });
  }

}
