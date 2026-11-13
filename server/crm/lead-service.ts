import { eq } from "drizzle-orm";
import { contactRequests, leadActivities, leadAttributionTouches, leads, type ContactRequest } from "../../shared/schema.js";
import { db } from "../db.js";

export async function createLeadFromContact(contact: ContactRequest, landingPage = "/contact") {
  return db.transaction(async transaction => {
    const [created] = await transaction.insert(leads).values({
      contactRequestId: contact.id,
      name: contact.name,
      email: contact.email.toLowerCase(),
      leadType: contact.projectType ? "project_request" : "contact_enquiry",
      serviceInterest: contact.projectType,
      source: "contact_form",
      landingPage,
      message: contact.message,
      priority: "normal",
      stage: "new",
      probability: 10,
    }).onConflictDoNothing({ target: leads.contactRequestId }).returning();
    if (created) {
      await transaction.insert(leadActivities).values({
        leadId: created.id,
        type: "created",
        body: "Lead created automatically from a portfolio contact request.",
        metadata: { contactRequestId: contact.id },
      });
      return created;
    }
    const [existing] = await transaction.select().from(leads)
      .where(eq(leads.contactRequestId, contact.id)).limit(1);
    return existing;
  });
}


export interface AcquisitionTouchInput {
  source: string;
  medium: string;
  campaign: string;
  term: string;
  content: string;
  referrer: string;
  landingPage: string;
  capturedAt: string;
}

export interface AcquisitionAttributionInput {
  firstTouch?: AcquisitionTouchInput;
  lastTouch?: AcquisitionTouchInput;
}

function attributionChannel(touch: AcquisitionTouchInput) {
  const source = touch.source.trim().toLowerCase();
  const medium = touch.medium.trim().toLowerCase();
  let referrerHost = "";
  try {
    referrerHost = touch.referrer ? new URL(touch.referrer).hostname.toLowerCase() : "";
  } catch {
    referrerHost = "";
  }

  if (/email|newsletter/.test(medium) || /mailchimp|brevo|sendgrid|resend/.test(source)) return "email";
  if (/cpc|ppc|paid|display|retarget/.test(medium)) return "paid";
  if (
    /social/.test(medium) ||
    /linkedin|facebook|instagram|twitter|tiktok|youtube|whatsapp/.test(source)
  ) return "social";
  if (
    /organic/.test(medium) ||
    /google\.|bing\.|duckduckgo\.|yahoo\./.test(referrerHost)
  ) return "organic_search";
  if (/referral/.test(medium) || referrerHost) return "referral";
  if (!source && !medium && !referrerHost) return "direct";
  return "other";
}

function normalizedTouch(touch: AcquisitionTouchInput) {
  let referrerHost = "";
  try {
    referrerHost = touch.referrer ? new URL(touch.referrer).hostname.toLowerCase() : "";
  } catch {
    referrerHost = "";
  }
  return {
    channel: attributionChannel(touch),
    source: touch.source.trim().toLowerCase() || referrerHost || "direct",
    medium: touch.medium.trim().toLowerCase() || null,
    campaign: touch.campaign.trim() || null,
    term: touch.term.trim() || null,
    content: touch.content.trim() || null,
    referrer: touch.referrer.trim() || null,
    landingPage: touch.landingPage,
    capturedAt: new Date(touch.capturedAt),
  };
}

export interface ConsultationLeadInput {
  name: string;
  email: string;
  phone?: string;
  organization: string;
  industry: string;
  serviceInterest: string;
  challenge: string;
  currentTech?: string;
  budgetRange?: string;
  expectedTimeline?: string;
  attribution?: AcquisitionAttributionInput;
}

export async function createLeadFromConsultation(
  input: ConsultationLeadInput,
  landingPage = "/hire",
) {
  return db.transaction(async transaction => {
    const message = [
      input.challenge,
      input.currentTech ? `Current technology: ${input.currentTech}` : null,
    ].filter(Boolean).join("\n\n");

    const [contact] = await transaction.insert(contactRequests).values({
      name: input.name,
      email: input.email.toLowerCase(),
      projectType: input.serviceInterest,
      message,
      preferredContact: input.phone ? "phone" : "email",
    }).returning();

    const [lead] = await transaction.insert(leads).values({
      contactRequestId: contact.id,
      name: input.name,
      email: input.email.toLowerCase(),
      phone: input.phone || null,
      organization: input.organization,
      industry: input.industry,
      leadType: "consultation_request",
      serviceInterest: input.serviceInterest,
      budgetRange: input.budgetRange || null,
      expectedTimeline: input.expectedTimeline || null,
      source: "portfolio_consultation",
      campaign: "portfolio_acquisition",
      landingPage,
      currency: "MWK",
      message,
      priority: "normal",
      qualificationScore: 0,
      stage: "new",
      probability: 10,
      nextAction: "Review consultation request and qualify scope.",
      consentStatus: "granted",
    }).returning();

    const attributionRows = [
      input.attribution?.firstTouch
        ? { ...normalizedTouch(input.attribution.firstTouch), leadId: lead.id, touchType: "first" }
        : null,
      input.attribution?.lastTouch
        ? { ...normalizedTouch(input.attribution.lastTouch), leadId: lead.id, touchType: "last" }
        : null,
    ].filter((row): row is NonNullable<typeof row> => Boolean(row));

    if (attributionRows.length) {
      await transaction.insert(leadAttributionTouches).values(attributionRows);
    }

    await transaction.insert(leadActivities).values({
      leadId: lead.id,
      type: "created",
      body: "Structured consultation request captured from the portfolio.",
      metadata: {
        contactRequestId: contact.id,
        serviceInterest: input.serviceInterest,
        budgetRange: input.budgetRange || null,
        expectedTimeline: input.expectedTimeline || null,
      },
    });

    return { contact, lead };
  });
}
