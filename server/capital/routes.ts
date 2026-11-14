import {
  and,
  desc,
  eq,
  gt,
  inArray,
  isNull,
  lte,
  sql,
} from "drizzle-orm";
import { Router } from "express";
import { z } from "zod";
import {
  acquisitionSpendEntries,
  auditEvents,
  capitalBudgetAllocations,
  capitalBudgetCycles,
  cashCollections,
  commercialInvoices,
  costEvidenceAttestations,
  deliveryCapacityRecords,
  directCostEntries,
  leadAttributionTouches,
  leads,
  recurringRevenueAgreements,
  recurringRevenueMovements,
  revenueEvents,
} from "../../shared/schema.js";
import { requireAdminPermission } from "../custom-auth.js";
import { db } from "../db.js";

const DAY_MS = 86_400_000;
const supportedWindows = ["30d", "90d", "365d", "all"] as const;
type WindowValue = typeof supportedWindows[number];

const moneySchema = z.union([
  z.number().positive(),
  z.string().regex(/^\d+(?:\.\d{1,2})?$/).transform(Number).refine((value) => value > 0),
]);

const nonnegativeMoneySchema = z.union([
  z.number().nonnegative(),
  z.string().regex(/^\d+(?:\.\d{1,2})?$/).transform(Number),
]);

const invoiceInputSchema = z.object({
  leadId: z.string().uuid(),
  revenueEventId: z.string().uuid().nullable().optional(),
  serviceInterest: z.string().trim().min(1).max(180),
  invoiceNumber: z.string().trim().min(1).max(120),
  currency: z.string().trim().length(3).transform((value) => value.toUpperCase()),
  amount: moneySchema,
  issuedAt: z.string().datetime(),
  dueAt: z.string().datetime(),
  sourceReference: z.string().trim().min(3).max(2000),
  notes: z.string().trim().max(4000).nullable().optional(),
}).strict();

const collectionInputSchema = z.object({
  invoiceId: z.string().uuid(),
  amount: moneySchema,
  receivedAt: z.string().datetime(),
  paymentMethod: z.enum(["bank_transfer", "mobile_money", "cash", "card", "cheque", "other"]),
  sourceReference: z.string().trim().min(3).max(2000),
  notes: z.string().trim().max(4000).nullable().optional(),
}).strict();

const movementInputSchema = z.object({
  agreementId: z.string().uuid(),
  movementType: z.enum(["expansion", "contraction", "churn", "reactivation"]),
  mrrDelta: z.number().refine((value) => Number.isFinite(value) && value !== 0),
  effectiveAt: z.string().datetime(),
  sourceReference: z.string().trim().min(3).max(2000),
  notes: z.string().trim().max(4000).nullable().optional(),
}).strict();

const capacityInputSchema = z.object({
  serviceInterest: z.string().trim().min(1).max(180),
  capacityScope: z.string().trim().min(1).max(180),
  periodStart: z.string().datetime(),
  periodEnd: z.string().datetime(),
  availableHours: z.number().nonnegative(),
  deliveryHours: z.number().nonnegative(),
  billableHours: z.number().nonnegative(),
  sourceReference: z.string().trim().min(3).max(2000),
  notes: z.string().trim().max(4000).nullable().optional(),
}).strict();

const budgetInputSchema = z.object({
  periodStart: z.string().datetime(),
  periodEnd: z.string().datetime(),
  currency: z.string().trim().length(3).transform((value) => value.toUpperCase()),
  envelopeAmount: moneySchema,
  sourceReference: z.string().trim().min(3).max(2000),
  notes: z.string().trim().max(4000).nullable().optional(),
}).strict();

const allocationInputSchema = z.object({
  channel: z.string().trim().min(1).max(48),
  serviceInterest: z.string().trim().min(1).max(180),
  recommendationDecision: z.enum(["scale", "maintain", "cut", "insufficient_data"]),
  recommendationConfidence: z.enum(["low", "medium", "high"]),
  recommendedAmount: nonnegativeMoneySchema,
  approvedAmount: nonnegativeMoneySchema,
  sourceWindow: z.enum(["30d", "90d", "365d", "all"]),
  recommendationSnapshot: z.record(z.string(), z.unknown()).default({}),
  rationale: z.string().trim().min(5).max(4000),
}).strict();

const voidSchema = z.object({
  reason: z.string().trim().min(5).max(1000),
}).strict();

const budgetApprovalSchema = z.object({
  exceptionReason: z.string().trim().min(10).max(2000).nullable().optional(),
}).strict();

function windowStart(value: WindowValue) {
  if (value === "all") return null;
  const days = value === "30d" ? 30 : value === "365d" ? 365 : 90;
  return new Date(Date.now() - days * DAY_MS);
}

function round(value: number, digits = 1) {
  const multiplier = 10 ** digits;
  return Math.round(value * multiplier) / multiplier;
}

type MovementLike = {
  movementType: string;
  mrrDelta: number;
  effectiveAt: Date;
  createdAt?: Date | null;
};

