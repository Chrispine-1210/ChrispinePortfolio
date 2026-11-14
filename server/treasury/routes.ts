import {
  and,
  desc,
  eq,
  gt,
  inArray,
  isNull,
  lte,
  or,
  sql,
} from "drizzle-orm";
import { Router } from "express";
import { z } from "zod";
import {
  acquisitionSpendEntries,
  auditEvents,
  capitalBudgetAllocations,
  capitalBudgetCycles,
  capitalDeploymentEntries,
  capitalHurdlePolicies,
  costEvidenceAttestations,
  directCostEntries,
  financialEvidenceAttestations,
  investedCapitalSnapshots,
  operatingExpenseEntries,
  operatingTaxProvisions,
  revenueEvents,
  treasuryAccounts,
  treasuryBalanceSnapshots,
  treasuryCashDisbursements,
} from "../../shared/schema.js";
import { requireAdminPermission } from "../custom-auth.js";
import { db } from "../db.js";

const DAY_MS = 86_400_000;
const TTM_DAYS = 365;
const PRIOR_TTM_DAYS = 730;

const positiveMoney = z.union([
  z.number().positive(),
  z.string().regex(/^\d+(?:\.\d{1,2})?$/).transform(Number).refine((value) => value > 0),
]);
const nonnegativeMoney = z.union([
  z.number().nonnegative(),
  z.string().regex(/^\d+(?:\.\d{1,2})?$/).transform(Number),
]);
const currencySchema = z.string().trim().length(3).transform((value) => value.toUpperCase());
const sourceSchema = z.string().trim().min(3).max(2000);
const notesSchema = z.string().trim().max(4000).nullable().optional();

const accountSchema = z.object({
  name: z.string().trim().min(2).max(180),
  institution: z.string().trim().max(180).nullable().optional(),
  accountType: z.enum(["bank", "mobile_money", "cash", "money_market", "other"]),
  currency: currencySchema,
  status: z.enum(["active", "restricted"]).default("active"),
  sourceReference: sourceSchema,
  notes: notesSchema,
}).strict();

const balanceSchema = z.object({
  accountId: z.string().uuid(),
  currency: currencySchema,
  ledgerBalance: nonnegativeMoney,
  availableBalance: nonnegativeMoney,
  restrictedBalance: nonnegativeMoney.default(0),
  capturedAt: z.string().datetime(),
  sourceReference: sourceSchema,
  notes: notesSchema,
}).strict();

const disbursementSchema = z.object({
  accountId: z.string().uuid().nullable().optional(),
  currency: currencySchema,
  amount: positiveMoney,
  cashUseType: z.enum(["operating", "capital", "financing"]),
  category: z.enum([
    "direct_delivery", "payroll", "marketing", "software_infrastructure",
    "rent_utilities", "professional_fees", "tax", "other_operating",
    "growth_capex", "maintenance_capex", "working_capital", "product_development",
    "debt_service", "owner_distribution", "other_financing",
  ]),
  serviceInterest: z.string().trim().max(180).nullable().optional(),
  occurredAt: z.string().datetime(),
  sourceReference: sourceSchema,
  notes: notesSchema,
}).strict();

const operatingExpenseSchema = z.object({
  currency: currencySchema,
  amount: positiveMoney,
  category: z.enum([
    "payroll_overhead", "rent_utilities", "software_tools", "professional_fees",
    "insurance", "travel_admin", "governance", "depreciation_amortization", "other",
  ]),
  serviceInterest: z.string().trim().max(180).nullable().optional(),
  occurredAt: z.string().datetime(),
  sourceReference: sourceSchema,
  notes: notesSchema,
}).strict();

const taxSchema = z.object({
  currency: currencySchema,
  amount: nonnegativeMoney,
  periodStart: z.string().datetime(),
  periodEnd: z.string().datetime(),
  recognizedAt: z.string().datetime(),
  sourceReference: sourceSchema,
  notes: notesSchema,
}).strict();

const investedCapitalSchema = z.object({
  currency: currencySchema,
  operatingAssets: nonnegativeMoney,
  operatingLiabilities: nonnegativeMoney,
  capturedAt: z.string().datetime(),
  components: z.record(z.string(), z.unknown()).default({}),
  sourceReference: sourceSchema,
  notes: notesSchema,
}).strict();

const deploymentSchema = z.object({
  budgetAllocationId: z.string().uuid().nullable().optional(),
  currency: currencySchema,
  amount: positiveMoney,
  category: z.enum([
    "growth_capex", "maintenance_capex", "working_capital", "product_development",
    "strategic_investment", "debt_repayment", "owner_distribution",
  ]),
  serviceInterest: z.string().trim().max(180).nullable().optional(),
  occurredAt: z.string().datetime(),
  sourceReference: sourceSchema,
  approvalReference: z.string().trim().min(5).max(2000),
  notes: notesSchema,
}).strict();

const attestationSchema = z.object({
  currency: currencySchema,
  evidenceType: z.enum(["operating_expenses_complete", "cash_disbursements_complete"]),
  throughAt: z.string().datetime(),
  sourceReference: sourceSchema,
  notes: notesSchema,
}).strict();

const hurdleSchema = z.object({
  currency: currencySchema,
  annualHurdleRatePct: z.number().min(0).max(1000),
  effectiveFrom: z.string().datetime(),
  effectiveTo: z.string().datetime().nullable().optional(),
  rationale: z.string().trim().min(10).max(4000),
}).strict();

const voidSchema = z.object({
  reason: z.string().trim().min(5).max(1000),
}).strict();

function round(value: number, digits = 1) {
  const m = 10 ** digits;
  return Math.round(value * m) / m;
}

function daysBetween(start: Date, end: Date) {
  return Math.max(0, (end.getTime() - start.getTime()) / DAY_MS);
}

