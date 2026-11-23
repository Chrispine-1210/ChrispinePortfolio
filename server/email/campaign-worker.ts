import { randomUUID } from "node:crypto";
import { and, eq, isNull, lte, or, sql } from "drizzle-orm";
import { auditEvents, emailOutbox, newsletterSubscribers, notificationActionTokens, notificationCampaigns } from "../../shared/schema.js";
import { db } from "../db.js";
import { env } from "../env.js";
import { ApiError } from "../middleware.js";
import { createNotificationActionToken } from "../notifications/action-token.js";

// One bounded transaction queues a batch; provider delivery remains a separate
// worker. The unique campaign/recipient key makes repeated invocations harmless.
export async function queueDueEmailCampaign(now = new Date(), limit = 100) {
  if (env.EMAIL_PROVIDER !== "postmark" || !env.POSTMARK_FROM_EMAIL || !env.APP_BASE_URL)
    throw new ApiError(503, "Campaign delivery is not enabled");
  const bounded = Math.min(100, Math.max(1, Math.floor(limit)));
  return db.transaction(async transaction => {
    const [campaign] = await transaction.select().from(notificationCampaigns).where(and(
      sql`${notificationCampaigns.channels}=ARRAY['email']::text[]`,
      or(eq(notificationCampaigns.status,"processing"),and(eq(notificationCampaigns.status,"scheduled"),lte(notificationCampaigns.scheduledAt,now))),
    )).orderBy(notificationCampaigns.scheduledAt).limit(1).for("update",{skipLocked:true});
    if(!campaign)return {queued:0,completed:false};
    if(!campaign.subject?.trim()||(!campaign.htmlContent?.trim()&&!campaign.textContent?.trim()))throw new ApiError(409,"Campaign content is incomplete");
    const startedAt=campaign.startedAt??now;
    const recipients=await transaction.select({id:newsletterSubscribers.id,email:newsletterSubscribers.email})
      .from(newsletterSubscribers).leftJoin(emailOutbox,eq(emailOutbox.idempotencyKey,sql<string>`'campaign:' || ${campaign.id} || ':' || ${newsletterSubscribers.id}`))
      .where(and(eq(newsletterSubscribers.isActive,true),lte(newsletterSubscribers.subscribedAt,startedAt),isNull(emailOutbox.id)))
      .orderBy(newsletterSubscribers.id).limit(bounded);
    for(const recipient of recipients){
      const {token,tokenHash}=createNotificationActionToken();
      const url=new URL("/unsubscribe",env.APP_BASE_URL);url.searchParams.set("token",token);
      await transaction.insert(notificationActionTokens).values({tokenHash,purpose:"newsletter_unsubscribe",email:recipient.email.toLowerCase(),subscriberId:recipient.id,expiresAt:new Date(now.getTime()+365*86400000)});
      await transaction.insert(emailOutbox).values({messageType:"marketing",toEmail:recipient.email.toLowerCase(),fromEmail:env.POSTMARK_FROM_EMAIL!,
        fromName:env.POSTMARK_FROM_NAME,subject:campaign.subject,htmlBody:(campaign.htmlContent??"")+`<p><a href="${url.href.replaceAll('&','&amp;')}">Unsubscribe</a></p>`,
        textBody:(campaign.textContent??"")+`\nUnsubscribe: ${url.href}`,idempotencyKey:`campaign:${campaign.id}:${recipient.id}`,metadata:{campaignId:campaign.id}}).onConflictDoNothing();
    }
    const completed=recipients.length<bounded;
    await transaction.update(notificationCampaigns).set({status:completed?"completed":"processing",startedAt,completedAt:completed?now:null,updatedAt:now}).where(eq(notificationCampaigns.id,campaign.id));
    await transaction.insert(auditEvents).values({action:"campaign.queue_batch",resourceType:"notification_campaign",resourceId:campaign.id,result:"success",requestId:randomUUID(),
      newState:{queued:recipients.length,completed,deliveryConfirmed:false}});
    return {campaignId:campaign.id,queued:recipients.length,completed};
  });
}
