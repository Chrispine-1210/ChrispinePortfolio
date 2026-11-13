import { eq } from "drizzle-orm";
import { contactRequests, leadActivities, leads, type ContactRequest } from "../../shared/schema.js";
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
      campaign: "portfolio_commercial_elevation",
      landingPage,
      message,
      priority: "normal",
      qualificationScore: 0,
      stage: "new",
      probability: 10,
      nextAction: "Review consultation request and qualify scope.",
      consentStatus: "granted",
    }).returning();

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
