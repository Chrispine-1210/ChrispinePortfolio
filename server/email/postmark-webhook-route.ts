import express, { type Express, type Request, type Response } from "express";
import { ZodError } from "zod";
import { env } from "../env.js";
import {
  processPostmarkWebhook,
} from "./postmark-webhook.js";
import { verifyPostmarkBasicAuthorization } from "./postmark-webhook-auth.js";

export function setupPostmarkWebhookRoute(app: Express): void {
  app.post(
    "/api/webhooks/postmark",
    express.raw({ type: "application/json", limit: "256kb" }),
    async (request: Request, response: Response) => {
      if (
        env.EMAIL_PROVIDER !== "postmark" ||
        !env.POSTMARK_WEBHOOK_USERNAME ||
        !env.POSTMARK_WEBHOOK_PASSWORD
      ) {
        return response.status(404).json({ message: "Not found" });
      }
      const authorized = verifyPostmarkBasicAuthorization(
        request.headers.authorization,
        env.POSTMARK_WEBHOOK_USERNAME,
        env.POSTMARK_WEBHOOK_PASSWORD,
      );
      if (!authorized) return response.status(403).json({ message: "Forbidden" });
      if (!Buffer.isBuffer(request.body)) {
        return response.status(400).json({ message: "Raw webhook body required" });
      }
      try {
        const result = await processPostmarkWebhook(request.body);
        return response.json({ received: true, duplicate: result.duplicate });
      } catch (error) {
        if (error instanceof SyntaxError || error instanceof ZodError) {
          return response.status(400).json({ message: "Invalid webhook payload" });
        }
        console.error("Postmark webhook processing failed", error);
        return response.status(500).json({ message: "Webhook processing failed" });
      }
    },
  );
}
