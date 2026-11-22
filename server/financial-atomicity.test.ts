import { readFile, readdir } from "node:fs/promises";
import { randomUUID } from "node:crypto";
import { PGlite } from "@electric-sql/pglite";
import { drizzle } from "drizzle-orm/pglite";
import type { Express } from "express";
import request from "supertest";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import * as schema from "../shared/schema.js";

const database = new PGlite();
vi.mock("./db.js", () => ({ db: drizzle(database, { schema }) }));
let app: Express;
let cookie: string;
let sequence = 0;
const serviceInterest = "enterprise-software";
const reason = { reason: "Synthetic correction for atomicity verification" };
const day = 86_400_000;
const now = Date.now();
const at = (days: number) => new Date(now + days * day).toISOString();
type Context = { leadId: string; currency: string; sourceReference: string };
type Operation = { path: string; body: unknown; status?: number; action: string };

beforeAll(async () => {
  vi.stubEnv("ADMIN_AUTH_MODE", "database");
  vi.stubEnv("DATABASE_URL", "postgresql://test:test@localhost/test");
  vi.stubEnv("AUTH_KEY_PEPPER", "isolated-financial-atomicity-test-pepper");
  vi.spyOn(console, "error").mockImplementation(() => {});
  for (const file of (await readdir("migrations")).filter(name => /^\d{4}_.*\.sql$/.test(name)).sort()) await database.exec(await readFile(`migrations/${file}`, "utf8"));
  const { rows: [user] } = await database.query<{ id: string; security_version: number }>("INSERT INTO users(email) VALUES ('financial-atomicity@test.invalid') RETURNING id,security_version");
  await database.query("INSERT INTO user_roles(user_id,role_id) SELECT $1,id FROM roles WHERE key='super_administrator'", [user.id]);
  const { getDatabaseAuthRuntime } = await import("./security/database-auth-routes.js");
  const session = await getDatabaseAuthRuntime().sessions.issue({ userId: user.id, userSecurityVersion: user.security_version });
  cookie = `admin_session=${session.token}`;
  ({ app } = await import("./app.js"));
});
afterAll(async () => { vi.unstubAllEnvs(); await database.close(); });