function proratedAmountForOverlap(
  amount: number,
  sourceStart: Date,
  sourceEnd: Date,
  periodStart: Date,
  periodEnd: Date,
) {
  const overlapStart = new Date(Math.max(sourceStart.getTime(), periodStart.getTime()));
  const overlapEnd = new Date(Math.min(sourceEnd.getTime(), periodEnd.getTime()));
  if (overlapEnd.getTime() < overlapStart.getTime()) return 0;
  const sourceDays = daysBetween(sourceStart, sourceEnd) + 1;
  const overlapDays = daysBetween(overlapStart, overlapEnd) + 1;
  if (sourceDays <= 0) return 0;
  return amount * Math.min(1, overlapDays / sourceDays);
}

function clipIntervals(
  rows: Array<{ start: Date; end: Date }>,
  periodStart: Date,
  periodEnd: Date,
) {
  const intervals = rows
    .map(({ start, end }) => ({
      start: new Date(Math.max(start.getTime(), periodStart.getTime())),
      end: new Date(Math.min(end.getTime(), periodEnd.getTime())),
    }))
    .filter((row) => row.end.getTime() >= row.start.getTime())
    .sort((a, b) => a.start.getTime() - b.start.getTime());

  const merged: Array<{ start: Date; end: Date }> = [];
  for (const interval of intervals) {
    const last = merged[merged.length - 1];
    if (!last || interval.start.getTime() > last.end.getTime() + DAY_MS) {
      merged.push({ ...interval });
      continue;
    }
    if (interval.end.getTime() > last.end.getTime()) last.end = interval.end;
  }
  return merged.reduce((sum, row) => sum + daysBetween(row.start, row.end) + 1, 0);
}

async function audit(
  request: Express.Request,
  action: string,
  resourceType: string,
  resourceId: string,
  previousState: unknown,
  newState: unknown,
  justification?: string,
) {
  await db.insert(auditEvents).values({
    actorUserId: request.securityPrincipal?.userId ?? null,
    actorSessionId: request.securityPrincipal?.sessionId ?? null,
    action,
    resourceType,
    resourceId,
    result: "success",
    requestId: request.requestId,
    previousState: previousState as Record<string, unknown> | null,
    newState: newState as Record<string, unknown> | null,
    justification,
  });
}

function assertNotFuture(date: Date, field: string) {
  if (date.getTime() > Date.now() + 10 * 60 * 1000) {
    throw new Error(`${field} cannot be in the future`);
  }
}

const operatingDeploymentCategories = new Set([
  "growth_capex", "working_capital", "product_development",
]);

const cashCategoriesByType: Record<string, Set<string>> = {
  operating: new Set([
    "direct_delivery", "payroll", "marketing", "software_infrastructure",
    "rent_utilities", "professional_fees", "tax", "other_operating",
  ]),
  capital: new Set([
    "growth_capex", "maintenance_capex", "working_capital", "product_development",
  ]),
  financing: new Set([
    "debt_service", "owner_distribution", "other_financing",
  ]),
};

