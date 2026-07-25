import { db } from "../db.js";
import { env } from "../env.js";
import { emailOutbox, notificationActionTokens, notificationInbox } from "../../shared/schema.js";
import { createNotificationActionToken } from "../notifications/action-token.js";

function escapeHtml(value: string): string {
  return value.replace(/[&<>'"]/g, (character) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;",
  })[character]!);
}

export async function enqueueNewsletterWelcome(subscriber: { id: string; email: string; name: string | null }) {
  if (!env.POSTMARK_FROM_EMAIL || !env.APP_BASE_URL) return;
  const { token, tokenHash } = createNotificationActionToken();
  const expiresAt = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000);
  const unsubscribeUrl = `${env.APP_BASE_URL.replace(/\/$/, "")}/unsubscribe?token=${encodeURIComponent(token)}`;
  const greeting = subscriber.name ? `Hi ${escapeHtml(subscriber.name)},` : "Hello,";
  await db.transaction(async (transaction) => {
    await transaction.insert(notificationActionTokens).values({
      tokenHash, purpose: "newsletter_unsubscribe", email: subscriber.email.toLowerCase(),
      subscriberId: subscriber.id, expiresAt,
    });
    await transaction.insert(emailOutbox).values({
      messageType: "transactional", toEmail: subscriber.email.toLowerCase(),
      fromEmail: env.POSTMARK_FROM_EMAIL!, fromName: env.POSTMARK_FROM_NAME,
      subject: "Welcome to Chrispine's newsletter",
      htmlBody: `<p>${greeting}</p><p>Thanks for subscribing. You will receive new portfolio insights and updates here.</p><p><a href="${unsubscribeUrl}">Unsubscribe securely</a></p>`,
      textBody: `Thanks for subscribing. Unsubscribe: ${unsubscribeUrl}`,
      idempotencyKey: `newsletter-welcome:${subscriber.id}`,
      metadata: { automation: "newsletter_welcome", subscriberId: subscriber.id },
    }).onConflictDoNothing();
  });
}

export async function enqueueContactAutomation(contact: { id: string; name: string; email: string; message: string }) {
  if (!env.POSTMARK_FROM_EMAIL) return;
  const safeName = escapeHtml(contact.name);
  const records: Array<typeof emailOutbox.$inferInsert> = [{
    messageType: "transactional", toEmail: contact.email.toLowerCase(), fromEmail: env.POSTMARK_FROM_EMAIL,
    fromName: env.POSTMARK_FROM_NAME, subject: "I received your message",
    htmlBody: `<p>Hi ${safeName},</p><p>Thank you for reaching out. Your request has been received and I will reply as soon as possible.</p>`,
    textBody: `Hi ${contact.name}, thank you for reaching out. Your request has been received.`,
    idempotencyKey: `contact-ack:${contact.id}`, metadata: { automation: "contact_ack", contactId: contact.id },
  }];
  if (env.ADMIN_NOTIFICATION_EMAIL) records.push({
    messageType: "transactional", toEmail: env.ADMIN_NOTIFICATION_EMAIL, fromEmail: env.POSTMARK_FROM_EMAIL,
    fromName: env.POSTMARK_FROM_NAME, replyTo: contact.email, subject: `New portfolio contact: ${contact.name}`,
    htmlBody: `<p><strong>${safeName}</strong> (${escapeHtml(contact.email)}) sent a new contact request.</p><p>${escapeHtml(contact.message)}</p>`,
    textBody: `${contact.name} (${contact.email}) sent: ${contact.message}`,
    idempotencyKey: `contact-admin:${contact.id}`, metadata: { automation: "contact_admin", contactId: contact.id },
  });
  await db.insert(emailOutbox).values(records).onConflictDoNothing();
  if (env.ADMIN_INBOX_USER_ID) await db.insert(notificationInbox).values({
    userId: env.ADMIN_INBOX_USER_ID, category: "contact", title: `New contact from ${contact.name}`,
    body: contact.message.slice(0, 1000), actionUrl: "/admin/contacts", metadata: { contactId: contact.id },
  });
}
