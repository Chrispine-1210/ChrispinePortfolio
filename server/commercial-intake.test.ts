import { readFile, readdir } from "node:fs/promises";
import { PGlite } from "@electric-sql/pglite";
import { drizzle } from "drizzle-orm/pglite";
import type { Express } from "express";
import request from "supertest";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import * as schema from "../shared/schema.js";
import { contextualDatabase } from "./database-context.js";

const database = new PGlite();
vi.mock("./db.js", () => ({ db: contextualDatabase(drizzle(database, { schema })) }));
let app: Express;
const contact = { name: "Commercial intake fixture", email: "intake@test.invalid", projectType: "development", message: "We need a supported business operations platform." };
const consultation = { name: contact.name, email: contact.email, organization: "Fixture business", industry: "Retail / Distribution", serviceInterest: "business-systems", challenge: contact.message, consent: true };

beforeAll(async () => {
  vi.stubEnv("ADMIN_AUTH_MODE", "database");
  vi.stubEnv("DATABASE_URL", "postgresql://test:test@localhost/test");
  vi.stubEnv("AUTH_KEY_PEPPER", "isolated-commercial-intake-test-pepper");
  vi.stubEnv("POSTMARK_FROM_EMAIL", "sender@test.invalid");
  vi.stubEnv("ADMIN_NOTIFICATION_EMAIL", "operator@test.invalid");
  for (const file of (await readdir("migrations")).filter(name => /^\d{4}_.*\.sql$/.test(name)).sort()) {
    await database.exec(await readFile(`migrations/${file}`, "utf8"));
  }
  const { rows: [owner] } = await database.query<{ id: string }>("insert into users (email) values ('owner@test.invalid') returning id");
  vi.stubEnv("ADMIN_INBOX_USER_ID", owner.id);
  ({ app } = await import("./app.js"));
});

afterAll(async () => { vi.unstubAllEnvs(); await database.close(); });

async function counts() {
  const { rows } = await database.query<{ table_name: string; total: number }>(`
    select 'contacts' as table_name, count(*)::integer as total from contact_requests
    union all select 'leads', count(*)::integer from leads
    union all select 'activities', count(*)::integer from lead_activities
    union all select 'email', count(*)::integer from email_outbox
    union all select 'inbox', count(*)::integer from notification_inbox
  `);
  return Object.fromEntries(rows.map(row => [row.table_name, row.total]));
}

describe("durable enquiry acceptance", () => {
  it.each(["leads", "lead_activities", "email_outbox", "notification_inbox"])("rolls back a contact when %s fails and permits a clean retry", async table => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    const before = await counts();
    await database.exec(`create function reject_intake_fixture() returns trigger language plpgsql as $$
      begin raise exception 'private failure: password=fixture-secret'; end; $$;
      create trigger reject_intake_fixture before insert on ${table} for each row execute function reject_intake_fixture();`);
    try {
      const failed = await request(app).post("/api/contact").send(contact)
        .timeout({ response: 1500, deadline: 3000 }).expect(500);
      expect(JSON.stringify(failed.body)).not.toMatch(/fixture-secret|password|insert into|params:/i);
      expect(failed.body.code).toBe("WRITE_OUTCOME_UNKNOWN");
      expect(failed.body.message).toContain("Check the record before submitting again");
      expect(failed.headers["retry-after"]).toBeUndefined();
      expect(await counts()).toEqual(before);
    } finally {
      await database.exec(`drop trigger reject_intake_fixture on ${table}; drop function reject_intake_fixture();`);
    }
    const accepted = await request(app).post("/api/contact").send(contact).expect(200);
    const after = await counts();
    expect(after).toEqual({ contacts: before.contacts + 1, leads: before.leads + 1,
      activities: before.activities + 1, email: before.email + 2, inbox: before.inbox + 1 });
    const { rows: [linked] } = await database.query<{ contact_request_id: string; stage: string }>(
      "select contact_request_id, stage from leads where contact_request_id = $1", [accepted.body.id],
    );
    expect(linked).toEqual({ contact_request_id: accepted.body.id, stage: "new" });
  });

  it("rolls back consultation capture when its durable notification cannot persist", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    const before = await counts();
    await database.exec(`create function reject_intake_fixture() returns trigger language plpgsql as $$
      begin raise exception 'notification unavailable'; end; $$;
      create trigger reject_intake_fixture before insert on email_outbox for each row execute function reject_intake_fixture();`);
    try {
      const failed = await request(app).post("/api/consultation").send(consultation).expect(500);
      expect(failed.body.code).toBe("WRITE_OUTCOME_UNKNOWN");
      expect(failed.headers["retry-after"]).toBeUndefined();
      expect(await counts()).toEqual(before);
    } finally {
      await database.exec("drop trigger reject_intake_fixture on email_outbox; drop function reject_intake_fixture();");
    }
    await request(app).post("/api/consultation").send(consultation).expect(201);
    expect(await counts()).toEqual({ contacts: before.contacts + 1, leads: before.leads + 1,
      activities: before.activities + 1, email: before.email + 2, inbox: before.inbox + 1 });
  });

  it.each([
    { ...contact, name: "x".repeat(181) }, { ...contact, name: " " },
    { ...contact, email: "not-an-email" }, { ...contact, projectType: "x".repeat(181) },
    { ...contact, message: "x".repeat(5001) }, { ...contact, message: " " },
    { ...contact, isRead: true },
  ])("rejects invalid intake before persistence", async payload => {
    const before = await counts();
    await request(app).post("/api/contact").send(payload).expect(400);
    expect(await counts()).toEqual(before);
  });
});
