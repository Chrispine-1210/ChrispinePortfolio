import { eq } from "drizzle-orm";
import { leadActivities, leads, type ContactRequest } from "../../shared/schema.js";
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
