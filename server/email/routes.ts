import { asyncHandler } from "../middleware.js";
import { randomUUID } from "node:crypto";
import { and, desc, eq, sql } from "drizzle-orm";
import { Router } from "express";
import { z } from "zod";
import { auditEvents, emailDeliveryEvents, emailOutbox, emailSuppressions } from "../../shared/schema.js";
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
  idempotencyKey: z.string().min(8).max(255).optional(), metadata: z.record(z.string(), z.unknown()).nullable().optional(),
});

export function createEmailRouter(): Router {
  const router = Router();
  router.get("/api/admin/email/outbox", requireAdminPermission("email.delivery.read"), asyncHandler(async (_req, res) =>
    res.json(await db.select().from(emailOutbox).orderBy(desc(emailOutbox.createdAt)).limit(100))));
  router.get("/api/admin/email/events", requireAdminPermission("email.delivery.read"), asyncHandler(async (_req, res) =>
    res.json(await db.select().from(emailDeliveryEvents).orderBy(desc(emailDeliveryEvents.occurredAt)).limit(200))));
  router.get("/api/admin/email/suppressions", requireAdminPermission("email.suppressions.manage"), asyncHandler(async (_req, res) =>
    res.json(await db.select().from(emailSuppressions).orderBy(desc(emailSuppressions.createdAt)).limit(500))));
  router.post("/api/admin/email/send", requireAdminPermission("email.send"), asyncHandler(async (req, res) => {
    const input = enqueueInput.parse(req.body);
    if (!env.POSTMARK_FROM_EMAIL) return res.status(503).json({ message: "Outbound email sender is not configured" });
    const [queued] = await db.insert(emailOutbox).values({ ...input, fromEmail: env.POSTMARK_FROM_EMAIL,
      fromName: env.POSTMARK_FROM_NAME, idempotencyKey: input.idempotencyKey ?? `admin:${randomUUID()}` })
      .onConflictDoNothing().returning();
    if (!queued) return res.status(409).json({ message: "An email with this idempotency key already exists" });
    res.status(202).json(queued);
  }));
  router.delete("/api/admin/email/suppressions/:id", requireAdminPermission("email.suppressions.manage"), asyncHandler(async (req, res) => {
    await db.delete(emailSuppressions).where(eq(emailSuppressions.id, req.params.id));
    res.status(204).end();
  }));
  router.post("/api/admin/email/:id/reconcile", requireAdminPermission("email.delivery.reconcile"), asyncHandler(async (req,res) => {
    const input=z.object({outcome:z.enum(["accepted","confirmed_not_sent"]),providerReference:z.string().trim().min(5).max(1000),
      providerMessageId:z.string().trim().min(1).max(255).optional(),justification:z.string().trim().min(12).max(2000)}).strict().parse(req.body);
    if (input.outcome==="accepted"&&!input.providerMessageId) return res.status(400).json({message:"A provider message identifier is required"});
    const result=await db.transaction(async transaction=>{
      const [previous]=await transaction.select().from(emailOutbox).where(eq(emailOutbox.id,req.params.id)).limit(1).for("update");
      if(!previous)return "missing";
      if(previous.status!=="uncertain")return "conflict";
      if(input.outcome==="confirmed_not_sent"&&previous.providerMessageId)return "conflict";
      const values=input.outcome==="accepted"?{status:"sent",provider:"postmark",providerMessageId:input.providerMessageId,sentAt:new Date()}:
        {status:"retry",availableAt:new Date()};
      await transaction.update(emailOutbox).set({...values,lockedAt:null,lockedBy:null,lastError:null,updatedAt:new Date()}).where(eq(emailOutbox.id,previous.id));
      await transaction.insert(emailDeliveryEvents).values({outboxId:previous.id,eventType:"operator_reconciled",payload:input});
      await transaction.insert(auditEvents).values({actorUserId:req.securityPrincipal?.userId,actorSessionId:req.securityPrincipal?.sessionId,
        action:"email.acceptance.reconcile",resourceType:"email_outbox",resourceId:previous.id,result:"success",requestId:req.requestId,
        justification:input.justification,previousState:{status:previous.status},newState:{...values,providerReference:input.providerReference}});
      return "ok";
    });
    if(result==="missing")return res.status(404).json({message:"Message not found"});
    if(result==="conflict")return res.status(409).json({message:"Message cannot be reconciled to that outcome"});
    res.json({reconciled:true});
  }));
  router.post("/api/internal/email-worker", asyncHandler(async (req, res) => {
    if (!env.NOTIFICATION_WORKER_SECRET || req.headers.authorization !== `Bearer ${env.NOTIFICATION_WORKER_SECRET}`)
      return res.status(403).json({ message: "Forbidden" });
    const dispatcher = new EmailDispatcher(new DrizzleEmailOutboxRepository(), createEmailProvider());
    res.json(await dispatcher.processBatch(`http-${randomUUID()}`, 3));
  }));
  return router;
}