async function post(path: string, body: unknown, status = 201) {
  const response = await request(app).post(path).set("Cookie", cookie).send(body as object);
  expect(response.status, `${path}: ${JSON.stringify(response.body)}`).toBe(status);
  return response.body;
}
async function context(): Promise<Context> {
  const index = sequence++;
  const currency = `X${String.fromCharCode(65 + Math.floor(index / 26))}${String.fromCharCode(65 + index % 26)}`;
  const sourceReference = `atomicity-fixture-${randomUUID()}`;
  const { rows: [lead] } = await database.query<{ id: string }>(`INSERT INTO leads(name,email,stage,service_interest,currency,source)
    VALUES ('Synthetic financial fixture','financial@test.invalid','won',$1,$2,'fixture') RETURNING id`, [serviceInterest, currency]);
  return { leadId: lead.id, currency, sourceReference };
}
const agreementBody = (c: Context) => ({ ...c, serviceInterest, monthlyRecurringRevenue: 100, startedAt: at(-30) });
const revenueBody = (c: Context) => ({ ...c, serviceInterest, amount: 100, revenueKind: "one_time", occurredAt: at(-5) });
const costBody = (c: Context) => ({ ...c, serviceInterest, amount: 10, category: "delivery_labour", costScope: "one_time", occurredAt: at(-5) });
const costAttestationBody = (c: Context) => ({ ...c, serviceInterest, throughAt: at(-1) });
const invoiceBody = (c: Context) => ({ ...c, serviceInterest, invoiceNumber: c.sourceReference, amount: 100, issuedAt: at(-10), dueAt: at(10) });
const capacityBody = (c: Context) => ({ serviceInterest, sourceReference: c.sourceReference, capacityScope: "fixture", periodStart: at(-30), periodEnd: at(-1), availableHours: 160, deliveryHours: 100, billableHours: 80 });
const budgetBody = (c: Context) => ({ currency: c.currency, sourceReference: c.sourceReference, periodStart: at(-30), periodEnd: at(30), envelopeAmount: 100 });
const allocationBody = () => ({ channel: "direct", serviceInterest, recommendationDecision: "maintain", recommendationConfidence: "high", recommendedAmount: 50, approvedAmount: 50, sourceWindow: "90d", recommendationSnapshot: {}, rationale: "Fixture allocation for transaction verification" });
async function budget(c: Context, approve = false) {
  const record = await post("/api/admin/capital/budgets", budgetBody(c));
  const allocation = await post(`/api/admin/capital/budgets/${record.id}/allocations`, allocationBody(), 200);
  if (approve) await post(`/api/admin/capital/budgets/${record.id}/approve`, {}, 200);
  return { record, allocation };
}
async function treasuryBody(kind: string, c: Context): Promise<object> {
  const common = { currency: c.currency, sourceReference: c.sourceReference };
  if (kind === "accounts") return { ...common, name: c.sourceReference, accountType: "cash" };
  if (kind === "balances") {
    const account = await post("/api/admin/treasury/accounts", await treasuryBody("accounts", c));
    return { ...common, accountId: account.id, ledgerBalance: 1000, availableBalance: 1000, restrictedBalance: 0, capturedAt: at(-1) };
  }
  if (kind === "disbursements") return { ...common, amount: 10, cashUseType: "operating", category: "marketing", occurredAt: at(-1) };
  if (kind === "operating-expenses") return { ...common, amount: 10, category: "software_tools", occurredAt: at(-1) };
  if (kind === "tax-provisions") return { ...common, amount: 5, periodStart: at(-30), periodEnd: at(-1), recognizedAt: at(-1) };
  if (kind === "invested-capital") return { ...common, operatingAssets: 1000, operatingLiabilities: 100, capturedAt: at(-1), components: {} };
  if (kind === "attestations") return { ...common, evidenceType: "operating_expenses_complete", throughAt: at(-1) };
  if (kind === "deployments") {
    const { allocation } = await budget(c, true);
    return { ...common, budgetAllocationId: allocation.id, serviceInterest, amount: 10, category: "working_capital", occurredAt: at(-1), approvalReference: "Fixture approved allocation" };
  }
  return { currency: c.currency, annualHurdleRatePct: 12, effectiveFrom: at(-30), rationale: "Synthetic management policy, not business evidence" };
}

