import { Router } from "express";
import { and, desc, eq, gt, isNull, lte, sql } from "drizzle-orm";
import { z } from "zod";
import { db } from "../db.js";
import { requireAdminPermission } from "../custom-auth.js";
import {
  emailSuppressions,
  newsletterSubscribers,
  notificationActionTokens,
  notificationCampaigns,
  notificationInbox,
  pushSubscriptions,
} from "../../shared/schema.js";
import { hashNotificationActionToken } from "./action-token.js";

const campaignInput = z.object({
  name: z.string().trim().min(1).max(180),
  subject: z.string().max(500).optional(),
  htmlContent: z.string().max(500_000).optional(),
  textContent: z.string().max(200_000).optional(),
  channels: z.array(z.enum(["email", "sms", "whatsapp", "push", "in_app"])).min(1),
  audience: z.record(z.unknown()).default({}),
  scheduledAt: z.coerce.date().optional(),
});

const pushInput = z.object({
  endpoint: z.string().url().max(4096),
  keys: z.object({ p256dh: z.string().min(16).max(4096), auth: z.string().min(8).max(1024) }),
  expirationTime: z.number().nullable().optional(),
});

export function createNotificationRouter(): Router {
  const router = Router();

  router.get("/api/admin/campaigns", requireAdminPermission("campaigns.manage"), async (_req, res) => {
    const campaigns = await db.select().from(notificationCampaigns)
      .orderBy(desc(notificationCampaigns.createdAt)).limit(100);
    res.json(campaigns);
  });

  router.post("/api/admin/campaigns", requireAdminPermission("campaigns.manage"), async (req, res) => {
    const input = campaignInput.parse(req.body);
    const scheduledAt = input.scheduledAt ?? null;
    const status = scheduledAt ? "scheduled" : "draft";
    const [campaign] = await db.insert(notificationCampaigns).values({
      ...input,
      scheduledAt,
      status,
      createdBy: req.securityPrincipal?.userId ?? null,
    }).returning();
    res.status(201).json(campaign);
  });

  router.post("/api/admin/campaigns/:id/cancel", requireAdminPermission("campaigns.manage"), async (req, res) => {
    const [campaign] = await db.update(notificationCampaigns)
      .set({ status: "cancelled", updatedAt: new Date() })
      .where(and(eq(notificationCampaigns.id, req.params.id), eq(notificationCampaigns.status, "scheduled")))
      .returning();
    if (!campaign) return res.status(409).json({ message: "Only scheduled campaigns can be cancelled" });
    res.json(campaign);
  });

  router.post("/api/newsletter/unsubscribe", async (req, res) => {
    const { token } = z.object({ token: z.string().min(32).max(256) }).parse(req.body);
    const now = new Date();
    const result = await db.transaction(async (transaction) => {
      const [action] = await transaction.update(notificationActionTokens)
        .set({ consumedAt: now })
        .where(and(
          eq(notificationActionTokens.tokenHash, hashNotificationActionToken(token)),
          eq(notificationActionTokens.purpose, "newsletter_unsubscribe"),
          isNull(notificationActionTokens.consumedAt),
          gt(notificationActionTokens.expiresAt, now),
        )).returning();
      if (!action) return null;
      await transaction.update(newsletterSubscribers).set({ isActive: false, unsubscribedAt: now })
        .where(eq(newsletterSubscribers.email, action.email));
      await transaction.insert(emailSuppressions).values({
        email: action.email.toLowerCase(), reason: "unsubscribe", source: "secure_link",
      }).onConflictDoUpdate({
        target: emailSuppressions.email,
        set: { reason: "unsubscribe", source: "secure_link", expiresAt: null, updatedAt: now },
      });
      return action;
    });
    if (!result) return res.status(400).json({ message: "This unsubscribe link is invalid or expired" });
    res.json({ unsubscribed: true });
  });

  router.get("/api/notifications", requireAdminPermission("notifications.read"), async (req, res) => {
    const userId = req.securityPrincipal?.userId;
    if (!userId) return res.status(409).json({ message: "Notification inbox requires database authentication" });
    const notifications = await db.select().from(notificationInbox)
      .where(and(eq(notificationInbox.userId, userId), isNull(notificationInbox.archivedAt)))
      .orderBy(desc(notificationInbox.createdAt)).limit(100);
    res.json(notifications);
  });

  router.post("/api/notifications/:id/read", requireAdminPermission("notifications.read"), async (req, res) => {
    const userId = req.securityPrincipal?.userId;
    if (!userId) return res.status(409).json({ message: "Notification inbox requires database authentication" });
    const [notification] = await db.update(notificationInbox).set({ readAt: new Date() })
      .where(and(eq(notificationInbox.id, req.params.id), eq(notificationInbox.userId, userId))).returning();
    if (!notification) return res.status(404).json({ message: "Notification not found" });
    res.json(notification);
  });

  router.post("/api/push/subscriptions", requireAdminPermission("notifications.read"), async (req, res) => {
    const userId = req.securityPrincipal?.userId;
    if (!userId) return res.status(409).json({ message: "Push subscriptions require database authentication" });
    const input = pushInput.parse(req.body);
    const expiresAt = input.expirationTime ? new Date(input.expirationTime) : null;
    const [subscription] = await db.insert(pushSubscriptions).values({
      userId, endpoint: input.endpoint, p256dh: input.keys.p256dh, auth: input.keys.auth,
      userAgent: req.headers["user-agent"], expiresAt,
    }).onConflictDoUpdate({
      target: pushSubscriptions.endpoint,
      set: { userId, p256dh: input.keys.p256dh, auth: input.keys.auth, expiresAt, revokedAt: null, updatedAt: new Date() },
    }).returning();
    res.status(201).json({ id: subscription.id });
  });

  router.delete("/api/push/subscriptions", requireAdminPermission("notifications.read"), async (req, res) => {
    const userId = req.securityPrincipal?.userId;
    const { endpoint } = z.object({ endpoint: z.string().url().max(4096) }).parse(req.body);
    if (!userId) return res.status(409).json({ message: "Push subscriptions require database authentication" });
    await db.update(pushSubscriptions).set({ revokedAt: new Date(), updatedAt: new Date() })
      .where(and(eq(pushSubscriptions.userId, userId), eq(pushSubscriptions.endpoint, endpoint)));
    res.status(204).end();
  });

  return router;
}

export async function claimDueCampaigns(now = new Date()) {
  return db.transaction(async (transaction) => {
    return transaction.execute(sql`
      UPDATE notification_campaigns SET status = 'processing', started_at = ${now}, updated_at = ${now}
      WHERE id IN (
        SELECT id FROM notification_campaigns
        WHERE status = 'scheduled' AND scheduled_at <= ${now}
        ORDER BY scheduled_at FOR UPDATE SKIP LOCKED LIMIT 20
      ) RETURNING *
    `);
  });
}