export function createTreasuryRoicRouter() {
  const router = Router();

  router.get(
    "/api/admin/treasury/accounts",
    requireAdminPermission("pipeline.financial.read"),
    async (_request, response) => {
      const rows = await db.select().from(treasuryAccounts)
        .orderBy(treasuryAccounts.currency, treasuryAccounts.name);
      response.setHeader("Cache-Control", "no-store");
      response.json(rows);
    },
  );

  router.post(
    "/api/admin/treasury/accounts",
    requireAdminPermission("treasury.evidence.manage"),
    async (request, response) => {
      const parsed = accountSchema.safeParse(request.body);
      if (!parsed.success) return response.status(400).json({ message: "Invalid treasury account", errors: parsed.error.issues });
      const input = parsed.data;
      const [existing] = await db.select({ id: treasuryAccounts.id }).from(treasuryAccounts).where(and(
        eq(treasuryAccounts.name, input.name),
        eq(treasuryAccounts.currency, input.currency),
        isNull(treasuryAccounts.archivedAt),
      )).limit(1);
      if (existing) return response.status(409).json({ message: "Active treasury account name already exists in this currency" });
      const [record] = await db.insert(treasuryAccounts).values({
        name: input.name,
        institution: input.institution || null,
        accountType: input.accountType,
        currency: input.currency,
        status: input.status,
        sourceReference: input.sourceReference,
        notes: input.notes || null,
        createdBy: request.securityPrincipal?.userId ?? null,
      }).returning();
      await audit(request, "treasury.account.create", "treasury_account", record.id, null, record);
      response.status(201).json(record);
    },
  );

  router.post(
    "/api/admin/treasury/balances",
    requireAdminPermission("treasury.evidence.manage"),
    async (request, response) => {
      const parsed = balanceSchema.safeParse(request.body);
      if (!parsed.success) return response.status(400).json({ message: "Invalid treasury balance snapshot", errors: parsed.error.issues });
      const input = parsed.data;
      const capturedAt = new Date(input.capturedAt);
      try { assertNotFuture(capturedAt, "Balance snapshot"); } catch (error) {
        return response.status(400).json({ message: (error as Error).message });
      }
      if (input.restrictedBalance > input.availableBalance) {
        return response.status(400).json({ message: "Restricted balance cannot exceed available balance" });
      }
      const [account] = await db.select().from(treasuryAccounts)
        .where(eq(treasuryAccounts.id, input.accountId)).limit(1);
      if (!account || account.archivedAt) return response.status(404).json({ message: "Treasury account not found" });
      if (account.currency !== input.currency) return response.status(409).json({ message: "Balance currency must match treasury account" });
      const [record] = await db.insert(treasuryBalanceSnapshots).values({
        accountId: input.accountId,
        currency: input.currency,
        ledgerBalance: String(input.ledgerBalance),
        availableBalance: String(input.availableBalance),
        restrictedBalance: String(input.restrictedBalance),
        capturedAt,
        sourceReference: input.sourceReference,
        notes: input.notes || null,
        createdBy: request.securityPrincipal?.userId ?? null,
      }).returning();
      await audit(request, "treasury.balance.create", "treasury_balance_snapshot", record.id, null, record);
      response.status(201).json(record);
    },
  );

  router.post(
    "/api/admin/treasury/disbursements",
    requireAdminPermission("treasury.evidence.manage"),
    async (request, response) => {
      const parsed = disbursementSchema.safeParse(request.body);
      if (!parsed.success) return response.status(400).json({ message: "Invalid treasury cash disbursement", errors: parsed.error.issues });
      const input = parsed.data;
      const occurredAt = new Date(input.occurredAt);
      try { assertNotFuture(occurredAt, "Cash disbursement"); } catch (error) {
        return response.status(400).json({ message: (error as Error).message });
      }
      if (!cashCategoriesByType[input.cashUseType]?.has(input.category)) {
        return response.status(400).json({ message: "Cash-use category does not match operating/capital/financing classification" });
      }
      if (input.accountId) {
        const [account] = await db.select().from(treasuryAccounts)
          .where(eq(treasuryAccounts.id, input.accountId)).limit(1);
        if (!account || account.archivedAt) return response.status(404).json({ message: "Treasury account not found" });
        if (account.currency !== input.currency) return response.status(409).json({ message: "Disbursement currency must match treasury account" });
      }
      const [record] = await db.insert(treasuryCashDisbursements).values({
        accountId: input.accountId || null,
        currency: input.currency,
        amount: String(input.amount),
        cashUseType: input.cashUseType,
        category: input.category,
        serviceInterest: input.serviceInterest || null,
        occurredAt,
        sourceReference: input.sourceReference,
        notes: input.notes || null,
        createdBy: request.securityPrincipal?.userId ?? null,
      }).returning();
      await audit(request, "treasury.disbursement.create", "treasury_cash_disbursement", record.id, null, record);
      response.status(201).json(record);
    },
  );

  router.post(
    "/api/admin/treasury/operating-expenses",
    requireAdminPermission("roic.evidence.manage"),
    async (request, response) => {
      const parsed = operatingExpenseSchema.safeParse(request.body);
      if (!parsed.success) return response.status(400).json({ message: "Invalid operating expense", errors: parsed.error.issues });
      const input = parsed.data;
      const occurredAt = new Date(input.occurredAt);
      try { assertNotFuture(occurredAt, "Operating expense"); } catch (error) {
        return response.status(400).json({ message: (error as Error).message });
      }
      const [record] = await db.insert(operatingExpenseEntries).values({
        currency: input.currency,
        amount: String(input.amount),
        category: input.category,
        serviceInterest: input.serviceInterest || null,
        occurredAt,
        sourceReference: input.sourceReference,
        notes: input.notes || null,
        createdBy: request.securityPrincipal?.userId ?? null,
      }).returning();
      await audit(request, "roic.opex.create", "operating_expense_entry", record.id, null, record);
      response.status(201).json(record);
    },
  );

  router.post(
    "/api/admin/treasury/tax-provisions",
    requireAdminPermission("roic.evidence.manage"),
    async (request, response) => {
      const parsed = taxSchema.safeParse(request.body);
      if (!parsed.success) return response.status(400).json({ message: "Invalid operating tax provision", errors: parsed.error.issues });
      const input = parsed.data;
      const periodStart = new Date(input.periodStart);
      const periodEnd = new Date(input.periodEnd);
      const recognizedAt = new Date(input.recognizedAt);
      if (periodEnd.getTime() < periodStart.getTime()) return response.status(400).json({ message: "Tax period end cannot precede start" });
      try { assertNotFuture(recognizedAt, "Tax recognition"); } catch (error) {
        return response.status(400).json({ message: (error as Error).message });
      }
      const overlapping = await db.select({ id: operatingTaxProvisions.id }).from(operatingTaxProvisions).where(and(
        eq(operatingTaxProvisions.currency, input.currency),
        isNull(operatingTaxProvisions.voidedAt),
        lte(operatingTaxProvisions.periodStart, periodEnd),
        gt(operatingTaxProvisions.periodEnd, new Date(periodStart.getTime() - 1)),
      )).limit(1);
      if (overlapping.length) return response.status(409).json({ message: "Operating tax period overlaps existing active evidence" });
      const [record] = await db.insert(operatingTaxProvisions).values({
        currency: input.currency,
        amount: String(input.amount),
        periodStart,
        periodEnd,
        recognizedAt,
        sourceReference: input.sourceReference,
        notes: input.notes || null,
        createdBy: request.securityPrincipal?.userId ?? null,
      }).returning();
      await audit(request, "roic.tax.create", "operating_tax_provision", record.id, null, record);
      response.status(201).json(record);
    },
  );

  router.post(
    "/api/admin/treasury/invested-capital",
    requireAdminPermission("roic.evidence.manage"),
    async (request, response) => {
      const parsed = investedCapitalSchema.safeParse(request.body);
      if (!parsed.success) return response.status(400).json({ message: "Invalid invested capital snapshot", errors: parsed.error.issues });
      const input = parsed.data;
      const capturedAt = new Date(input.capturedAt);
      try { assertNotFuture(capturedAt, "Invested capital snapshot"); } catch (error) {
        return response.status(400).json({ message: (error as Error).message });
      }
      const [record] = await db.insert(investedCapitalSnapshots).values({
        currency: input.currency,
        operatingAssets: String(input.operatingAssets),
        operatingLiabilities: String(input.operatingLiabilities),
        capturedAt,
        components: input.components,
        sourceReference: input.sourceReference,
        notes: input.notes || null,
        createdBy: request.securityPrincipal?.userId ?? null,
      }).returning();
      await audit(request, "roic.invested_capital.create", "invested_capital_snapshot", record.id, null, record);
      response.status(201).json(record);
    },
  );

  router.post(
    "/api/admin/treasury/deployments",
    requireAdminPermission("capital.deployment.manage"),
    async (request, response) => {
      const parsed = deploymentSchema.safeParse(request.body);
      if (!parsed.success) return response.status(400).json({ message: "Invalid capital deployment", errors: parsed.error.issues });
      const input = parsed.data;
      const occurredAt = new Date(input.occurredAt);
      try { assertNotFuture(occurredAt, "Capital deployment"); } catch (error) {
        return response.status(400).json({ message: (error as Error).message });
      }
      const governedOperatingDeployment = ["growth_capex", "maintenance_capex", "working_capital", "product_development", "strategic_investment"].includes(input.category);
      if (governedOperatingDeployment && !input.budgetAllocationId) {
        return response.status(409).json({ message: "Operating capital deployment requires an approved capital budget allocation" });
      }
      if (input.budgetAllocationId) {
        const [row] = await db.select({
          allocation: capitalBudgetAllocations,
          budget: capitalBudgetCycles,
        }).from(capitalBudgetAllocations)
          .innerJoin(capitalBudgetCycles, eq(capitalBudgetCycles.id, capitalBudgetAllocations.budgetId))
          .where(eq(capitalBudgetAllocations.id, input.budgetAllocationId)).limit(1);
        if (!row) return response.status(404).json({ message: "Capital budget allocation not found" });
        if (row.budget.status !== "approved") return response.status(409).json({ message: "Capital budget must be approved before deployment" });
        if (row.budget.currency !== input.currency) return response.status(409).json({ message: "Capital deployment currency must match approved budget" });
        if (input.serviceInterest !== row.allocation.serviceInterest) {
          return response.status(409).json({ message: "Capital deployment service must match budget allocation" });
        }
        if (occurredAt < row.budget.periodStart || occurredAt > row.budget.periodEnd) {
          return response.status(409).json({ message: "Capital deployment must occur inside the approved budget period" });
        }

        const [usage] = await db.select({
          deployedAmount: sql<string>`coalesce(sum(${capitalDeploymentEntries.amount}), 0)`,
        }).from(capitalDeploymentEntries).where(and(
          eq(capitalDeploymentEntries.budgetAllocationId, input.budgetAllocationId),
          isNull(capitalDeploymentEntries.voidedAt),
        ));
        const approvedAmount = Number(row.allocation.approvedAmount);
        const alreadyDeployed = Number(usage?.deployedAmount ?? 0);
        if (alreadyDeployed + input.amount > approvedAmount + 0.005) {
          return response.status(409).json({
            message: "Capital deployment exceeds approved allocation balance",
            approvedAmount,
            alreadyDeployed,
            remainingAmount: Math.max(0, round(approvedAmount - alreadyDeployed, 2)),
          });
        }
      }

      try {
        const [record] = await db.insert(capitalDeploymentEntries).values({
          budgetAllocationId: input.budgetAllocationId || null,
          currency: input.currency,
          amount: String(input.amount),
          category: input.category,
          serviceInterest: input.serviceInterest || null,
          occurredAt,
          sourceReference: input.sourceReference,
          approvalReference: input.approvalReference,
          notes: input.notes || null,
          createdBy: request.securityPrincipal?.userId ?? null,
        }).returning();
        await audit(request, "capital.deployment.create", "capital_deployment_entry", record.id, null, record);
        return response.status(201).json(record);
      } catch (error) {
        const cause = error instanceof Error
          ? (error as Error & { cause?: { message?: string } }).cause?.message ?? ""
          : "";
        const message = `${error instanceof Error ? error.message : String(error)} ${cause}`;
        if (message.includes("Capital deployment exceeds approved allocation balance")) {
          return response.status(409).json({ message: "Capital deployment exceeds approved allocation balance" });
        }
        throw error;
      }
    },
  );

  router.post(
    "/api/admin/treasury/attestations",
    requireAdminPermission("roic.evidence.manage"),
    async (request, response) => {
      const parsed = attestationSchema.safeParse(request.body);
      if (!parsed.success) return response.status(400).json({ message: "Invalid financial evidence attestation", errors: parsed.error.issues });
      const input = parsed.data;
      const throughAt = new Date(input.throughAt);
      if (throughAt.getTime() > Date.now() + 10 * 60 * 1000) {
        return response.status(400).json({ message: "Attestation cannot be materially future-dated" });
      }
      const [record] = await db.insert(financialEvidenceAttestations).values({
        currency: input.currency,
        evidenceType: input.evidenceType,
        throughAt,
        sourceReference: input.sourceReference,
        notes: input.notes || null,
        createdBy: request.securityPrincipal?.userId ?? null,
      }).returning();
      await audit(request, "roic.attestation.create", "financial_evidence_attestation", record.id, null, record);
      response.status(201).json(record);
    },
  );

  router.post(
    "/api/admin/treasury/hurdle-policies",
    requireAdminPermission("capital.hurdle.approve"),
    async (request, response) => {
      const parsed = hurdleSchema.safeParse(request.body);
      if (!parsed.success) return response.status(400).json({ message: "Invalid capital hurdle policy", errors: parsed.error.issues });
      const input = parsed.data;
      const effectiveFrom = new Date(input.effectiveFrom);
      const effectiveTo = input.effectiveTo ? new Date(input.effectiveTo) : null;
      if (effectiveTo && effectiveTo.getTime() < effectiveFrom.getTime()) {
        return response.status(400).json({ message: "Hurdle policy end cannot precede start" });
      }
      const policies = await db.select().from(capitalHurdlePolicies)
        .where(eq(capitalHurdlePolicies.currency, input.currency));
      const overlaps = policies.some((policy) => {
        const existingEnd = policy.effectiveTo?.getTime() ?? Number.POSITIVE_INFINITY;
        const nextEnd = effectiveTo?.getTime() ?? Number.POSITIVE_INFINITY;
        return effectiveFrom.getTime() <= existingEnd && policy.effectiveFrom.getTime() <= nextEnd;
      });
      if (overlaps) return response.status(409).json({ message: "Capital hurdle policy overlaps an existing policy for this currency" });
      const [record] = await db.insert(capitalHurdlePolicies).values({
        currency: input.currency,
        annualHurdleRatePct: String(input.annualHurdleRatePct),
        effectiveFrom,
        effectiveTo,
        rationale: input.rationale,
        approvedBy: request.securityPrincipal!.userId,
        approvedAt: new Date(),
      }).returning();
      await audit(request, "capital.hurdle.approve", "capital_hurdle_policy", record.id, null, record, input.rationale);
      response.status(201).json(record);
    },
  );

  router.post(
    "/api/admin/treasury/evidence/:kind/:id/void",
    requireAdminPermission("pipeline.financial.read"),
    async (request, response) => {
      const parsed = voidSchema.safeParse(request.body);
      if (!parsed.success) return response.status(400).json({ message: "Invalid void request", errors: parsed.error.issues });
      const kind = request.params.kind;
      const permission =
        kind === "balance" || kind === "disbursement" ? "treasury.evidence.manage" :
        kind === "opex" || kind === "tax" || kind === "invested-capital" || kind === "attestation" ? "roic.evidence.manage" :
        kind === "deployment" ? "capital.deployment.manage" : null;
      if (!permission || !request.securityPrincipal?.permissions.includes(permission)) {
        return response.status(403).json({ message: "Forbidden" });
      }

      const now = new Date();
      const values = {
        voidedAt: now,
        voidedBy: request.securityPrincipal.userId,
        voidReason: parsed.data.reason,
      };
      const config: Record<string, {
        table: any;
        id: any;
        resource: string;
      }> = {
        balance: { table: treasuryBalanceSnapshots, id: treasuryBalanceSnapshots.id, resource: "treasury_balance_snapshot" },
        disbursement: { table: treasuryCashDisbursements, id: treasuryCashDisbursements.id, resource: "treasury_cash_disbursement" },
        opex: { table: operatingExpenseEntries, id: operatingExpenseEntries.id, resource: "operating_expense_entry" },
        tax: { table: operatingTaxProvisions, id: operatingTaxProvisions.id, resource: "operating_tax_provision" },
        "invested-capital": { table: investedCapitalSnapshots, id: investedCapitalSnapshots.id, resource: "invested_capital_snapshot" },
        attestation: { table: financialEvidenceAttestations, id: financialEvidenceAttestations.id, resource: "financial_evidence_attestation" },
        deployment: { table: capitalDeploymentEntries, id: capitalDeploymentEntries.id, resource: "capital_deployment_entry" },
      };
      const selected = config[kind];
      const [previous] = await db.select().from(selected.table).where(eq(selected.id, request.params.id)).limit(1);
      if (!previous) return response.status(404).json({ message: "Evidence record not found" });
      if (previous.voidedAt) return response.status(409).json({ message: "Evidence record is already voided" });
      const [record] = await db.update(selected.table).set(values).where(eq(selected.id, request.params.id)).returning();
      await audit(request, `${selected.resource}.void`, selected.resource, request.params.id, previous, record, parsed.data.reason);
      response.json(record);
    },
  );

  router.get(
    "/api/admin/treasury/evidence",
    requireAdminPermission("pipeline.financial.read"),
    async (_request, response) => {
      const [accounts, balances, disbursements, expenses, taxes, capital, deployments, attestations, hurdles] = await Promise.all([
        db.select().from(treasuryAccounts).orderBy(treasuryAccounts.currency, treasuryAccounts.name),
        db.select().from(treasuryBalanceSnapshots).orderBy(desc(treasuryBalanceSnapshots.capturedAt)).limit(1000),
        db.select().from(treasuryCashDisbursements).orderBy(desc(treasuryCashDisbursements.occurredAt)).limit(2000),
        db.select().from(operatingExpenseEntries).orderBy(desc(operatingExpenseEntries.occurredAt)).limit(2000),
        db.select().from(operatingTaxProvisions).orderBy(desc(operatingTaxProvisions.recognizedAt)).limit(1000),
        db.select().from(investedCapitalSnapshots).orderBy(desc(investedCapitalSnapshots.capturedAt)).limit(1000),
        db.select().from(capitalDeploymentEntries).orderBy(desc(capitalDeploymentEntries.occurredAt)).limit(2000),
        db.select().from(financialEvidenceAttestations).orderBy(desc(financialEvidenceAttestations.throughAt)).limit(1000),
        db.select().from(capitalHurdlePolicies).orderBy(desc(capitalHurdlePolicies.effectiveFrom)).limit(500),
      ]);
      response.setHeader("Cache-Control", "no-store");
      response.json({ accounts, balances, disbursements, expenses, taxes, investedCapital: capital, deployments, attestations, hurdles });
    },
  );

  router.get(
    "/api/admin/treasury/intelligence",
    requireAdminPermission("pipeline.financial.read"),
    async (_request, response) => {
      const now = new Date();
      const ttmStart = new Date(now.getTime() - TTM_DAYS * DAY_MS);
      const priorStart = new Date(now.getTime() - PRIOR_TTM_DAYS * DAY_MS);
      const priorEnd = ttmStart;
      const runwayStart = new Date(now.getTime() - 90 * DAY_MS);

      const [
        accounts,
        balances,
        disbursements,
        revenues,
        directCosts,
        acquisitionSpend,
        operatingExpenses,
        taxes,
        capitalSnapshots,
        deployments,
        costAttestations,
        evidenceAttestations,
        hurdlePolicies,
      ] = await Promise.all([
        db.select().from(treasuryAccounts).where(isNull(treasuryAccounts.archivedAt)),
        db.select().from(treasuryBalanceSnapshots).where(isNull(treasuryBalanceSnapshots.voidedAt))
          .orderBy(desc(treasuryBalanceSnapshots.capturedAt)).limit(5000),
        db.select().from(treasuryCashDisbursements).where(and(
          isNull(treasuryCashDisbursements.voidedAt),
          gt(treasuryCashDisbursements.occurredAt, priorStart),
        )).orderBy(treasuryCashDisbursements.occurredAt).limit(10000),
        db.select().from(revenueEvents).where(and(
          isNull(revenueEvents.voidedAt),
          gt(revenueEvents.occurredAt, priorStart),
        )).orderBy(revenueEvents.occurredAt).limit(20000),
        db.select().from(directCostEntries).where(and(
          isNull(directCostEntries.voidedAt),
          gt(directCostEntries.occurredAt, priorStart),
        )).orderBy(directCostEntries.occurredAt).limit(20000),
        db.select().from(acquisitionSpendEntries).where(and(
          isNull(acquisitionSpendEntries.voidedAt),
          gt(acquisitionSpendEntries.occurredAt, priorStart),
        )).orderBy(acquisitionSpendEntries.occurredAt).limit(10000),
        db.select().from(operatingExpenseEntries).where(and(
          isNull(operatingExpenseEntries.voidedAt),
          gt(operatingExpenseEntries.occurredAt, priorStart),
        )).orderBy(operatingExpenseEntries.occurredAt).limit(10000),
        db.select().from(operatingTaxProvisions).where(and(
          isNull(operatingTaxProvisions.voidedAt),
          gt(operatingTaxProvisions.periodEnd, priorStart),
        )).orderBy(operatingTaxProvisions.periodStart).limit(5000),
        db.select().from(investedCapitalSnapshots).where(and(
          isNull(investedCapitalSnapshots.voidedAt),
          gt(investedCapitalSnapshots.capturedAt, new Date(priorStart.getTime() - 60 * DAY_MS)),
        )).orderBy(investedCapitalSnapshots.capturedAt).limit(5000),
        db.select().from(capitalDeploymentEntries).where(and(
          isNull(capitalDeploymentEntries.voidedAt),
          gt(capitalDeploymentEntries.occurredAt, priorStart),
        )).orderBy(capitalDeploymentEntries.occurredAt).limit(10000),
        db.select().from(costEvidenceAttestations).where(isNull(costEvidenceAttestations.voidedAt))
          .orderBy(costEvidenceAttestations.throughAt).limit(20000),
        db.select().from(financialEvidenceAttestations).where(isNull(financialEvidenceAttestations.voidedAt))
          .orderBy(financialEvidenceAttestations.throughAt).limit(5000),
        db.select().from(capitalHurdlePolicies).orderBy(capitalHurdlePolicies.effectiveFrom).limit(1000),
      ]);

      const latestBalance = new Map<string, typeof balances[number]>();
      for (const balance of balances) if (!latestBalance.has(balance.accountId)) latestBalance.set(balance.accountId, balance);

      const cashByCurrency = new Map<string, {
        currency: string;
        ledger: number;
        available: number;
        restricted: number;
        unrestricted: number;
        accountCount: number;
        missingBalanceCount: number;
        freshestAt: Date | null;
        stalestAt: Date | null;
      }>();
      for (const account of accounts) {
        const balance = latestBalance.get(account.id);
        const row = cashByCurrency.get(account.currency) ?? {
          currency: account.currency,
          ledger: 0,
          available: 0,
          restricted: 0,
          unrestricted: 0,
          accountCount: 0,
          missingBalanceCount: 0,
          freshestAt: null,
          stalestAt: null,
        };
        row.accountCount += 1;
        if (!balance) {
          row.missingBalanceCount += 1;
          cashByCurrency.set(account.currency, row);
          continue;
        }
        row.ledger += Number(balance.ledgerBalance);
        row.available += Number(balance.availableBalance);
        row.restricted += Number(balance.restrictedBalance);
        row.unrestricted += Math.max(0, Number(balance.availableBalance) - Number(balance.restrictedBalance));
        if (!row.freshestAt || balance.capturedAt > row.freshestAt) row.freshestAt = balance.capturedAt;
        if (!row.stalestAt || balance.capturedAt < row.stalestAt) row.stalestAt = balance.capturedAt;
        cashByCurrency.set(account.currency, row);
      }

      const latestAttestation = (currency: string, type: string) =>
        evidenceAttestations
          .filter((row) => row.currency === currency && row.evidenceType === type)
          .sort((a, b) => b.throughAt.getTime() - a.throughAt.getTime())[0];

      const runway = [...cashByCurrency.values()].map((cash) => {
        const operatingOutflows = disbursements.filter((row) =>
          row.currency === cash.currency &&
          row.cashUseType === "operating" &&
          row.occurredAt >= runwayStart &&
          row.occurredAt <= now);
        const ninetyDayOutflow = operatingOutflows.reduce((sum, row) => sum + Number(row.amount), 0);
        const monthlyBurn = ninetyDayOutflow > 0 ? ninetyDayOutflow / 90 * 30.44 : null;
        const attestation = latestAttestation(cash.currency, "cash_disbursements_complete");
        const evidenceComplete = Boolean(attestation && attestation.throughAt.getTime() >= now.getTime() - DAY_MS);
        const balanceFresh = Boolean(
          cash.missingBalanceCount === 0 &&
          cash.stalestAt &&
          now.getTime() - cash.stalestAt.getTime() <= 7 * DAY_MS
        );
        return {
          currency: cash.currency,
          unrestrictedCash: cash.unrestricted,
          ninetyDayOperatingCashOutflow: ninetyDayOutflow,
          monthlyOperatingCashBurn: evidenceComplete ? monthlyBurn : null,
          runwayMonths: evidenceComplete && balanceFresh && monthlyBurn && monthlyBurn > 0
            ? round(cash.unrestricted / monthlyBurn, 2)
            : null,
          cashEvidenceComplete: evidenceComplete,
          balanceFresh,
        };
      });

      const currencies = new Set<string>([
        ...revenues.map((row) => row.currency),
        ...directCosts.map((row) => row.currency),
        ...acquisitionSpend.map((row) => row.currency),
        ...operatingExpenses.map((row) => row.currency),
        ...taxes.map((row) => row.currency),
        ...capitalSnapshots.map((row) => row.currency),
        ...cashByCurrency.keys(),
      ]);

      const latestCostAttestation = new Map<string, Date>();
      for (const row of costAttestations) {
        const key = `${row.leadId}::${row.currency}`;
        const previous = latestCostAttestation.get(key);
        if (!previous || row.throughAt > previous) latestCostAttestation.set(key, row.throughAt);
      }

      const snapshotAtOrBefore = (currency: string, target: Date, maxAgeDays: number) => {
        const candidates = capitalSnapshots
          .filter((row) => row.currency === currency && row.capturedAt <= target)
          .sort((a, b) => b.capturedAt.getTime() - a.capturedAt.getTime());
        const row = candidates[0];
        if (!row || target.getTime() - row.capturedAt.getTime() > maxAgeDays * DAY_MS) return null;
        return row;
      };

      const computePeriod = (currency: string, start: Date, end: Date) => {
        const rev = revenues.filter((row) => row.currency === currency && row.occurredAt >= start && row.occurredAt <= end);
        const costs = directCosts.filter((row) => row.currency === currency && row.occurredAt >= start && row.occurredAt <= end);
        const spend = acquisitionSpend.filter((row) => row.currency === currency && row.occurredAt >= start && row.occurredAt <= end);
        const opex = operatingExpenses.filter((row) => row.currency === currency && row.occurredAt >= start && row.occurredAt <= end);
        const taxRows = taxes.filter((row) =>
          row.currency === currency && row.periodEnd >= start && row.periodStart <= end);

        const revenue = rev.reduce((sum, row) => sum + Number(row.amount), 0);
        const directCost = costs.reduce((sum, row) => sum + Number(row.amount), 0);
        const acquisition = spend.reduce((sum, row) => sum + Number(row.amount), 0);
        const operatingExpense = opex.reduce((sum, row) => sum + Number(row.amount), 0);
        const taxProvision = round(taxRows.reduce((sum, row) => sum + proratedAmountForOverlap(
          Number(row.amount),
          row.periodStart,
          row.periodEnd,
          start,
          end,
        ), 0), 2);

        const revenueLeadIds = [...new Set(rev.map((row) => row.leadId))];
        const completeRevenueLeads = revenueLeadIds.filter((leadId) => {
          const latestRevenue = rev
            .filter((row) => row.leadId === leadId)
            .sort((a, b) => b.occurredAt.getTime() - a.occurredAt.getTime())[0];
          const attested = latestCostAttestation.get(`${leadId}::${currency}`);
          return Boolean(latestRevenue && attested && attested >= latestRevenue.occurredAt);
        });
        const costCoveragePct = revenueLeadIds.length
          ? round(completeRevenueLeads.length / revenueLeadIds.length * 100)
          : 0;

        const opexAttestation = latestAttestation(currency, "operating_expenses_complete");
        const opexComplete = Boolean(
          opexAttestation &&
          opexAttestation.throughAt.getTime() >= end.getTime() - DAY_MS,
        );

        const taxCoverageDays = clipIntervals(
          taxRows.map((row) => ({ start: row.periodStart, end: row.periodEnd })),
          start,
          end,
        );
        const requiredDays = daysBetween(start, end) + 1;
        const taxCoveragePct = requiredDays > 0 ? round(Math.min(100, taxCoverageDays / requiredDays * 100)) : 0;
        const taxComplete = taxCoveragePct >= 95;

        const beginning = snapshotAtOrBefore(currency, start, 45);
        const ending = snapshotAtOrBefore(currency, end, 45);
        const beginningInvested = beginning
          ? Number(beginning.operatingAssets) - Number(beginning.operatingLiabilities)
          : null;
        const endingInvested = ending
          ? Number(ending.operatingAssets) - Number(ending.operatingLiabilities)
          : null;
        const averageInvested = beginningInvested !== null && endingInvested !== null
          ? (beginningInvested + endingInvested) / 2
          : null;

        const economicsComplete =
          revenue > 0 &&
          costCoveragePct === 100 &&
          opexComplete &&
          taxComplete &&
          averageInvested !== null &&
          averageInvested > 0;
        const ebit = costCoveragePct === 100 && opexComplete
          ? revenue - directCost - acquisition - operatingExpense
          : null;
        const nopat = economicsComplete && ebit !== null ? ebit - taxProvision : null;
        const roicPct = nopat !== null && averageInvested && averageInvested > 0
          ? round(nopat / averageInvested * 100, 2)
          : null;
        const capitalTurnover = averageInvested && averageInvested > 0
          ? round(revenue / averageInvested, 2)
          : null;

        const operatingDeployment = deployments
          .filter((row) =>
            row.currency === currency &&
            row.occurredAt >= start &&
            row.occurredAt <= end &&
            operatingDeploymentCategories.has(row.category))
          .reduce((sum, row) => sum + Number(row.amount), 0);

        return {
          start: start.toISOString(),
          end: end.toISOString(),
          revenue,
          directCost: costCoveragePct === 100 ? directCost : null,
          acquisitionSpend: acquisition,
          operatingExpense: opexComplete ? operatingExpense : null,
          ebit,
          taxProvision: taxComplete ? taxProvision : null,
          nopat,
          beginningInvestedCapital: beginningInvested,
          endingInvestedCapital: endingInvested,
          averageInvestedCapital: averageInvested,
          roicPct,
          capitalTurnover,
          operatingDeployment,
          operatingDeploymentRatePct: nopat !== null && nopat > 0
            ? round(operatingDeployment / nopat * 100, 2)
            : null,
          evidence: {
            revenueLeadCount: revenueLeadIds.length,
            directCostCoveragePct: costCoveragePct,
            operatingExpenseComplete: opexComplete,
            taxCoveragePct,
            beginningCapitalSnapshotFresh: beginning !== null,
            endingCapitalSnapshotFresh: ending !== null,
            complete: economicsComplete,
          },
        };
      };

      const companyRoic = [...currencies].map((currency) => {
        const current = computePeriod(currency, ttmStart, now);
        const prior = computePeriod(currency, priorStart, priorEnd);

        const hurdle = hurdlePolicies
          .filter((row) =>
            row.currency === currency &&
            row.effectiveFrom <= now &&
            (!row.effectiveTo || row.effectiveTo >= now))
          .sort((a, b) => b.effectiveFrom.getTime() - a.effectiveFrom.getTime())[0];
        const hurdleRatePct = hurdle ? Number(hurdle.annualHurdleRatePct) : null;
        const valueCreationSpreadPct = current.roicPct !== null && hurdleRatePct !== null
          ? round(current.roicPct - hurdleRatePct, 2)
          : null;
        const economicProfit = current.nopat !== null &&
          current.averageInvestedCapital !== null &&
          hurdleRatePct !== null
          ? Math.round(current.nopat - current.averageInvestedCapital * hurdleRatePct / 100)
          : null;

        const deltaNopat = current.nopat !== null && prior.nopat !== null
          ? current.nopat - prior.nopat
          : null;
        const deltaCapital = current.averageInvestedCapital !== null && prior.averageInvestedCapital !== null
          ? current.averageInvestedCapital - prior.averageInvestedCapital
          : null;
        const incrementalRoicPct = deltaNopat !== null && deltaCapital !== null && deltaCapital > 0
          ? round(deltaNopat / deltaCapital * 100, 2)
          : null;

        const liquidity = runway.find((row) => row.currency === currency);
        let posture: "reinvest_candidate" | "selective" | "preserve_capital" | "preserve_liquidity" | "insufficient_data" =
          "insufficient_data";
        const reasons: string[] = [];
        if (!current.evidence.complete) {
          reasons.push("TTM ROIC is withheld until direct costs, operating expenses, taxes and invested capital are complete.");
        } else if (!hurdle) {
          reasons.push("No approved hurdle rate exists for this currency; value-creation spread is withheld.");
        } else if (liquidity?.runwayMonths !== null && liquidity?.runwayMonths !== undefined && liquidity.runwayMonths < 3) {
          posture = "preserve_liquidity";
          reasons.push("Verified operating runway is below three months.");
        } else if (valueCreationSpreadPct !== null && valueCreationSpreadPct >= 5 && current.nopat! > 0) {
          posture = "reinvest_candidate";
          reasons.push("TTM ROIC exceeds the approved hurdle rate by at least five percentage points.");
        } else if (valueCreationSpreadPct !== null && valueCreationSpreadPct >= 0 && current.nopat! > 0) {
          posture = "selective";
          reasons.push("TTM ROIC clears the hurdle rate, but the value-creation spread is below the reinvest threshold.");
        } else if (valueCreationSpreadPct !== null) {
          posture = "preserve_capital";
          reasons.push("TTM ROIC does not clear the approved hurdle rate.");
        }

        return {
          currency,
          currentTtm: current,
          priorTtm: prior,
          hurdle: hurdle ? {
            id: hurdle.id,
            annualHurdleRatePct: hurdleRatePct,
            effectiveFrom: hurdle.effectiveFrom,
            effectiveTo: hurdle.effectiveTo,
          } : null,
          valueCreationSpreadPct,
          economicProfit,
          deltaNopat,
          deltaAverageInvestedCapital: deltaCapital,
          incrementalRoicPct,
          posture,
          reasons,
        };
      });

      response.setHeader("Cache-Control", "no-store");
      response.json({
        asOf: now.toISOString(),
        definitions: {
          roic: "Trailing-12-month NOPAT divided by average beginning/ending invested capital.",
          nopat: "Evidence-backed EBIT less covered operating tax provision. EBIT deducts direct costs, acquisition spend and non-acquisition operating expenses.",
          capitalTurnover: "Trailing-12-month recognized revenue divided by average invested capital.",
          operatingDeploymentRate: "Actual growth-capex + working-capital + product-development deployment divided by NOPAT; management deployment metric, not an assumed accounting reinvestment rate.",
          incrementalRoic: "Change in TTM NOPAT divided by positive change in average invested capital; withheld when comparable evidence or positive incremental capital is absent.",
          runway: "Latest unrestricted available treasury cash divided by average monthly operating cash disbursements over 90 days; requires fresh balances and completeness attestation.",
          hurdle: "Explicit approved annual capital hurdle rate; never inferred from a generic cost-of-capital assumption.",
        },
        treasury: {
          cashPositionByCurrency: [...cashByCurrency.values()].map((row) => ({
            currency: row.currency,
            ledgerBalance: row.ledger,
            availableBalance: row.available,
            restrictedBalance: row.restricted,
            unrestrictedCash: row.unrestricted,
            accountCount: row.accountCount,
            missingBalanceCount: row.missingBalanceCount,
            freshestCapturedAt: row.freshestAt,
            stalestCapturedAt: row.stalestAt,
            balanceFresh: Boolean(
              row.missingBalanceCount === 0 &&
              row.stalestAt &&
              now.getTime() - row.stalestAt.getTime() <= 7 * DAY_MS
            ),
          })),
          runwayByCurrency: runway,
        },
        companyRoic,
        controls: {
          currenciesNeverBlended: true,
          noAssumedTaxRate: true,
          noAssumedCostOfCapital: true,
          noAssumedMissingExpenses: true,
          postureIsAdvisory: true,
          note: "Treasury/ROIC postures do not authorize transfers or spending. Existing approved capital-budget controls remain the authorization layer.",
        },
      });
    },
  );

  return router;
}