const operations: Array<{ label: string; prepare(c: Context): Promise<Operation> }> = [];
function operation(label: string, prepare: (c: Context) => Promise<Operation>) { operations.push({ label, prepare }); }
for (const [kind, action, body] of [
  ["agreements", "revenue.agreement", agreementBody], ["events", "revenue.event", revenueBody],
  ["costs", "revenue.cost", costBody], ["cost-attestations", "revenue.cost_attestation", costAttestationBody],
] as const) {
  operation(`${action}.create`, async c => ({ path: `/api/admin/revenue/${kind}`, body: body(c), action: `${action}.create` }));
  operation(`${action}.void`, async c => { const record = await post(`/api/admin/revenue/${kind}`, body(c)); return { path: `/api/admin/revenue/${kind}/${record.id}/void`, body: reason, status: 200, action: `${action}.void` }; });
}
operation("revenue.agreement.end", async c => { const record = await post("/api/admin/revenue/agreements", agreementBody(c)); return { path: `/api/admin/revenue/agreements/${record.id}/end`, body: { ...reason, status: "ended", endedAt: at(-1) }, status: 200, action: "revenue.agreement.end" }; });
operation("cash.invoice.create", async c => ({ path: "/api/admin/capital/invoices", body: invoiceBody(c), action: "cash.invoice.create" }));
operation("cash.invoice.void", async c => { const record = await post("/api/admin/capital/invoices", invoiceBody(c)); return { path: `/api/admin/capital/invoices/${record.id}/void`, body: reason, status: 200, action: "cash.invoice.void" }; });
operation("cash.collection.create", async c => { const invoice = await post("/api/admin/capital/invoices", invoiceBody(c)); return { path: "/api/admin/capital/collections", body: { invoiceId: invoice.id, amount: 100, receivedAt: at(-1), paymentMethod: "cash", sourceReference: c.sourceReference }, action: "cash.collection.create" }; });
operation("cash.collection.void", async c => {
  const invoice = await post("/api/admin/capital/invoices", invoiceBody(c));
  const record = await post("/api/admin/capital/collections", { invoiceId: invoice.id, amount: 100, receivedAt: at(-1), paymentMethod: "cash", sourceReference: c.sourceReference });
  return { path: `/api/admin/capital/collections/${record.id}/void`, body: reason, status: 200, action: "cash.collection.void" };
});
for (const voiding of [false, true]) operation(`retention.movement.${voiding ? "void" : "create"}`, async c => {
  const agreement = await post("/api/admin/revenue/agreements", agreementBody(c));
  const body = { agreementId: agreement.id, movementType: "churn", mrrDelta: -100, effectiveAt: at(-1), sourceReference: c.sourceReference };
  if (!voiding) return { path: "/api/admin/capital/retention-movements", body, action: "retention.movement.create" };
  const { record } = await post("/api/admin/capital/retention-movements", body);
  return { path: `/api/admin/capital/retention-movements/${record.id}/void`, body: reason, status: 200, action: "retention.movement.void" };
});
operation("delivery.capacity.create", async c => ({ path: "/api/admin/capital/capacity", body: capacityBody(c), action: "delivery.capacity.create" }));
operation("delivery.capacity.void", async c => { const record = await post("/api/admin/capital/capacity", capacityBody(c)); return { path: `/api/admin/capital/capacity/${record.id}/void`, body: reason, status: 200, action: "delivery.capacity.void" }; });
operation("capital.budget.create", async c => ({ path: "/api/admin/capital/budgets", body: budgetBody(c), action: "capital.budget.create" }));
for (const updating of [false, true]) operation(`capital.budget.allocation.${updating ? "update" : "create"}`, async c => {
  const record = await post("/api/admin/capital/budgets", budgetBody(c));
  if (updating) await post(`/api/admin/capital/budgets/${record.id}/allocations`, allocationBody(), 200);
  return { path: `/api/admin/capital/budgets/${record.id}/allocations`, body: { ...allocationBody(), approvedAmount: 60 }, status: 200, action: "capital.budget.allocation.upsert" };
});
operation("capital.budget.approve", async c => { const { record } = await budget(c); return { path: `/api/admin/capital/budgets/${record.id}/approve`, body: {}, status: 200, action: "capital.budget.approve" }; });
operation("capital.budget.close", async c => { const { record } = await budget(c, true); return { path: `/api/admin/capital/budgets/${record.id}/close`, body: {}, status: 200, action: "capital.budget.close" }; });
for (const [kind, action, voidKind] of [
  ["accounts", "treasury.account", null], ["balances", "treasury.balance", "balance"],
  ["disbursements", "treasury.disbursement", "disbursement"], ["operating-expenses", "roic.opex", "opex"],
  ["tax-provisions", "roic.tax", "tax"], ["invested-capital", "roic.invested_capital", "invested-capital"],
  ["deployments", "capital.deployment", "deployment"], ["attestations", "roic.attestation", "attestation"],
  ["hurdle-policies", "capital.hurdle", null],
] as const) {
  operation(`${action}.create`, async c => ({ path: `/api/admin/treasury/${kind}`, body: await treasuryBody(kind, c), action: action === "capital.hurdle" ? "capital.hurdle.approve" : `${action}.create` }));
  if (voidKind) operation(`${action}.void`, async c => {
    const record = await post(`/api/admin/treasury/${kind}`, await treasuryBody(kind, c));
    const resource = { balance: "treasury_balance_snapshot", disbursement: "treasury_cash_disbursement", opex: "operating_expense_entry", tax: "operating_tax_provision", "invested-capital": "invested_capital_snapshot", deployment: "capital_deployment_entry", attestation: "financial_evidence_attestation" }[voidKind];
    return { path: `/api/admin/treasury/evidence/${voidKind}/${record.id}/void`, body: reason, status: 200, action: `${resource}.void` };
  });
}
for (const voiding of [false, true]) operation(`acquisition.spend.${voiding ? "void" : "create"}`, async c => {
  const body = { channel: "paid", source: "fixture", currency: c.currency, amount: 10, occurredAt: at(-1), serviceInterest };
  if (!voiding) return { path: "/api/admin/acquisition/spend", body, action: "acquisition.spend.create" };
  const record = await post("/api/admin/acquisition/spend", body);
  return { path: `/api/admin/acquisition/spend/${record.id}/void`, body: reason, status: 200, action: "acquisition.spend.void" };
});

