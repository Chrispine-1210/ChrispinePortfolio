import { randomUUID } from "node:crypto";
import { desc, eq } from "drizzle-orm";
import { Router } from "express";
import { z } from "zod";
import { emailDeliveryEvents, emailOutbox, emailSuppressions } from "../../shared/schema.js";
import { requireAdminPermission } from "../custom-auth.js";
import { db } from "../db.js";
import { env } from "../env.js";
import { EmailDispatcher } from "./dispatcher.js";
import { DrizzleEmailOutboxRepository } from "./drizzle-outbox-repository.js";
import { createEmailProvider } from "./provider-factory.js";

const enqueueInput = z.object({
  toEmail: z.string().email().max(320), subject: z.string().trim().min(1).max(500),
  htmlBody: z.string().min(1).max(500_000), textBody: z.string().max(200_000).nullable().optional(),
  replyTo: z.string().email().max(320).nullable().optional(),
  messageType: z.enum(["transactional", "marketing"]).default("transactional"),
  idempotencyKey: z.string().min(8).max(255).optional(), metadata: z.record(z.unknown()).nullable().optional(),
});

export function createEmailRouter(): Router {
  const router = Router();
  router.get("/api/admin/email/outbox", requireAdminPermission("email.delivery.read"), async (_req, res) =>
    res.json(await db.select().from(emailOutbox).orderBy(desc(emailOutbox.createdAt)).limit(100)));
  router.get("/api/admin/email/events", requireAdminPermission("email.delivery.read"), async (_req, res) =>
    res.json(await db.select().from(emailDeliveryEvents).orderBy(desc(emailDeliveryEvents.occurredAt)).limit(200)));
  router.get("/api/admin/email/suppressions", requireAdminPermission("email.suppressions.manage"), async (_req, res) =>
    res.json(await db.select().from(emailSuppressions).orderBy(desc(emailSuppressions.createdAt)).limit(500)));
  router.post("/api/admin/email/send", requireAdminPermission("email.send"), async (req, res) => {
    const input = enqueueInput.parse(req.body);
    if (!env.POSTMARK_FROM_EMAIL) return res.status(503).json({ message: "Outbound email sender is not configured" });
    const [queued] = await db.insert(emailOutbox).values({ ...input, fromEmail: env.POSTMARK_FROM_EMAIL,
      fromName: env.POSTMARK_FROM_NAME, idempotencyKey: input.idempotencyKey ?? `admin:${randomUUID()}` })
      .onConflictDoNothing().returning();
    if (!queued) return res.status(409).json({ message: "An email with this idempotency key already exists" });
    res.status(202).json(queued);
  });
  router.delete("/api/admin/email/suppressions/:id", requireAdminPermission("email.suppressions.manage"), async (req, res) => {
    await db.delete(emailSuppressions).where(eq(emailSuppressions.id, req.params.id));
    res.status(204).end();
  });
  router.post("/api/internal/email-worker", async (req, res) => {
    if (!env.NOTIFICATION_WORKER_SECRET || req.headers.authorization !== `Bearer ${env.NOTIFICATION_WORKER_SECRET}`)
      return res.status(403).json({ message: "Forbidden" });
    const dispatcher = new EmailDispatcher(new DrizzleEmailOutboxRepository(), createEmailProvider());
    res.json(await dispatcher.processBatch(`http-${randomUUID()}`, 50));
  });
  return router;
}
