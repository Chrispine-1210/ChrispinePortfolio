import { createHash } from "node:crypto";
import { and, eq, or } from "drizzle-orm";
import { z } from "zod";
import { db } from "../db.js";
import { emailDeliveryEvents, emailOutbox, emailSuppressions } from "../../shared/schema.js";

const postmarkEventSchema = z.object({
  RecordType: z.string().min(1).max(80), MessageID: z.string().min(1).max(255).nullable(),
  Recipient: z.string().email().max(320).optional(), Email: z.string().email().max(320).optional(),
  Type: z.string().max(100).optional(), TypeCode: z.number().optional(),
  Description: z.string().max(2000).optional(), SuppressSending: z.boolean().optional(),
  Inactive: z.boolean().optional(), Metadata: z.object({outbox_id:z.string().max(255).optional()}).passthrough().optional(),
  DeliveredAt: z.string().datetime().optional(), BouncedAt: z.string().datetime().optional(),
  ReceivedAt: z.string().datetime().optional(), ChangedAt: z.string().datetime().optional(),
}).passthrough();

// Called only after the route verifies provider authorization. Correlation can
// recover an accepted send whose response or markSent transaction was lost.
export async function processPostmarkWebhook(rawBody: Buffer): Promise<{ duplicate: boolean }> {
  const event = postmarkEventSchema.parse(JSON.parse(rawBody.toString("utf8")));
  const occurredAtValue = event.DeliveredAt ?? event.BouncedAt ?? event.ReceivedAt ?? event.ChangedAt;
  const occurredAt = occurredAtValue ? new Date(occurredAtValue) : new Date();
  const fingerprint = createHash("sha256").update(rawBody).digest("hex");
  const recipient = (event.Recipient ?? event.Email)?.trim().toLowerCase();
  const type = event.RecordType.toLowerCase();
  if (!event.MessageID || !recipient) return {duplicate:false};
  const messageId = event.MessageID;
  return db.transaction(async transaction => {
    const [outbox] = await transaction.select().from(emailOutbox).where(or(
      ...(event.MessageID ? [and(eq(emailOutbox.provider,"postmark"),eq(emailOutbox.providerMessageId,messageId))] : []),
      ...(event.Metadata?.outbox_id && recipient ? [and(eq(emailOutbox.id,event.Metadata.outbox_id),eq(emailOutbox.toEmail,recipient))] : []),
    )).limit(1).for("update");
    if (!outbox || !event.MessageID || !recipient || outbox.toEmail.toLowerCase() !== recipient ||
      (outbox.providerMessageId && outbox.providerMessageId !== event.MessageID)) return {duplicate:false};
    const inserted = await transaction.insert(emailDeliveryEvents).values({outboxId:outbox.id,eventType:type,provider:"postmark",
      providerEventId:`${event.MessageID}:${event.RecordType}:${fingerprint}`,occurredAt,payload:event})
      .onConflictDoNothing().returning({id:emailDeliveryEvents.id});
    if(!inserted.length)return {duplicate:true};
    const failure = type === "bounce" || type === "spamcomplaint" || (type === "subscriptionchange" && event.SuppressSending === true);
    const suppress = type === "spamcomplaint" || (type === "bounce" && (event.Inactive === true || event.Type === "HardBounce")) ||
      (type === "subscriptionchange" && event.SuppressSending === true);
    const delivery = type === "delivery" && !["bounced","complained","suppressed"].includes(outbox.status);
    if (delivery || failure) await transaction.update(emailOutbox).set({
      status:failure ? type === "bounce" ? "bounced" : "complained" : "delivered",provider:"postmark",providerMessageId:messageId,
      lockedAt:null,lockedBy:null,lastError:failure?event.Description:null,updatedAt:new Date(),
    }).where(eq(emailOutbox.id,outbox.id));
    if (suppress) await transaction.insert(emailSuppressions).values({email:recipient,reason:type,source:"postmark_webhook",notes:event.Description,updatedAt:new Date()})
      .onConflictDoUpdate({target:emailSuppressions.email,set:{reason:type,source:"postmark_webhook",notes:event.Description,expiresAt:null,updatedAt:new Date()}});
    // Reactivation does not remove a local unsubscribe or a stronger local
    // suppression; that remains an accountable operator decision.
    return {duplicate:false};
  });
}
