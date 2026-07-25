import { Router } from "express";
import Twilio from "twilio";
import { env } from "../env.js";
import { db } from "../db.js";
import { channelOutbox } from "../../shared/schema.js";
import { eq } from "drizzle-orm";

export function createTwilioWebhookRouter(): Router {
  const router = Router();
  router.post("/api/webhooks/twilio/status", async (req, res) => {
    if (!env.TWILIO_AUTH_TOKEN || !env.PUBLIC_WEBHOOK_BASE_URL) return res.status(404).json({ message: "Not found" });
    const signature = req.header("X-Twilio-Signature");
    const requestUrl = `${env.PUBLIC_WEBHOOK_BASE_URL.replace(/\/$/, "")}${req.originalUrl}`;
    const valid = Boolean(signature) && Twilio.validateRequest(env.TWILIO_AUTH_TOKEN, signature!, requestUrl, req.body ?? {});
    if (!valid) return res.status(403).json({ message: "Forbidden" });
    const messageSid = typeof req.body?.MessageSid === "string" ? req.body.MessageSid : undefined;
    const messageStatus = typeof req.body?.MessageStatus === "string" ? req.body.MessageStatus : undefined;
    if (messageSid && messageStatus) {
      const terminalFailure = ["failed", "undelivered", "canceled"].includes(messageStatus);
      const delivered = messageStatus === "delivered" || messageStatus === "read";
      await db.update(channelOutbox).set({
        status: delivered ? "delivered" : terminalFailure ? "failed" : "sent",
        lastError: terminalFailure ? String(req.body.ErrorMessage ?? req.body.ErrorCode ?? messageStatus) : null,
        updatedAt: new Date(),
      }).where(eq(channelOutbox.providerMessageId, messageSid));
    }
    res.status(204).end();
  });
  return router;
}