const tables = ["acquisition_spend_entries", "recurring_revenue_agreements", "revenue_events", "direct_cost_entries", "cost_evidence_attestations", "commercial_invoices", "cash_collections", "recurring_revenue_movements", "delivery_capacity_records", "capital_budget_cycles", "capital_budget_allocations", "treasury_accounts", "treasury_balance_snapshots", "treasury_cash_disbursements", "operating_expense_entries", "operating_tax_provisions", "invested_capital_snapshots", "capital_deployment_entries", "financial_evidence_attestations", "capital_hurdle_policies", "leads", "lead_activities", "audit_events"];
async function snapshot() {
  return (await database.query(tables.map(table => `SELECT '${table}' AS name, coalesce(jsonb_agg(to_jsonb(t) ORDER BY t.id),'[]'::jsonb) AS records FROM ${table} t`).join(" UNION ALL "))).rows;
}

describe("financial mutation/audit transaction matrix", () => {
  it.each(operations)("rolls back $label on audit failure, then commits one successful operation", async ({ prepare }) => {
    const c = await context();
    const operation = await prepare(c);
    const before = await snapshot();
    await database.exec(`CREATE FUNCTION reject_financial_audit_fixture() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN RAISE EXCEPTION 'private password=fixture-secret'; END; $$;
      CREATE TRIGGER reject_financial_audit_fixture BEFORE INSERT ON audit_events FOR EACH ROW EXECUTE FUNCTION reject_financial_audit_fixture();`);
    try {
      const failed = await request(app).post(operation.path).set("Cookie", cookie).send(operation.body as object).timeout({ response: 2000, deadline: 4000 });
      expect(failed.status, JSON.stringify(failed.body)).toBe(500);
      expect(failed.body.code).toBe("WRITE_OUTCOME_UNKNOWN");
      expect(failed.headers["retry-after"]).toBeUndefined();
      expect(JSON.stringify(failed.body)).not.toMatch(/fixture-secret|password|insert into|params:/i);
      expect(await snapshot()).toEqual(before);
    } finally { await database.exec("DROP TRIGGER reject_financial_audit_fixture ON audit_events; DROP FUNCTION reject_financial_audit_fixture();"); }
    const accepted = await request(app).post(operation.path).set("Cookie", cookie).send(operation.body as object);
    expect(accepted.status, JSON.stringify(accepted.body)).toBe(operation.status ?? 201);
    const record = accepted.body.record ?? accepted.body;
    if (operation.action === "cash.collection.void") {
      const invoice = await database.query<{ status: string }>("SELECT status FROM commercial_invoices WHERE id=$1", [record.invoiceId]);
      expect(invoice.rows).toEqual([{ status: "issued" }]);
    }
    const audit = await database.query<{ action: string; resource_id: string }>("SELECT action,resource_id FROM audit_events WHERE request_id=$1", [accepted.headers["x-request-id"]]);
    expect(audit.rows).toEqual([{ action: operation.action, resource_id: record.id }]);
  });
});