function validateMrrHistory(initialMrr: number, movements: MovementLike[]) {
  const ordered = [...movements].sort((a, b) =>
    a.effectiveAt.getTime() - b.effectiveAt.getTime() ||
    (a.createdAt?.getTime() ?? Number.MAX_SAFE_INTEGER) -
      (b.createdAt?.getTime() ?? Number.MAX_SAFE_INTEGER));
  let currentMrr = initialMrr;
  let latestChurn: Date | null = null;

  for (const movement of ordered) {
    const delta = Number(movement.mrrDelta);
    const nextMrr = currentMrr + delta;
    if (movement.movementType === "expansion") {
      if (currentMrr <= 0.005 || delta <= 0) return { valid: false as const };
    } else if (movement.movementType === "contraction") {
      if (currentMrr <= 0.005 || delta >= 0 || nextMrr <= 0.005) return { valid: false as const };
    } else if (movement.movementType === "churn") {
      if (currentMrr <= 0.005 || delta >= 0 || Math.abs(nextMrr) > 0.005) return { valid: false as const };
      latestChurn = movement.effectiveAt;
    } else if (movement.movementType === "reactivation") {
      if (Math.abs(currentMrr) > 0.005 || delta <= 0) return { valid: false as const };
    } else {
      return { valid: false as const };
    }
    if (nextMrr < -0.005) return { valid: false as const };
    currentMrr = Math.abs(nextMrr) <= 0.005 ? 0 : nextMrr;
  }

  return { valid: true as const, currentMrr, latestChurn };
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

async function validateWonLead(leadId: string, serviceInterest: string) {
  const [lead] = await db.select({
    id: leads.id,
    stage: leads.stage,
    serviceInterest: leads.serviceInterest,
    currency: leads.currency,
  }).from(leads).where(and(eq(leads.id, leadId), isNull(leads.archivedAt))).limit(1);
  if (!lead) return { outcome: "missing" as const };
  if (lead.stage !== "won") return { outcome: "not_won" as const };
  if (lead.serviceInterest && lead.serviceInterest !== serviceInterest) {
    return { outcome: "service_mismatch" as const, expected: lead.serviceInterest };
  }
  return { outcome: "ok" as const, lead };
}

async function activeInvoiceCollections(invoiceId: string) {
  return db.select().from(cashCollections).where(and(
    eq(cashCollections.invoiceId, invoiceId),
    isNull(cashCollections.voidedAt),
  ));
}

async function refreshInvoiceStatus(invoiceId: string) {
  const [invoice] = await db.select().from(commercialInvoices)
    .where(eq(commercialInvoices.id, invoiceId)).limit(1);
  if (!invoice || invoice.voidedAt) return invoice;
  const collections = await activeInvoiceCollections(invoiceId);
  const collected = collections.reduce((sum, row) => sum + Number(row.amount), 0);
  const amount = Number(invoice.amount);
  const status = collected <= 0 ? "issued" : collected + 0.005 >= amount ? "paid" : "partially_paid";
  const [updated] = await db.update(commercialInvoices).set({ status })
    .where(eq(commercialInvoices.id, invoiceId)).returning();
  return updated;
}

function retentionPeriodStart(windowValue: WindowValue) {
  return windowStart(windowValue) ?? new Date(Date.now() - 365 * DAY_MS);
}

export function createCapitalOperatingRouter() {
  const router = Router();

  router.get(
    "/api/admin/capital/invoices",
    requireAdminPermission("pipeline.financial.read"),
    async (_request, response) => {
      const rows = await db.select().from(commercialInvoices)
        .orderBy(desc(commercialInvoices.issuedAt)).limit(1500);
      response.setHeader("Cache-Control", "no-store");
      response.json(rows);
    },
  );

  router.post(
    "/api/admin/capital/invoices",
    requireAdminPermission("cash.realization.manage"),
    async (request, response) => {
      const parsed = invoiceInputSchema.safeParse(request.body);
      if (!parsed.success) return response.status(400).json({ message: "Invalid invoice evidence", errors: parsed.error.issues });
      const input = parsed.data;
      const issuedAt = new Date(input.issuedAt);
      const dueAt = new Date(input.dueAt);
      if (issuedAt.getTime() > Date.now() + 10 * 60 * 1000) {
        return response.status(400).json({ message: "Invoice issue date cannot be in the future" });
      }
      if (dueAt.getTime() < issuedAt.getTime()) {
        return response.status(400).json({ message: "Invoice due date cannot precede issue date" });
      }
      const validation = await validateWonLead(input.leadId, input.serviceInterest);
      if (validation.outcome === "missing") return response.status(404).json({ message: "Lead not found" });
      if (validation.outcome === "not_won") return response.status(409).json({ message: "Invoices can only be attached to a won opportunity" });
      if (validation.outcome === "service_mismatch") return response.status(409).json({ message: `Service must match the won opportunity: ${validation.expected}` });

      const [duplicate] = await db.select({ id: commercialInvoices.id }).from(commercialInvoices)
        .where(eq(commercialInvoices.invoiceNumber, input.invoiceNumber)).limit(1);
      if (duplicate) return response.status(409).json({ message: "Invoice number already exists" });

      if (input.revenueEventId) {
        const [event] = await db.select().from(revenueEvents)
          .where(eq(revenueEvents.id, input.revenueEventId)).limit(1);
        if (!event || event.voidedAt) return response.status(409).json({ message: "Revenue event is missing or voided" });
        if (
          event.leadId !== input.leadId ||
          event.serviceInterest !== input.serviceInterest ||
          event.currency !== input.currency
        ) {
          return response.status(409).json({ message: "Revenue event must match invoice lead, service and currency" });
        }
      }

      const [record] = await db.insert(commercialInvoices).values({
        leadId: input.leadId,
        revenueEventId: input.revenueEventId || null,
        serviceInterest: input.serviceInterest,
        invoiceNumber: input.invoiceNumber,
        currency: input.currency,
        amount: String(input.amount),
        issuedAt,
        dueAt,
        sourceReference: input.sourceReference,
        notes: input.notes || null,
        createdBy: request.securityPrincipal?.userId ?? null,
      }).returning();
      await audit(request, "cash.invoice.create", "commercial_invoice", record.id, null, record);
      response.status(201).json(record);
    },
  );

  router.post(
    "/api/admin/capital/invoices/:id/void",
    requireAdminPermission("cash.realization.manage"),
    async (request, response) => {
      const parsed = voidSchema.safeParse(request.body);
      if (!parsed.success) return response.status(400).json({ message: "Invalid invoice void request", errors: parsed.error.issues });
      const [previous] = await db.select().from(commercialInvoices)
        .where(eq(commercialInvoices.id, request.params.id)).limit(1);
      if (!previous) return response.status(404).json({ message: "Invoice not found" });
      if (previous.voidedAt) return response.status(409).json({ message: "Invoice is already voided" });
      const activeCollections = await activeInvoiceCollections(previous.id);
      if (activeCollections.length) {
        return response.status(409).json({ message: "Void active collections before voiding the invoice" });
      }
      const [record] = await db.update(commercialInvoices).set({
        status: "void",
        voidedAt: new Date(),
        voidedBy: request.securityPrincipal?.userId ?? null,
        voidReason: parsed.data.reason,
      }).where(eq(commercialInvoices.id, previous.id)).returning();
      await audit(request, "cash.invoice.void", "commercial_invoice", previous.id, previous, record, parsed.data.reason);
      response.json(record);
    },
  );

  router.get(
    "/api/admin/capital/collections",
    requireAdminPermission("pipeline.financial.read"),
    async (_request, response) => {
      const rows = await db.select().from(cashCollections)
        .orderBy(desc(cashCollections.receivedAt)).limit(2000);
      response.setHeader("Cache-Control", "no-store");
      response.json(rows);
    },
  );

  router.post(
    "/api/admin/capital/collections",
    requireAdminPermission("cash.realization.manage"),
    async (request, response) => {
      const parsed = collectionInputSchema.safeParse(request.body);
      if (!parsed.success) return response.status(400).json({ message: "Invalid collection evidence", errors: parsed.error.issues });
      const input = parsed.data;
      const receivedAt = new Date(input.receivedAt);
      if (receivedAt.getTime() > Date.now() + 10 * 60 * 1000) {
        return response.status(400).json({ message: "Collection timestamp cannot be in the future" });
      }

      const result = await db.transaction(async (transaction) => {
        await transaction.execute(sql`select id from commercial_invoices where id = ${input.invoiceId} for update`);
        const [invoice] = await transaction.select().from(commercialInvoices)
          .where(eq(commercialInvoices.id, input.invoiceId)).limit(1);
        if (!invoice) return { outcome: "missing" as const };
        if (invoice.voidedAt || invoice.status === "void") return { outcome: "voided" as const };
        if (receivedAt.getTime() < invoice.issuedAt.getTime()) return { outcome: "before_issue" as const };
        const collections = await transaction.select().from(cashCollections).where(and(
          eq(cashCollections.invoiceId, invoice.id),
          isNull(cashCollections.voidedAt),
        ));
        const collected = collections.reduce((sum, row) => sum + Number(row.amount), 0);
        const outstanding = Number(invoice.amount) - collected;
        if (input.amount > outstanding + 0.005) return { outcome: "over_collection" as const, outstanding };

        const [record] = await transaction.insert(cashCollections).values({
          invoiceId: invoice.id,
          amount: String(input.amount),
          receivedAt,
          paymentMethod: input.paymentMethod,
          sourceReference: input.sourceReference,
          notes: input.notes || null,
          createdBy: request.securityPrincipal?.userId ?? null,
        }).returning();
        const total = collected + input.amount;
        const status = total + 0.005 >= Number(invoice.amount) ? "paid" : "partially_paid";
        await transaction.update(commercialInvoices).set({ status })
          .where(eq(commercialInvoices.id, invoice.id));
        await transaction.insert(auditEvents).values({
          actorUserId: request.securityPrincipal?.userId ?? null,
          actorSessionId: request.securityPrincipal?.sessionId ?? null,
          action: "cash.collection.create",
          resourceType: "cash_collection",
          resourceId: record.id,
          result: "success",
          requestId: request.requestId,
          newState: record,
        });
        return { outcome: "ok" as const, record };
      });
      if (result.outcome === "missing") return response.status(404).json({ message: "Invoice not found" });
      if (result.outcome === "voided") return response.status(409).json({ message: "Cannot collect against a void invoice" });
      if (result.outcome === "before_issue") return response.status(400).json({ message: "Collection cannot precede invoice issue date" });
      if (result.outcome === "over_collection") {
        return response.status(409).json({ message: "Collection exceeds outstanding invoice balance", outstanding: result.outstanding });
      }
      response.status(201).json(result.record);
    },
  );

  router.post(
    "/api/admin/capital/collections/:id/void",
    requireAdminPermission("cash.realization.manage"),
    async (request, response) => {
      const parsed = voidSchema.safeParse(request.body);
      if (!parsed.success) return response.status(400).json({ message: "Invalid collection void request", errors: parsed.error.issues });
      const [previous] = await db.select().from(cashCollections)
        .where(eq(cashCollections.id, request.params.id)).limit(1);
      if (!previous) return response.status(404).json({ message: "Collection not found" });
      if (previous.voidedAt) return response.status(409).json({ message: "Collection is already voided" });
      const [record] = await db.update(cashCollections).set({
        voidedAt: new Date(),
        voidedBy: request.securityPrincipal?.userId ?? null,
        voidReason: parsed.data.reason,
      }).where(eq(cashCollections.id, previous.id)).returning();
      await refreshInvoiceStatus(previous.invoiceId);
      await audit(request, "cash.collection.void", "cash_collection", previous.id, previous, record, parsed.data.reason);
      response.json(record);
    },
  );

  router.get(
    "/api/admin/capital/retention-movements",
    requireAdminPermission("pipeline.financial.read"),
    async (_request, response) => {
      const rows = await db.select().from(recurringRevenueMovements)
        .orderBy(desc(recurringRevenueMovements.effectiveAt)).limit(2000);
      response.setHeader("Cache-Control", "no-store");
      response.json(rows);
    },
  );

  router.post(
    "/api/admin/capital/retention-movements",
    requireAdminPermission("retention.evidence.manage"),
    async (request, response) => {
      const parsed = movementInputSchema.safeParse(request.body);
      if (!parsed.success) return response.status(400).json({ message: "Invalid recurring revenue movement", errors: parsed.error.issues });
      const input = parsed.data;
      const effectiveAt = new Date(input.effectiveAt);
      if (effectiveAt.getTime() > Date.now() + 10 * 60 * 1000) {
        return response.status(400).json({ message: "Movement effective date cannot be in the future" });
      }
      const result = await db.transaction(async (transaction) => {
        await transaction.execute(sql`select id from recurring_revenue_agreements where id = ${input.agreementId} for update`);
        const [agreement] = await transaction.select().from(recurringRevenueAgreements)
          .where(eq(recurringRevenueAgreements.id, input.agreementId)).limit(1);
        if (!agreement) return { outcome: "missing" as const };
        if (agreement.voidedAt) return { outcome: "voided" as const };
        if (effectiveAt.getTime() < agreement.startedAt.getTime()) return { outcome: "before_start" as const };
        const movements = await transaction.select().from(recurringRevenueMovements).where(and(
          eq(recurringRevenueMovements.agreementId, agreement.id),
          isNull(recurringRevenueMovements.voidedAt),
        ));
        const history = validateMrrHistory(Number(agreement.monthlyRecurringRevenue), [
          ...movements.map((movement) => ({
            movementType: movement.movementType,
            mrrDelta: Number(movement.mrrDelta),
            effectiveAt: movement.effectiveAt,
            createdAt: movement.createdAt,
          })),
          {
            movementType: input.movementType,
            mrrDelta: input.mrrDelta,
            effectiveAt,
            createdAt: new Date(),
          },
        ]);
        if (!history.valid) return { outcome: "invalid_transition" as const };

        const [record] = await transaction.insert(recurringRevenueMovements).values({
          agreementId: agreement.id,
          leadId: agreement.leadId,
          serviceInterest: agreement.serviceInterest,
          currency: agreement.currency,
          movementType: input.movementType,
          mrrDelta: String(input.mrrDelta),
          effectiveAt,
          sourceReference: input.sourceReference,
          notes: input.notes || null,
          createdBy: request.securityPrincipal?.userId ?? null,
        }).returning();

        await transaction.update(recurringRevenueAgreements).set(
          history.currentMrr <= 0.005
            ? { status: "cancelled", endedAt: history.latestChurn ?? effectiveAt }
            : { status: "active", endedAt: null },
        ).where(eq(recurringRevenueAgreements.id, agreement.id));

        await transaction.insert(auditEvents).values({
          actorUserId: request.securityPrincipal?.userId ?? null,
          actorSessionId: request.securityPrincipal?.sessionId ?? null,
          action: "retention.movement.create",
          resourceType: "recurring_revenue_movement",
          resourceId: record.id,
          result: "success",
          requestId: request.requestId,
          newState: record,
        });
        return { outcome: "ok" as const, record, currentMrr: history.currentMrr };
      });

      if (result.outcome === "missing") return response.status(404).json({ message: "Recurring agreement not found" });
      if (result.outcome === "voided") return response.status(409).json({ message: "Recurring agreement is voided" });
      if (result.outcome === "before_start") return response.status(400).json({ message: "Movement cannot precede agreement start" });
      if (result.outcome === "invalid_transition") return response.status(409).json({ message: "Movement type and MRR delta do not form a valid retention transition" });
      response.status(201).json(result);
    },
  );

  router.post(
    "/api/admin/capital/retention-movements/:id/void",
    requireAdminPermission("retention.evidence.manage"),
    async (request, response) => {
      const parsed = voidSchema.safeParse(request.body);
      if (!parsed.success) return response.status(400).json({ message: "Invalid movement void request", errors: parsed.error.issues });
      const result = await db.transaction(async (transaction) => {
        await transaction.execute(sql`select id from recurring_revenue_movements where id = ${request.params.id} for update`);
        const [previous] = await transaction.select().from(recurringRevenueMovements)
          .where(eq(recurringRevenueMovements.id, request.params.id)).limit(1);
        if (!previous) return { outcome: "missing" as const };
        if (previous.voidedAt) return { outcome: "voided" as const };

        await transaction.execute(sql`select id from recurring_revenue_agreements where id = ${previous.agreementId} for update`);
        const [agreement] = await transaction.select().from(recurringRevenueAgreements)
          .where(eq(recurringRevenueAgreements.id, previous.agreementId)).limit(1);
        if (!agreement || agreement.voidedAt) return { outcome: "agreement_unavailable" as const };
        const allMovements = await transaction.select().from(recurringRevenueMovements).where(and(
          eq(recurringRevenueMovements.agreementId, agreement.id),
          isNull(recurringRevenueMovements.voidedAt),
        ));
        const remaining = allMovements.filter((movement) => movement.id !== previous.id);
        const history = validateMrrHistory(
          Number(agreement.monthlyRecurringRevenue),
          remaining.map((movement) => ({
            movementType: movement.movementType,
            mrrDelta: Number(movement.mrrDelta),
            effectiveAt: movement.effectiveAt,
            createdAt: movement.createdAt,
          })),
        );
        if (!history.valid) return { outcome: "history_invalid" as const };

        const [record] = await transaction.update(recurringRevenueMovements).set({
          voidedAt: new Date(),
          voidedBy: request.securityPrincipal?.userId ?? null,
          voidReason: parsed.data.reason,
        }).where(eq(recurringRevenueMovements.id, previous.id)).returning();

        await transaction.update(recurringRevenueAgreements).set(
          history.currentMrr <= 0.005
            ? { status: "cancelled", endedAt: history.latestChurn ?? agreement.endedAt }
            : { status: "active", endedAt: null },
        ).where(eq(recurringRevenueAgreements.id, agreement.id));

        await transaction.insert(auditEvents).values({
          actorUserId: request.securityPrincipal?.userId ?? null,
          actorSessionId: request.securityPrincipal?.sessionId ?? null,
          action: "retention.movement.void",
          resourceType: "recurring_revenue_movement",
          resourceId: previous.id,
          result: "success",
          requestId: request.requestId,
          previousState: previous,
          newState: record,
          justification: parsed.data.reason,
        });
        return { outcome: "ok" as const, record };
      });
      if (result.outcome === "missing") return response.status(404).json({ message: "Recurring revenue movement not found" });
      if (result.outcome === "voided") return response.status(409).json({ message: "Recurring revenue movement is already voided" });
      if (result.outcome === "agreement_unavailable") return response.status(409).json({ message: "Recurring agreement is unavailable" });
      if (result.outcome === "history_invalid") return response.status(409).json({ message: "Voiding this movement would invalidate later MRR history" });
      response.json(result.record);
    },
  );

  router.get(
    "/api/admin/capital/capacity",
    requireAdminPermission("pipeline.financial.read"),
    async (_request, response) => {
      const rows = await db.select().from(deliveryCapacityRecords)
        .orderBy(desc(deliveryCapacityRecords.periodEnd)).limit(1500);
      response.setHeader("Cache-Control", "no-store");
      response.json(rows);
    },
  );

  router.post(
    "/api/admin/capital/capacity",
    requireAdminPermission("delivery.capacity.manage"),
    async (request, response) => {
      const parsed = capacityInputSchema.safeParse(request.body);
      if (!parsed.success) return response.status(400).json({ message: "Invalid delivery capacity evidence", errors: parsed.error.issues });
      const input = parsed.data;
      const periodStart = new Date(input.periodStart);
      const periodEnd = new Date(input.periodEnd);
      if (periodEnd.getTime() < periodStart.getTime()) return response.status(400).json({ message: "Capacity period end cannot precede start" });
      if (input.billableHours > input.deliveryHours + 0.005) return response.status(400).json({ message: "Billable hours cannot exceed delivery hours" });
      const [record] = await db.insert(deliveryCapacityRecords).values({
        serviceInterest: input.serviceInterest,
        capacityScope: input.capacityScope,
        periodStart,
        periodEnd,
        availableHours: String(input.availableHours),
        deliveryHours: String(input.deliveryHours),
        billableHours: String(input.billableHours),
        sourceReference: input.sourceReference,
        notes: input.notes || null,
        createdBy: request.securityPrincipal?.userId ?? null,
      }).returning();
      await audit(request, "delivery.capacity.create", "delivery_capacity_record", record.id, null, record);
      response.status(201).json(record);
    },
  );

  router.post(
    "/api/admin/capital/capacity/:id/void",
    requireAdminPermission("delivery.capacity.manage"),
    async (request, response) => {
      const parsed = voidSchema.safeParse(request.body);
      if (!parsed.success) return response.status(400).json({ message: "Invalid capacity void request", errors: parsed.error.issues });
      const [previous] = await db.select().from(deliveryCapacityRecords)
        .where(eq(deliveryCapacityRecords.id, request.params.id)).limit(1);
      if (!previous) return response.status(404).json({ message: "Capacity record not found" });
      if (previous.voidedAt) return response.status(409).json({ message: "Capacity record is already voided" });
      const [record] = await db.update(deliveryCapacityRecords).set({
        voidedAt: new Date(),
        voidedBy: request.securityPrincipal?.userId ?? null,
        voidReason: parsed.data.reason,
      }).where(eq(deliveryCapacityRecords.id, previous.id)).returning();
      await audit(request, "delivery.capacity.void", "delivery_capacity_record", previous.id, previous, record, parsed.data.reason);
      response.json(record);
    },
  );

  router.get(
    "/api/admin/capital/budgets",
    requireAdminPermission("pipeline.financial.read"),
    async (_request, response) => {
      const [budgets, allocations] = await Promise.all([
        db.select().from(capitalBudgetCycles).orderBy(desc(capitalBudgetCycles.periodStart)).limit(200),
        db.select().from(capitalBudgetAllocations).orderBy(desc(capitalBudgetAllocations.updatedAt)).limit(2000),
      ]);
      response.setHeader("Cache-Control", "no-store");
      response.json(budgets.map((budget) => ({
        ...budget,
        allocations: allocations.filter((allocation) => allocation.budgetId === budget.id),
      })));
    },
  );

  router.post(
    "/api/admin/capital/budgets",
    requireAdminPermission("capital.budget.manage"),
    async (request, response) => {
      const parsed = budgetInputSchema.safeParse(request.body);
      if (!parsed.success) return response.status(400).json({ message: "Invalid capital budget", errors: parsed.error.issues });
      const input = parsed.data;
      const periodStart = new Date(input.periodStart);
      const periodEnd = new Date(input.periodEnd);
      if (periodEnd.getTime() < periodStart.getTime()) return response.status(400).json({ message: "Budget period end cannot precede start" });
      const [existing] = await db.select({ id: capitalBudgetCycles.id }).from(capitalBudgetCycles).where(and(
        eq(capitalBudgetCycles.periodStart, periodStart),
        eq(capitalBudgetCycles.periodEnd, periodEnd),
        eq(capitalBudgetCycles.currency, input.currency),
      )).limit(1);
      if (existing) return response.status(409).json({ message: "A budget already exists for this period and currency" });
      const [record] = await db.insert(capitalBudgetCycles).values({
        periodStart,
        periodEnd,
        currency: input.currency,
        envelopeAmount: String(input.envelopeAmount),
        sourceReference: input.sourceReference,
        notes: input.notes || null,
        createdBy: request.securityPrincipal?.userId ?? null,
      }).returning();
      await audit(request, "capital.budget.create", "capital_budget", record.id, null, record);
      response.status(201).json(record);
    },
  );

  router.post(
    "/api/admin/capital/budgets/:id/allocations",
    requireAdminPermission("capital.budget.manage"),
    async (request, response) => {
      const parsed = allocationInputSchema.safeParse(request.body);
      if (!parsed.success) return response.status(400).json({ message: "Invalid budget allocation", errors: parsed.error.issues });
      const input = parsed.data;
      const result = await db.transaction(async (transaction) => {
        await transaction.execute(sql`select id from capital_budget_cycles where id = ${request.params.id} for update`);
        const [budget] = await transaction.select().from(capitalBudgetCycles)
          .where(eq(capitalBudgetCycles.id, request.params.id)).limit(1);
        if (!budget) return { outcome: "missing" as const };
        if (budget.status !== "draft") return { outcome: "locked" as const };
        const existing = await transaction.select().from(capitalBudgetAllocations)
          .where(eq(capitalBudgetAllocations.budgetId, budget.id));
        const otherApproved = existing
          .filter((row) => !(row.channel === input.channel && row.serviceInterest === input.serviceInterest))
          .reduce((sum, row) => sum + Number(row.approvedAmount), 0);
        if (otherApproved + input.approvedAmount > Number(budget.envelopeAmount) + 0.005) {
          return { outcome: "over_envelope" as const };
        }
        const current = existing.find((row) => row.channel === input.channel && row.serviceInterest === input.serviceInterest);
        const values = {
          budgetId: budget.id,
          channel: input.channel,
          serviceInterest: input.serviceInterest,
          recommendationDecision: input.recommendationDecision,
          recommendationConfidence: input.recommendationConfidence,
          recommendedAmount: String(input.recommendedAmount),
          approvedAmount: String(input.approvedAmount),
          sourceWindow: input.sourceWindow,
          recommendationSnapshot: input.recommendationSnapshot,
          rationale: input.rationale,
          createdBy: request.securityPrincipal?.userId ?? null,
          updatedAt: new Date(),
        };
        let record;
        if (current) {
          [record] = await transaction.update(capitalBudgetAllocations).set(values)
            .where(eq(capitalBudgetAllocations.id, current.id)).returning();
        } else {
          [record] = await transaction.insert(capitalBudgetAllocations).values(values).returning();
        }
        await transaction.insert(auditEvents).values({
          actorUserId: request.securityPrincipal?.userId ?? null,
          actorSessionId: request.securityPrincipal?.sessionId ?? null,
          action: "capital.budget.allocation.upsert",
          resourceType: "capital_budget_allocation",
          resourceId: record.id,
          result: "success",
          requestId: request.requestId,
          previousState: current ?? null,
          newState: record,
        });
        return { outcome: "ok" as const, record };
      });
      if (result.outcome === "missing") return response.status(404).json({ message: "Capital budget not found" });
      if (result.outcome === "locked") return response.status(409).json({ message: "Only draft budgets can be edited" });
      if (result.outcome === "over_envelope") return response.status(409).json({ message: "Approved allocations exceed budget envelope" });
      response.json(result.record);
    },
  );

  router.post(
    "/api/admin/capital/budgets/:id/approve",
    requireAdminPermission("capital.budget.approve"),
    async (request, response) => {
      const parsed = budgetApprovalSchema.safeParse(request.body ?? {});
      if (!parsed.success) return response.status(400).json({ message: "Invalid budget approval request", errors: parsed.error.issues });
      const result = await db.transaction(async (transaction) => {
        await transaction.execute(sql`select id from capital_budget_cycles where id = ${request.params.id} for update`);
        const [budget] = await transaction.select().from(capitalBudgetCycles)
          .where(eq(capitalBudgetCycles.id, request.params.id)).limit(1);
        if (!budget) return { outcome: "missing" as const };
        if (budget.status !== "draft") return { outcome: "locked" as const };
        const allocations = await transaction.select().from(capitalBudgetAllocations)
          .where(eq(capitalBudgetAllocations.budgetId, budget.id));
        const approved = allocations.reduce((sum, row) => sum + Number(row.approvedAmount), 0);
        if (!allocations.length || approved <= 0) return { outcome: "empty" as const };
        if (approved > Number(budget.envelopeAmount) + 0.005) return { outcome: "over_envelope" as const };
        const exceptionAllocations = allocations.filter((row) =>
          Number(row.approvedAmount) > 0 &&
          ["cut", "insufficient_data"].includes(row.recommendationDecision));
        if (exceptionAllocations.length && !parsed.data.exceptionReason) {
          return { outcome: "exception_required" as const, exceptionAllocations };
        }
        const [record] = await transaction.update(capitalBudgetCycles).set({
          status: "approved",
          approvedBy: request.securityPrincipal?.userId ?? null,
          approvedAt: new Date(),
        }).where(eq(capitalBudgetCycles.id, budget.id)).returning();
        await transaction.insert(auditEvents).values({
          actorUserId: request.securityPrincipal?.userId ?? null,
          actorSessionId: request.securityPrincipal?.sessionId ?? null,
          action: "capital.budget.approve",
          resourceType: "capital_budget",
          resourceId: budget.id,
          result: "success",
          requestId: request.requestId,
          previousState: budget,
          newState: record,
          justification: parsed.data.exceptionReason || undefined,
        });
        return { outcome: "ok" as const, record };
      });
      if (result.outcome === "missing") return response.status(404).json({ message: "Capital budget not found" });
      if (result.outcome === "locked") return response.status(409).json({ message: "Budget is not in draft state" });
      if (result.outcome === "empty") return response.status(409).json({ message: "Budget must contain approved allocations before approval" });
      if (result.outcome === "over_envelope") return response.status(409).json({ message: "Approved allocations exceed budget envelope" });
      if (result.outcome === "exception_required") return response.status(409).json({
        message: "Approving capital for CUT or INSUFFICIENT_DATA segments requires an explicit exception reason",
        segments: result.exceptionAllocations.map((row) => ({
          channel: row.channel,
          serviceInterest: row.serviceInterest,
          decision: row.recommendationDecision,
          approvedAmount: row.approvedAmount,
        })),
      });
      response.json(result.record);
    },
  );

  router.post(
    "/api/admin/capital/budgets/:id/close",
    requireAdminPermission("capital.budget.approve"),
    async (request, response) => {
      const [previous] = await db.select().from(capitalBudgetCycles)
        .where(eq(capitalBudgetCycles.id, request.params.id)).limit(1);
      if (!previous) return response.status(404).json({ message: "Capital budget not found" });
      if (previous.status !== "approved") return response.status(409).json({ message: "Only an approved budget can be closed" });
      const [record] = await db.update(capitalBudgetCycles).set({
        status: "closed",
        closedAt: new Date(),
      }).where(eq(capitalBudgetCycles.id, previous.id)).returning();
      await audit(request, "capital.budget.close", "capital_budget", previous.id, previous, record);
      response.json(record);
    },
  );

  router.get(
    "/api/admin/capital/intelligence",
    requireAdminPermission("pipeline.financial.read"),
    async (request, response) => {
      const requested = typeof request.query.window === "string" ? request.query.window : "90d";
      const windowValue = (supportedWindows as readonly string[]).includes(requested)
        ? requested as WindowValue
        : "90d";
      const since = windowStart(windowValue);
      const retentionStart = retentionPeriodStart(windowValue);
      const now = new Date();

      const [
        invoiceRows,
        allOpenInvoices,
        agreementRows,
        movementRows,
        capacityRows,
        spendRows,
        allSpendRows,
        costRows,
        attestationRows,
        cohortLeadRows,
        touchRows,
        budgets,
        allocations,
      ] = await Promise.all([
        db.select().from(commercialInvoices).where(and(
          isNull(commercialInvoices.voidedAt),
          ...(since ? [gt(commercialInvoices.issuedAt, since)] : []),
        )).orderBy(commercialInvoices.issuedAt).limit(5000),
        db.select().from(commercialInvoices).where(and(
          isNull(commercialInvoices.voidedAt),
        )).orderBy(commercialInvoices.dueAt).limit(5000),
        db.select().from(recurringRevenueAgreements).where(
          isNull(recurringRevenueAgreements.voidedAt),
        ).orderBy(recurringRevenueAgreements.startedAt).limit(5000),
        db.select().from(recurringRevenueMovements).where(
          isNull(recurringRevenueMovements.voidedAt),
        ).orderBy(recurringRevenueMovements.effectiveAt).limit(10000),
        db.select().from(deliveryCapacityRecords).where(and(
          isNull(deliveryCapacityRecords.voidedAt),
          ...(since ? [gt(deliveryCapacityRecords.periodEnd, since)] : []),
          lte(deliveryCapacityRecords.periodStart, now),
        )).orderBy(deliveryCapacityRecords.periodStart).limit(5000),
        db.select().from(acquisitionSpendEntries).where(and(
          isNull(acquisitionSpendEntries.voidedAt),
          ...(since ? [gt(acquisitionSpendEntries.occurredAt, since)] : []),
        )).orderBy(acquisitionSpendEntries.occurredAt).limit(5000),
        db.select().from(acquisitionSpendEntries).where(
          isNull(acquisitionSpendEntries.voidedAt),
        ).orderBy(acquisitionSpendEntries.occurredAt).limit(10000),
        db.select().from(directCostEntries).where(
          isNull(directCostEntries.voidedAt),
        ).orderBy(directCostEntries.occurredAt).limit(20000),
        db.select().from(costEvidenceAttestations).where(
          isNull(costEvidenceAttestations.voidedAt),
        ).orderBy(costEvidenceAttestations.throughAt).limit(10000),
        db.select({
          id: leads.id,
          serviceInterest: leads.serviceInterest,
          createdAt: leads.createdAt,
        }).from(leads).where(and(
          isNull(leads.archivedAt),
          ...(since ? [gt(leads.createdAt, since)] : []),
        )).orderBy(leads.createdAt).limit(10000),
        db.select().from(leadAttributionTouches)
          .where(eq(leadAttributionTouches.touchType, "last"))
          .orderBy(leadAttributionTouches.capturedAt).limit(10000),
        db.select().from(capitalBudgetCycles)
          .orderBy(desc(capitalBudgetCycles.periodStart)).limit(200),
        db.select().from(capitalBudgetAllocations)
          .orderBy(desc(capitalBudgetAllocations.updatedAt)).limit(2000),
      ]);

      const invoiceIds = allOpenInvoices.map((invoice) => invoice.id);
      const allInvoiceCollections = invoiceIds.length
        ? await db.select().from(cashCollections).where(and(
            inArray(cashCollections.invoiceId, invoiceIds),
            isNull(cashCollections.voidedAt),
          )).orderBy(cashCollections.receivedAt)
        : [];

      const collectionsByInvoice = new Map<string, typeof allInvoiceCollections>();
      for (const collection of allInvoiceCollections) {
        const list = collectionsByInvoice.get(collection.invoiceId) ?? [];
        list.push(collection);
        collectionsByInvoice.set(collection.invoiceId, list);
      }

      const invoiceCurrencies = new Map<string, {
        currency: string;
        invoiced: number;
        collected: number;
        outstanding: number;
        paidInvoiceDays: number[];
        weightedCollectionDayNumerator: number;
        weightedCollectionAmount: number;
      }>();
      for (const invoice of invoiceRows) {
        const current = invoiceCurrencies.get(invoice.currency) ?? {
          currency: invoice.currency,
          invoiced: 0,
          collected: 0,
          outstanding: 0,
          paidInvoiceDays: [],
          weightedCollectionDayNumerator: 0,
          weightedCollectionAmount: 0,
        };
        const amount = Number(invoice.amount);
        const collections = collectionsByInvoice.get(invoice.id) ?? [];
        const collected = collections.reduce((sum, collection) => sum + Number(collection.amount), 0);
        current.invoiced += amount;
        current.collected += collected;
        current.outstanding += Math.max(0, amount - collected);
        for (const collection of collections) {
          const collectionAmount = Number(collection.amount);
          const dayLag = Math.max(0, (collection.receivedAt.getTime() - invoice.issuedAt.getTime()) / DAY_MS);
          current.weightedCollectionDayNumerator += collectionAmount * dayLag;
          current.weightedCollectionAmount += collectionAmount;
        }
        if (collected + 0.005 >= amount && collections.length) {
          const finalCollectionAt = collections.reduce(
            (latest, collection) => collection.receivedAt.getTime() > latest.getTime() ? collection.receivedAt : latest,
            collections[0].receivedAt,
          );
          current.paidInvoiceDays.push(
            Math.max(0, (finalCollectionAt.getTime() - invoice.issuedAt.getTime()) / DAY_MS),
          );
        }
        invoiceCurrencies.set(invoice.currency, current);
      }

      const receivableBuckets = new Map<string, Map<string, number>>();
      const receivableCounts = new Map<string, number>();
      const bucketName = (daysOverdue: number) =>
        daysOverdue <= 0 ? "not_due" :
          daysOverdue <= 30 ? "1-30" :
            daysOverdue <= 60 ? "31-60" :
              daysOverdue <= 90 ? "61-90" : "90+";
      for (const invoice of allOpenInvoices) {
        if (invoice.status === "paid" || invoice.status === "void") continue;
        const collections = collectionsByInvoice.get(invoice.id) ?? [];
        const collected = collections.reduce((sum, collection) => sum + Number(collection.amount), 0);
        const outstanding = Math.max(0, Number(invoice.amount) - collected);
        if (outstanding <= 0.005) continue;
        const daysOverdue = (now.getTime() - invoice.dueAt.getTime()) / DAY_MS;
        const bucket = bucketName(daysOverdue);
        const values = receivableBuckets.get(bucket) ?? new Map<string, number>();
        values.set(invoice.currency, (values.get(invoice.currency) ?? 0) + outstanding);
        receivableBuckets.set(bucket, values);
        receivableCounts.set(bucket, (receivableCounts.get(bucket) ?? 0) + 1);
      }

      const movementsByAgreement = new Map<string, typeof movementRows>();
      for (const movement of movementRows) {
        const list = movementsByAgreement.get(movement.agreementId) ?? [];
        list.push(movement);
        movementsByAgreement.set(movement.agreementId, list);
      }

      type RetentionRow = {
        key: string;
        service: string;
        currency: string;
        beginningMrr: number;
        newMrr: number;
        expansionMrr: number;
        contractionMrr: number;
        churnMrr: number;
        reactivationMrr: number;
        beginningLogos: number;
        churnedLogos: number;
        unreconciledEndedAgreements: number;
      };
      const retention = new Map<string, RetentionRow>();
      for (const agreement of agreementRows) {
        const key = `${agreement.serviceInterest}::${agreement.currency}`;
        const row = retention.get(key) ?? {
          key,
          service: agreement.serviceInterest,
          currency: agreement.currency,
          beginningMrr: 0,
          newMrr: 0,
          expansionMrr: 0,
          contractionMrr: 0,
          churnMrr: 0,
          reactivationMrr: 0,
          beginningLogos: 0,
          churnedLogos: 0,
          unreconciledEndedAgreements: 0,
        };
        const movements = movementsByAgreement.get(agreement.id) ?? [];
        const initialMrr = Number(agreement.monthlyRecurringRevenue);
        const prePeriodMovements = movements.filter((movement) =>
          movement.effectiveAt.getTime() < retentionStart.getTime());
        const endedBeforePeriod =
          agreement.endedAt && agreement.endedAt.getTime() < retentionStart.getTime();
        const beginningMrr = agreement.startedAt.getTime() < retentionStart.getTime() && !endedBeforePeriod
          ? Math.max(0, initialMrr + prePeriodMovements.reduce((sum, movement) => sum + Number(movement.mrrDelta), 0))
          : 0;
        if (beginningMrr > 0) {
          row.beginningMrr += beginningMrr;
          row.beginningLogos += 1;
        } else if (agreement.startedAt.getTime() >= retentionStart.getTime() && agreement.startedAt.getTime() <= now.getTime()) {
          row.newMrr += initialMrr;
        }
        const periodMovements = movements.filter((movement) =>
          movement.effectiveAt.getTime() >= retentionStart.getTime() &&
          movement.effectiveAt.getTime() <= now.getTime());
        if (beginningMrr > 0) {
          for (const movement of periodMovements) {
            const delta = Number(movement.mrrDelta);
            if (movement.movementType === "expansion") row.expansionMrr += delta;
            if (movement.movementType === "reactivation") row.reactivationMrr += delta;
            if (movement.movementType === "contraction") row.contractionMrr += Math.abs(delta);
            if (movement.movementType === "churn") {
              row.churnMrr += Math.abs(delta);
              row.churnedLogos += 1;
            }
          }
        }
        if (
          agreement.status !== "active" &&
          agreement.endedAt &&
          agreement.endedAt.getTime() >= retentionStart.getTime() &&
          agreement.endedAt.getTime() <= now.getTime() &&
          !periodMovements.some((movement) => movement.movementType === "churn")
        ) {
          row.unreconciledEndedAgreements += 1;
        }
        retention.set(key, row);
      }

      const capacityByService = new Map<string, {
        service: string;
        availableHours: number;
        deliveryHours: number;
        billableHours: number;
        scopes: Set<string>;
      }>();
      for (const record of capacityRows) {
        const row = capacityByService.get(record.serviceInterest) ?? {
          service: record.serviceInterest,
          availableHours: 0,
          deliveryHours: 0,
          billableHours: 0,
          scopes: new Set<string>(),
        };
        row.availableHours += Number(record.availableHours);
        row.deliveryHours += Number(record.deliveryHours);
        row.billableHours += Number(record.billableHours);
        row.scopes.add(record.capacityScope);
        capacityByService.set(record.serviceInterest, row);
      }

      const invoiceById = new Map(allOpenInvoices.map((invoice) => [invoice.id, invoice]));
      const cohortLeadIds = new Set(cohortLeadRows.map((lead) => lead.id));
      const serviceByLead = new Map(cohortLeadRows.map((lead) => [lead.id, lead.serviceInterest || "unclassified"]));
      const channelByLead = new Map<string, string>();
      for (const touch of touchRows) channelByLead.set(touch.leadId, touch.channel);

      const latestAttestation = new Map<string, Date>();
      const latestCashEvent = new Map<string, Date>();
      for (const attestation of attestationRows) {
        const key = `${attestation.leadId}::${attestation.currency}`;
        const previous = latestAttestation.get(key);
        if (!previous || attestation.throughAt.getTime() > previous.getTime()) {
          latestAttestation.set(key, attestation.throughAt);
        }
      }

      type CashReturnRow = {
        key: string;
        channel: string;
        service: string;
        currency: string;
        cashCollected: number;
        directCost: number;
        acquisitionSpend: number;
        cashCollectingLeads: Set<string>;
        completeCostLeads: Set<string>;
      };
      const cashReturn = new Map<string, CashReturnRow>();
      const ensureCashRow = (channel: string, service: string, currency: string) => {
        const key = `${channel}::${service}::${currency}`;
        const row = cashReturn.get(key) ?? {
          key,
          channel,
          service,
          currency,
          cashCollected: 0,
          directCost: 0,
          acquisitionSpend: 0,
          cashCollectingLeads: new Set<string>(),
          completeCostLeads: new Set<string>(),
        };
        cashReturn.set(key, row);
        return row;
      };

      for (const collection of allInvoiceCollections) {
        const invoice = invoiceById.get(collection.invoiceId);
        if (!invoice || invoice.voidedAt || !cohortLeadIds.has(invoice.leadId)) continue;
        const channel = channelByLead.get(invoice.leadId) ?? "unattributed";
        const service = invoice.serviceInterest || serviceByLead.get(invoice.leadId) || "unclassified";
        const row = ensureCashRow(channel, service, invoice.currency);
        row.cashCollected += Number(collection.amount);
        row.cashCollectingLeads.add(invoice.leadId);
        const eventKey = `${invoice.leadId}::${invoice.currency}`;
        const previousCashAt = latestCashEvent.get(eventKey);
        if (!previousCashAt || collection.receivedAt.getTime() > previousCashAt.getTime()) {
          latestCashEvent.set(eventKey, collection.receivedAt);
        }
      }
      for (const cost of costRows) {
        if (!cohortLeadIds.has(cost.leadId)) continue;
        const channel = channelByLead.get(cost.leadId) ?? "unattributed";
        const service = cost.serviceInterest || serviceByLead.get(cost.leadId) || "unclassified";
        const row = ensureCashRow(channel, service, cost.currency);
        row.directCost += Number(cost.amount);
      }
      for (const spend of spendRows) {
        if (!spend.serviceInterest) continue;
        const row = ensureCashRow(spend.channel, spend.serviceInterest, spend.currency);
        row.acquisitionSpend += Number(spend.amount);
      }
      for (const row of cashReturn.values()) {
        for (const leadId of row.cashCollectingLeads) {
          const key = `${leadId}::${row.currency}`;
          const attestedThrough = latestAttestation.get(key);
          const latestCashAt = latestCashEvent.get(key);
          if (attestedThrough && latestCashAt && attestedThrough.getTime() >= latestCashAt.getTime()) {
            row.completeCostLeads.add(leadId);
          }
        }
      }

      const retentionByServiceCurrency = new Map(
        [...retention.values()].map((row) => [`${row.service}::${row.currency}`, row]),
      );
      const realizedCapital = [...cashReturn.values()].map((row) => {
        const costCoveragePct = row.cashCollectingLeads.size
          ? round((row.completeCostLeads.size / row.cashCollectingLeads.size) * 100)
          : row.directCost > 0 ? 0 : 100;
        const completeCosts = row.cashCollectingLeads.size === row.completeCostLeads.size;
        const cashGrossContribution = completeCosts ? row.cashCollected - row.directCost : null;
        const netCapitalReturn = cashGrossContribution !== null
          ? cashGrossContribution - row.acquisitionSpend
          : null;
        const cashReturnMultiple = cashGrossContribution !== null && row.acquisitionSpend > 0
          ? round(cashGrossContribution / row.acquisitionSpend, 2)
          : null;
        const capitalRoiPct = netCapitalReturn !== null && row.acquisitionSpend > 0
          ? round((netCapitalReturn / row.acquisitionSpend) * 100)
          : null;
        const retentionRow = retentionByServiceCurrency.get(`${row.service}::${row.currency}`);
        const retentionComplete = !retentionRow || retentionRow.unreconciledEndedAgreements === 0;
        const grr = retentionRow && retentionRow.beginningMrr > 0 && retentionComplete
          ? round(Math.max(0, retentionRow.beginningMrr - retentionRow.contractionMrr - retentionRow.churnMrr) /
              retentionRow.beginningMrr * 100)
          : null;
        const nrr = retentionRow && retentionRow.beginningMrr > 0 && retentionComplete
          ? round(Math.max(0, retentionRow.beginningMrr - retentionRow.contractionMrr - retentionRow.churnMrr +
              retentionRow.expansionMrr + retentionRow.reactivationMrr) /
              retentionRow.beginningMrr * 100)
          : null;

        let reinvestmentSignal: "increase_candidate" | "hold_candidate" | "reduce_candidate" | "insufficient_data" =
          "insufficient_data";
        const reasons: string[] = [];
        const recurringRetentionRelevant = Boolean(
          retentionRow && (retentionRow.beginningMrr > 0 || retentionRow.newMrr > 0),
        );
        if (!completeCosts) {
          reasons.push("Cash return is withheld until direct-cost evidence is complete through the latest cash event.");
        } else if (row.acquisitionSpend <= 0) {
          reasons.push("No service-tagged acquisition spend exists in the selected acquisition-cohort window.");
        } else if (recurringRetentionRelevant && (!retentionComplete || nrr === null)) {
          reasons.push("Recurring reinvestment is withheld until retention evidence supports a measurable NRR.");
        } else if (row.cashCollected <= 0) {
          reinvestmentSignal = "reduce_candidate";
          reasons.push("Acquisition spend has not produced realized cash for the acquisition cohort.");
        } else if (
          cashReturnMultiple !== null &&
          cashReturnMultiple >= 1.5 &&
          (!recurringRetentionRelevant || (nrr !== null && nrr >= 100))
        ) {
          reinvestmentSignal = "increase_candidate";
          reasons.push("Realized cash gross contribution exceeds 1.5× acquisition spend and recurring retention is stable or expanding.");
        } else if (
          cashReturnMultiple !== null &&
          cashReturnMultiple >= 1 &&
          (!recurringRetentionRelevant || (nrr !== null && nrr >= 90))
        ) {
          reinvestmentSignal = "hold_candidate";
          reasons.push("Realized cash gross contribution covers acquisition spend but does not clear the increase threshold.");
        } else if (cashReturnMultiple !== null) {
          reinvestmentSignal = "reduce_candidate";
          reasons.push("Realized cash return or recurring retention is below the reinvestment threshold.");
        }

        return {
          ...row,
          cashCollectingLeads: row.cashCollectingLeads.size,
          completeCostLeads: row.completeCostLeads.size,
          costCoveragePct,
          cashGrossContribution,
          netCapitalReturn,
          cashReturnMultiple,
          capitalRoiPct,
          grr,
          nrr,
          retentionEvidenceComplete: retentionComplete,
          reinvestmentSignal,
          reasons,
        };
      });

      const budgetPerformance = budgets.map((budget) => {
        const budgetAllocations = allocations.filter((allocation) => allocation.budgetId === budget.id);
        return {
          ...budget,
          allocations: budgetAllocations.map((allocation) => {
            const actualSpend = allSpendRows
              .filter((spend) =>
                spend.currency === budget.currency &&
                spend.channel === allocation.channel &&
                spend.serviceInterest === allocation.serviceInterest &&
                spend.occurredAt.getTime() >= budget.periodStart.getTime() &&
                spend.occurredAt.getTime() <= budget.periodEnd.getTime())
              .reduce((sum, spend) => sum + Number(spend.amount), 0);
            const approved = Number(allocation.approvedAmount);
            return {
              ...allocation,
              actualSpend,
              remainingApproved: Math.max(0, approved - actualSpend),
              approvedUtilizationPct: approved > 0 ? round((actualSpend / approved) * 100) : null,
              recommendedVariance: actualSpend - Number(allocation.recommendedAmount),
              approvedVariance: actualSpend - approved,
            };
          }),
        };
      });

      response.setHeader("Cache-Control", "no-store");
      response.json({
        window: windowValue,
        basis: {
          cashRealization: "invoice_cohort",
          capitalReturn: "lead_acquisition_cohort",
          retention: "trailing_period",
          deliveryUtilization: "activity_window",
        },
        retentionPeriodStart: retentionStart.toISOString(),
        asOf: now.toISOString(),
        cashRealization: {
          invoiceCohortByCurrency: [...invoiceCurrencies.values()].map((row) => ({
            currency: row.currency,
            invoiced: row.invoiced,
            collected: row.collected,
            outstanding: row.outstanding,
            realizationRatePct: row.invoiced > 0 ? round((row.collected / row.invoiced) * 100) : null,
            averagePaidInvoiceDays: row.paidInvoiceDays.length
              ? round(row.paidInvoiceDays.reduce((sum, value) => sum + value, 0) / row.paidInvoiceDays.length)
              : null,
            weightedAverageCollectionDays: row.weightedCollectionAmount > 0
              ? round(row.weightedCollectionDayNumerator / row.weightedCollectionAmount)
              : null,
          })),
          currentReceivablesAging: ["not_due", "1-30", "31-60", "61-90", "90+"].map((key) => ({
            key,
            count: receivableCounts.get(key) ?? 0,
            valueByCurrency: [...(receivableBuckets.get(key) ?? new Map<string, number>()).entries()]
              .map(([currency, value]) => ({ currency, value })),
          })),
        },
        retention: [...retention.values()].map((row) => {
          const complete = row.unreconciledEndedAgreements === 0;
          return {
            ...row,
            evidenceComplete: complete,
            grrPct: row.beginningMrr > 0 && complete
              ? round(Math.max(0, row.beginningMrr - row.contractionMrr - row.churnMrr) / row.beginningMrr * 100)
              : null,
            nrrPct: row.beginningMrr > 0 && complete
              ? round(Math.max(0, row.beginningMrr - row.contractionMrr - row.churnMrr +
                  row.expansionMrr + row.reactivationMrr) / row.beginningMrr * 100)
              : null,
            logoChurnPct: row.beginningLogos > 0 && complete
              ? round((row.churnedLogos / row.beginningLogos) * 100)
              : null,
          };
        }),
        deliveryUtilization: [...capacityByService.values()].map((row) => ({
          service: row.service,
          availableHours: row.availableHours,
          deliveryHours: row.deliveryHours,
          billableHours: row.billableHours,
          utilizationPct: row.availableHours > 0 ? round((row.deliveryHours / row.availableHours) * 100) : null,
          billableUtilizationPct: row.availableHours > 0 ? round((row.billableHours / row.availableHours) * 100) : null,
          scopeCount: row.scopes.size,
        })),
        realizedCapitalReturn: realizedCapital.sort((a, b) =>
          String(a.channel).localeCompare(String(b.channel)) || String(a.service).localeCompare(String(b.service))),
        budgetPerformance,
        controls: {
          reinvestmentSignalIsAdvisory: true,
          budgetApprovalRequired: true,
          reinvestmentPolicy: {
            version: "cash-reinvestment-v1",
            increaseMinimumCashReturnMultiple: 1.5,
            recurringIncreaseMinimumNrrPct: 100,
            holdMinimumCashReturnMultiple: 1,
            recurringHoldMinimumNrrPct: 90,
            recurringRetentionEvidenceRequired: true,
          },
          note: "Increase/hold/reduce signals use realized cash and retention evidence. They do not authorize spending; only an approved capital budget does.",
        },
      });
    },
  );

  return router;
}
