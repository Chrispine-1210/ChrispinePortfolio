import { createHash } from "node:crypto";
import { and, eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "../db.js";
import { emailDeliveryEvents, emailOutbox, emailSuppressions } from "../../shared/schema.js";

const postmarkEventSchema = z.object({
  RecordType: z.string().min(1).max(80),
  MessageID: z.string().min(1).max(255),
  Recipient: z.string().email().max(320).optional(),
  Email: z.string().email().max(320).optional(),
  Type: z.string().max(100).optional(),
  TypeCode: z.number().optional(),
  Description: z.string().max(2000).optional(),
  DeliveredAt: z.string().datetime().optional(),
  BouncedAt: z.string().datetime().optional(),
  ReceivedAt: z.string().datetime().optional(),
}).passthrough();

export async function processPostmarkWebhook(rawBody: Buffer): Promise<{ duplicate: boolean }> {
  const parsedJson = JSON.parse(rawBody.toString("utf8")) as unknown;
  const event = postmarkEventSchema.parse(parsedJson);
  const occurredAtValue = event.DeliveredAt ?? event.BouncedAt ?? event.ReceivedAt;
  const occurredAt = occurredAtValue ? new Date(occurredAtValue) : new Date();
  const eventFingerprint = createHash("sha256")
    .update(rawBody)
    .digest("hex");
  const providerEventId = `${event.MessageID}:${event.RecordType}:${eventFingerprint}`;

  return db.transaction(async (transaction) => {
    const [outbox] = await transaction.select({ id: emailOutbox.id })
      .from(emailOutbox)
      .where(and(
        eq(emailOutbox.provider, "postmark"),
        eq(emailOutbox.providerMessageId, event.MessageID),
      )).limit(1);
    if (!outbox) return { duplicate: false };

    const inserted = await transaction.insert(emailDeliveryEvents).values({
      outboxId: outbox.id,
      eventType: event.RecordType.toLowerCase(),
      provider: "postmark",
      providerEventId,
      occurredAt,
      payload: event,
    }).onConflictDoNothing().returning({ id: emailDeliveryEvents.id });
    if (!inserted.length) return { duplicate: true };

    const normalizedType = event.RecordType.toLowerCase();
    if (normalizedType === "delivery") {
      await transaction.update(emailOutbox).set({ status: "delivered", updatedAt: occurredAt })
        .where(eq(emailOutbox.id, outbox.id));
    }
    if (["bounce", "spamcomplaint", "subscriptionchange"].includes(normalizedType)) {
      await transaction.update(emailOutbox).set({
        status: normalizedType === "bounce" ? "bounced" : "complained",
        lastError: event.Description,
        updatedAt: occurredAt,
      }).where(eq(emailOutbox.id, outbox.id));
      const recipient = (event.Recipient ?? event.Email)?.trim().toLowerCase();
      if (recipient) {
        await transaction.insert(emailSuppressions).values({
          email: recipient,
          reason: normalizedType,
          source: "postmark_webhook",
          notes: event.Description,
          updatedAt: occurredAt,
        }).onConflictDoUpdate({
          target: emailSuppressions.email,
          set: {
            reason: normalizedType,
            source: "postmark_webhook",
            notes: event.Description,
            expiresAt: null,
            updatedAt: occurredAt,
          },
        });
      }
    }
    return { duplicate: false };
  });
}
