import {
  and,
  desc,
  eq,
  gt,
  inArray,
  isNull,
  lte,
  or,
} from "drizzle-orm";
import { Router } from "express";
import { z } from "zod";
import {
  acquisitionSpendEntries,
  auditEvents,
  directCostEntries,
  leadActivities,
  leadAttributionTouches,
  leads,
  recurringRevenueAgreements,
  revenueEvents,
} from "../../shared/schema.js";
import { requireAdminPermission } from "../custom-auth.js";
import { db } from "../db.js";

const DAY_MS = 86_400_000;
const supportedWindows = ["30d", "90d", "365d", "all"] as const;
type WindowValue = typeof supportedWindows[number];

const agreementInputSchema = z.object({
  leadId: z.string().uuid(),
  serviceInterest: z.string().trim().min(1).max(180),
  currency: z.string().trim().length(3).transform((value) => value.toUpperCase()),
  monthlyRecurringRevenue: z.union([
    z.number().positive(),
    z.string().regex(/^\d+(?:\.\d{1,2})?$/).transform(Number).refine((value) => value > 0),
  ]),
  startedAt: z.string().datetime(),
  sourceReference: z.string().trim().min(3).max(2000),
  notes: z.string().trim().max(4000).nullable().optional(),
}).strict();

const revenueInputSchema = z.object({
  leadId: z.string().uuid(),
  serviceInterest: z.string().trim().min(1).max(180),
  revenueKind: z.enum(["one_time", "recurring"]),
  currency: z.string().trim().length(3).transform((value) => value.toUpperCase()),
  amount: z.union([
    z.number().positive(),
    z.string().regex(/^\d+(?:\.\d{1,2})?$/).transform(Number).refine((value) => value > 0),
  ]),
  occurredAt: z.string().datetime(),
  periodStart: z.string().datetime().nullable().optional(),
  periodEnd: z.string().datetime().nullable().optional(),
  sourceReference: z.string().trim().min(3).max(2000),
  notes: z.string().trim().max(4000).nullable().optional(),
}).strict().superRefine((value, context) => {
  if (new Date(value.occurredAt).getTime() > Date.now() + 10 * 60 * 1000) {
    context.addIssue({ code: "custom", path: ["occurredAt"], message: "Revenue timestamp cannot be in the future" });
  }
  if (value.revenueKind === "recurring" && (!value.periodStart || !value.periodEnd)) {
    context.addIssue({
      code: "custom",
      path: ["periodStart"],
      message: "Recurring revenue requires a service period start and end",
    });
  }
  if (value.periodStart && value.periodEnd &&
      new Date(value.periodEnd).getTime() < new Date(value.periodStart).getTime()) {
    context.addIssue({ code: "custom", path: ["periodEnd"], message: "Revenue period end must not precede its start" });
  }
});

const costInputSchema = z.object({
  leadId: z.string().uuid(),
  serviceInterest: z.string().trim().min(1).max(180),
  category: z.enum(["delivery_labour", "infrastructure", "subcontractor", "transaction", "support", "other"]),
  currency: z.string().trim().length(3).transform((value) => value.toUpperCase()),
  amount: z.union([
    z.number().nonnegative(),
    z.string().regex(/^\d+(?:\.\d{1,2})?$/).transform(Number),
  ]),
  occurredAt: z.string().datetime(),
  sourceReference: z.string().trim().min(3).max(2000),
  notes: z.string().trim().max(4000).nullable().optional(),
}).strict().superRefine((value, context) => {
  if (new Date(value.occurredAt).getTime() > Date.now() + 10 * 60 * 1000) {
    context.addIssue({ code: "custom", path: ["occurredAt"], message: "Cost timestamp cannot be in the future" });
  }
});

const voidSchema = z.object({
  reason: z.string().trim().min(5).max(1000),
}).strict();

const endAgreementSchema = z.object({
  status: z.enum(["ended", "cancelled"]),
  endedAt: z.string().datetime(),
  reason: z.string().trim().min(5).max(1000),
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

function average(values: number[]) {
  return values.length
    ? round(values.reduce((sum, value) => sum + value, 0) / values.length)
    : null;
}

function monthKey(value: Date) {
  return `${value.getUTCFullYear()}-${String(value.getUTCMonth() + 1).padStart(2, "0")}`;
}

async function validateWonLead(leadId: string, serviceInterest: string) {
  const [lead] = await db
    .select({
      id: leads.id,
      stage: leads.stage,
      serviceInterest: leads.serviceInterest,
      currency: leads.currency,
    })
    .from(leads)
    .where(and(eq(leads.id, leadId), isNull(leads.archivedAt)))
    .limit(1);
  if (!lead) return { outcome: "missing" as const };
  if (lead.stage !== "won") return { outcome: "not_won" as const };
  if (lead.serviceInterest && lead.serviceInterest !== serviceInterest) {
    return { outcome: "service_mismatch" as const, expected: lead.serviceInterest };
  }
  return { outcome: "ok" as const, lead };
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

export function createRevenueIntelligenceRouter() {
  const router = Router();

  router.get(
    "/api/admin/revenue/agreements",
    requireAdminPermission("pipeline.financial.read"),
    async (_request, response) => {
      const rows = await db
        .select()
        .from(recurringRevenueAgreements)
        .orderBy(desc(recurringRevenueAgreements.startedAt))
        .limit(1000);
      response.setHeader("Cache-Control", "no-store");
      response.json(rows);
    },
  );

  router.post(
    "/api/admin/revenue/agreements",
    requireAdminPermission("revenue.economics.manage"),
    async (request, response) => {
      const parsed = agreementInputSchema.safeParse(request.body);
      if (!parsed.success) return response.status(400).json({
        message: "Invalid recurring revenue agreement",
        errors: parsed.error.issues,
      });
      const input = parsed.data;
      const validation = await validateWonLead(input.leadId, input.serviceInterest);
      if (validation.outcome === "missing") return response.status(404).json({ message: "Lead not found" });
      if (validation.outcome === "not_won") return response.status(409).json({ message: "Recurring revenue can only be attached to a won opportunity" });
      if (validation.outcome === "service_mismatch") return response.status(409).json({
        message: `Service must match the won opportunity: ${validation.expected}`,
      });
      const startedAt = new Date(input.startedAt);
      if (startedAt.getTime() > Date.now() + 10 * 60 * 1000) {
        return response.status(400).json({ message: "Agreement start cannot be in the future" });
      }
      const [record] = await db
        .insert(recurringRevenueAgreements)
        .values({
          leadId: input.leadId,
          serviceInterest: input.serviceInterest,
          currency: input.currency,
          monthlyRecurringRevenue: String(input.monthlyRecurringRevenue),
          startedAt,
          sourceReference: input.sourceReference,
          notes: input.notes || null,
          createdBy: request.securityPrincipal?.userId ?? null,
        })
        .returning();
      await audit(request, "revenue.agreement.create", "recurring_revenue_agreement", record.id, null, record);
      response.status(201).json(record);
    },
  );

  router.post(
    "/api/admin/revenue/agreements/:id/end",
    requireAdminPermission("revenue.economics.manage"),
    async (request, response) => {
      const parsed = endAgreementSchema.safeParse(request.body);
      if (!parsed.success) return response.status(400).json({
        message: "Invalid agreement close request",
        errors: parsed.error.issues,
      });
      const input = parsed.data;
      const result = await db.transaction(async (transaction) => {
        const [previous] = await transaction
          .select()
          .from(recurringRevenueAgreements)
          .where(eq(recurringRevenueAgreements.id, request.params.id))
          .limit(1);
        if (!previous) return { outcome: "missing" as const };
        if (previous.voidedAt) return { outcome: "voided" as const };
        if (previous.status !== "active") return { outcome: "closed" as const, record: previous };
        const endedAt = new Date(input.endedAt);
        if (endedAt.getTime() < previous.startedAt.getTime()) return { outcome: "invalid_end" as const };
        const [record] = await transaction
          .update(recurringRevenueAgreements)
          .set({ status: input.status, endedAt })
          .where(eq(recurringRevenueAgreements.id, previous.id))
          .returning();
        await transaction.insert(auditEvents).values({
          actorUserId: request.securityPrincipal?.userId ?? null,
          actorSessionId: request.securityPrincipal?.sessionId ?? null,
          action: "revenue.agreement.end",
          resourceType: "recurring_revenue_agreement",
          resourceId: previous.id,
          result: "success",
          requestId: request.requestId,
          previousState: previous,
          newState: record,
          justification: input.reason,
        });
        return { outcome: "ok" as const, record };
      });
      if (result.outcome === "missing") return response.status(404).json({ message: "Agreement not found" });
      if (result.outcome === "voided") return response.status(409).json({ message: "Voided agreement cannot be closed" });
      if (result.outcome === "closed") return response.status(409).json({ message: "Agreement is already closed" });
      if (result.outcome === "invalid_end") return response.status(400).json({ message: "Agreement end cannot precede its start" });
      response.json(result.record);
    },
  );

  router.post(
    "/api/admin/revenue/agreements/:id/void",
    requireAdminPermission("revenue.economics.manage"),
    async (request, response) => {
      const parsed = voidSchema.safeParse(request.body);
      if (!parsed.success) return response.status(400).json({ message: "Invalid void request", errors: parsed.error.issues });
      const result = await db.transaction(async (transaction) => {
        const [previous] = await transaction
          .select()
          .from(recurringRevenueAgreements)
          .where(eq(recurringRevenueAgreements.id, request.params.id))
          .limit(1);
        if (!previous) return { outcome: "missing" as const };
        if (previous.voidedAt) return { outcome: "voided" as const };
        const [record] = await transaction
          .update(recurringRevenueAgreements)
          .set({
            voidedAt: new Date(),
            voidedBy: request.securityPrincipal?.userId ?? null,
            voidReason: parsed.data.reason,
          })
          .where(eq(recurringRevenueAgreements.id, previous.id))
          .returning();
        await transaction.insert(auditEvents).values({
          actorUserId: request.securityPrincipal?.userId ?? null,
          actorSessionId: request.securityPrincipal?.sessionId ?? null,
          action: "revenue.agreement.void",
          resourceType: "recurring_revenue_agreement",
          resourceId: previous.id,
          result: "success",
          requestId: request.requestId,
          previousState: previous,
          newState: record,
          justification: parsed.data.reason,
        });
        return { outcome: "ok" as const, record };
      });
      if (result.outcome === "missing") return response.status(404).json({ message: "Agreement not found" });
      if (result.outcome === "voided") return response.status(409).json({ message: "Agreement is already voided" });
      response.json(result.record);
    },
  );

  router.get(
    "/api/admin/revenue/events",
    requireAdminPermission("pipeline.financial.read"),
    async (_request, response) => {
      const rows = await db.select().from(revenueEvents).orderBy(desc(revenueEvents.occurredAt)).limit(1500);
      response.setHeader("Cache-Control", "no-store");
      response.json(rows);
    },
  );

  router.post(
    "/api/admin/revenue/events",
    requireAdminPermission("revenue.economics.manage"),
    async (request, response) => {
      const parsed = revenueInputSchema.safeParse(request.body);
      if (!parsed.success) return response.status(400).json({
        message: "Invalid revenue evidence",
        errors: parsed.error.issues,
      });
      const input = parsed.data;
      const validation = await validateWonLead(input.leadId, input.serviceInterest);
      if (validation.outcome === "missing") return response.status(404).json({ message: "Lead not found" });
      if (validation.outcome === "not_won") return response.status(409).json({ message: "Revenue can only be recognized against a won opportunity" });
      if (validation.outcome === "service_mismatch") return response.status(409).json({
        message: `Service must match the won opportunity: ${validation.expected}`,
      });
      const [record] = await db.insert(revenueEvents).values({
        leadId: input.leadId,
        serviceInterest: input.serviceInterest,
        revenueKind: input.revenueKind,
        currency: input.currency,
        amount: String(input.amount),
        occurredAt: new Date(input.occurredAt),
        periodStart: input.periodStart ? new Date(input.periodStart) : null,
        periodEnd: input.periodEnd ? new Date(input.periodEnd) : null,
        sourceReference: input.sourceReference,
        notes: input.notes || null,
        createdBy: request.securityPrincipal?.userId ?? null,
      }).returning();
      await audit(request, "revenue.event.create", "revenue_event", record.id, null, record);
      response.status(201).json(record);
    },
  );

  router.post(
    "/api/admin/revenue/events/:id/void",
    requireAdminPermission("revenue.economics.manage"),
    async (request, response) => {
      const parsed = voidSchema.safeParse(request.body);
      if (!parsed.success) return response.status(400).json({ message: "Invalid void request", errors: parsed.error.issues });
      const result = await db.transaction(async (transaction) => {
        const [previous] = await transaction.select().from(revenueEvents)
          .where(eq(revenueEvents.id, request.params.id)).limit(1);
        if (!previous) return { outcome: "missing" as const };
        if (previous.voidedAt) return { outcome: "voided" as const };
        const [record] = await transaction.update(revenueEvents).set({
          voidedAt: new Date(),
          voidedBy: request.securityPrincipal?.userId ?? null,
          voidReason: parsed.data.reason,
        }).where(eq(revenueEvents.id, previous.id)).returning();
        await transaction.insert(auditEvents).values({
          actorUserId: request.securityPrincipal?.userId ?? null,
          actorSessionId: request.securityPrincipal?.sessionId ?? null,
          action: "revenue.event.void",
          resourceType: "revenue_event",
          resourceId: previous.id,
          result: "success",
          requestId: request.requestId,
          previousState: previous,
          newState: record,
          justification: parsed.data.reason,
        });
        return { outcome: "ok" as const, record };
      });
      if (result.outcome === "missing") return response.status(404).json({ message: "Revenue event not found" });
      if (result.outcome === "voided") return response.status(409).json({ message: "Revenue event is already voided" });
      response.json(result.record);
    },
  );

  router.get(
    "/api/admin/revenue/costs",
    requireAdminPermission("pipeline.financial.read"),
    async (_request, response) => {
      const rows = await db.select().from(directCostEntries).orderBy(desc(directCostEntries.occurredAt)).limit(1500);
      response.setHeader("Cache-Control", "no-store");
      response.json(rows);
    },
  );

  router.post(
    "/api/admin/revenue/costs",
    requireAdminPermission("revenue.economics.manage"),
    async (request, response) => {
      const parsed = costInputSchema.safeParse(request.body);
      if (!parsed.success) return response.status(400).json({
        message: "Invalid direct-cost evidence",
        errors: parsed.error.issues,
      });
      const input = parsed.data;
      const validation = await validateWonLead(input.leadId, input.serviceInterest);
      if (validation.outcome === "missing") return response.status(404).json({ message: "Lead not found" });
      if (validation.outcome === "not_won") return response.status(409).json({ message: "Direct costs can only be attached to a won opportunity" });
      if (validation.outcome === "service_mismatch") return response.status(409).json({
        message: `Service must match the won opportunity: ${validation.expected}`,
      });
      const [record] = await db.insert(directCostEntries).values({
        leadId: input.leadId,
        serviceInterest: input.serviceInterest,
        category: input.category,
        currency: input.currency,
        amount: String(input.amount),
        occurredAt: new Date(input.occurredAt),
        sourceReference: input.sourceReference,
        notes: input.notes || null,
        createdBy: request.securityPrincipal?.userId ?? null,
      }).returning();
      await audit(request, "revenue.cost.create", "direct_cost_entry", record.id, null, record);
      response.status(201).json(record);
    },
  );

  router.post(
    "/api/admin/revenue/costs/:id/void",
    requireAdminPermission("revenue.economics.manage"),
    async (request, response) => {
      const parsed = voidSchema.safeParse(request.body);
      if (!parsed.success) return response.status(400).json({ message: "Invalid void request", errors: parsed.error.issues });
      const result = await db.transaction(async (transaction) => {
        const [previous] = await transaction.select().from(directCostEntries)
          .where(eq(directCostEntries.id, request.params.id)).limit(1);
        if (!previous) return { outcome: "missing" as const };
        if (previous.voidedAt) return { outcome: "voided" as const };
        const [record] = await transaction.update(directCostEntries).set({
          voidedAt: new Date(),
          voidedBy: request.securityPrincipal?.userId ?? null,
          voidReason: parsed.data.reason,
        }).where(eq(directCostEntries.id, previous.id)).returning();
        await transaction.insert(auditEvents).values({
          actorUserId: request.securityPrincipal?.userId ?? null,
          actorSessionId: request.securityPrincipal?.sessionId ?? null,
          action: "revenue.cost.void",
          resourceType: "direct_cost_entry",
          resourceId: previous.id,
          result: "success",
          requestId: request.requestId,
          previousState: previous,
          newState: record,
          justification: parsed.data.reason,
        });
        return { outcome: "ok" as const, record };
      });
      if (result.outcome === "missing") return response.status(404).json({ message: "Direct-cost entry not found" });
      if (result.outcome === "voided") return response.status(409).json({ message: "Direct-cost entry is already voided" });
      response.json(result.record);
    },
  );

  router.get(
    "/api/admin/revenue/intelligence",
    requireAdminPermission("pipeline.financial.read"),
    async (request, response) => {
      const requested =
        typeof request.query.window === "string" ? request.query.window : "90d";
      const windowValue = (supportedWindows as readonly string[]).includes(requested)
        ? requested as WindowValue
        : "90d";
      const since = windowStart(windowValue);
      const now = new Date();

      const leadRows = await db.select({
        id: leads.id,
        serviceInterest: leads.serviceInterest,
        stage: leads.stage,
        currency: leads.currency,
        estimatedValue: leads.estimatedValue,
        createdAt: leads.createdAt,
        updatedAt: leads.updatedAt,
      }).from(leads).where(and(
        isNull(leads.archivedAt),
        ...(since ? [gt(leads.createdAt, since)] : []),
      )).orderBy(desc(leads.createdAt)).limit(5000);

      const leadIds = leadRows.map((lead) => lead.id);
      const [touchRows, stageRows, revenueRows, costRows, agreementRows, spendRows] = await Promise.all([
        leadIds.length
          ? db.select().from(leadAttributionTouches)
            .where(inArray(leadAttributionTouches.leadId, leadIds))
            .orderBy(leadAttributionTouches.capturedAt)
          : Promise.resolve([]),
        leadIds.length
          ? db.select({
              leadId: leadActivities.leadId,
              metadata: leadActivities.metadata,
              createdAt: leadActivities.createdAt,
            }).from(leadActivities).where(and(
              inArray(leadActivities.leadId, leadIds),
              eq(leadActivities.type, "stage_changed"),
            )).orderBy(leadActivities.createdAt)
          : Promise.resolve([]),
        leadIds.length
          ? db.select().from(revenueEvents).where(and(
              inArray(revenueEvents.leadId, leadIds),
              isNull(revenueEvents.voidedAt),
            )).orderBy(revenueEvents.occurredAt)
          : Promise.resolve([]),
        leadIds.length
          ? db.select().from(directCostEntries).where(and(
              inArray(directCostEntries.leadId, leadIds),
              isNull(directCostEntries.voidedAt),
            )).orderBy(directCostEntries.occurredAt)
          : Promise.resolve([]),
        leadIds.length
          ? db.select().from(recurringRevenueAgreements).where(and(
              inArray(recurringRevenueAgreements.leadId, leadIds),
              isNull(recurringRevenueAgreements.voidedAt),
            )).orderBy(recurringRevenueAgreements.startedAt)
          : Promise.resolve([]),
        db.select().from(acquisitionSpendEntries).where(and(
          isNull(acquisitionSpendEntries.voidedAt),
          ...(since ? [gt(acquisitionSpendEntries.occurredAt, since)] : []),
        )).orderBy(acquisitionSpendEntries.occurredAt).limit(5000),
      ]);

      const lastTouch = new Map<string, (typeof touchRows)[number]>();
      for (const touch of touchRows) if (touch.touchType === "last") lastTouch.set(touch.leadId, touch);

      type StageMilestones = {
        proposal?: Date;
        won?: Date;
        lost?: Date;
        lastStageAt?: Date;
      };
      const milestones = new Map<string, StageMilestones>();
      for (const event of stageRows) {
        const metadata = event.metadata && typeof event.metadata === "object"
          ? event.metadata as Record<string, unknown>
          : {};
        const stage = typeof metadata.stage === "string" ? metadata.stage : "";
        const current = milestones.get(event.leadId) ?? {};
        if (!current.proposal && ["proposal", "negotiation", "won"].includes(stage)) current.proposal = event.createdAt;
        if (!current.won && stage === "won") current.won = event.createdAt;
        if (!current.lost && stage === "lost") current.lost = event.createdAt;
        current.lastStageAt = event.createdAt;
        milestones.set(event.leadId, current);
      }

      const revenueByLeadCurrency = new Map<string, Map<string, number>>();
      const recurringRevenueByLeadCurrency = new Map<string, Map<string, number>>();
      const costByLeadCurrency = new Map<string, Map<string, number>>();
      const leadsWithRevenue = new Set<string>();
      const leadsWithCostEvidence = new Set<string>();
      const activeMrrByLeadCurrency = new Map<string, Map<string, number>>();

      const addCurrency = (
        target: Map<string, Map<string, number>>,
        leadId: string,
        currency: string,
        amount: number,
      ) => {
        const values = target.get(leadId) ?? new Map<string, number>();
        values.set(currency, (values.get(currency) ?? 0) + amount);
        target.set(leadId, values);
      };

      for (const event of revenueRows) {
        const amount = Number(event.amount);
        if (!Number.isFinite(amount) || amount <= 0) continue;
        addCurrency(revenueByLeadCurrency, event.leadId, event.currency, amount);
        if (event.revenueKind === "recurring") {
          addCurrency(recurringRevenueByLeadCurrency, event.leadId, event.currency, amount);
        }
        leadsWithRevenue.add(event.leadId);
      }
      for (const cost of costRows) {
        const amount = Number(cost.amount);
        if (!Number.isFinite(amount) || amount < 0) continue;
        addCurrency(costByLeadCurrency, cost.leadId, cost.currency, amount);
        leadsWithCostEvidence.add(cost.leadId);
      }
      for (const agreement of agreementRows) {
        if (agreement.status !== "active") continue;
        if (agreement.startedAt.getTime() > now.getTime()) continue;
        if (agreement.endedAt && agreement.endedAt.getTime() <= now.getTime()) continue;
        const amount = Number(agreement.monthlyRecurringRevenue);
        if (!Number.isFinite(amount) || amount <= 0) continue;
        addCurrency(activeMrrByLeadCurrency, agreement.leadId, agreement.currency, amount);
      }

      type Group = {
        key: string;
        channel: string;
        service: string;
        leads: typeof leadRows;
      };
      const groups = new Map<string, Group>();
      for (const lead of leadRows) {
        const channel = lastTouch.get(lead.id)?.channel ?? "unattributed";
        const service = lead.serviceInterest || "unclassified";
        const key = `${channel}::${service}`;
        const group = groups.get(key) ?? { key, channel, service, leads: [] };
        group.leads.push(lead);
        groups.set(key, group);
      }

      const spendByGroupCurrency = new Map<string, Map<string, number>>();
      let unallocatedSpendRecords = 0;
      for (const spend of spendRows) {
        const amount = Number(spend.amount);
        if (!Number.isFinite(amount) || amount <= 0) continue;
        if (!spend.serviceInterest) {
          unallocatedSpendRecords += 1;
          continue;
        }
        const key = `${spend.channel}::${spend.serviceInterest}`;
        const currencies = spendByGroupCurrency.get(key) ?? new Map<string, number>();
        currencies.set(spend.currency, (currencies.get(spend.currency) ?? 0) + amount);
        spendByGroupCurrency.set(key, currencies);
      }

      const proposalToWonDays: number[] = [];
      const proposalToLostDays: number[] = [];
      const openProposalAgeDays: number[] = [];
      const agingBuckets = new Map<string, { key: string; count: number; valueByCurrency: Map<string, number> }>();
      const stageThresholdDays: Record<string, number> = {
        new: 7,
        reviewing: 7,
        qualified: 14,
        discovery: 14,
        proposal: 21,
        negotiation: 21,
      };
      const staleLeads: Array<{
        id: string;
        stage: string;
        service: string;
        ageDays: number;
        estimatedValue: number | null;
        currency: string;
      }> = [];

      const agingBucket = (days: number) =>
        days <= 7 ? "0-7" : days <= 14 ? "8-14" : days <= 30 ? "15-30" :
          days <= 60 ? "31-60" : days <= 90 ? "61-90" : "90+";

      for (const lead of leadRows) {
        const milestone = milestones.get(lead.id);
        if (milestone?.proposal && milestone.won) {
          proposalToWonDays.push((milestone.won.getTime() - milestone.proposal.getTime()) / DAY_MS);
        }
        if (milestone?.proposal && milestone.lost) {
          proposalToLostDays.push((milestone.lost.getTime() - milestone.proposal.getTime()) / DAY_MS);
        }
        if (["proposal", "negotiation"].includes(lead.stage)) {
          const proposalAt = milestone?.proposal ?? lead.createdAt;
          openProposalAgeDays.push((now.getTime() - proposalAt.getTime()) / DAY_MS);
        }

        if (!["won", "lost"].includes(lead.stage)) {
          const stageAt = milestone?.lastStageAt ?? lead.createdAt;
          const ageDays = Math.max(0, (now.getTime() - stageAt.getTime()) / DAY_MS);
          const bucket = agingBucket(ageDays);
          const row = agingBuckets.get(bucket) ?? { key: bucket, count: 0, valueByCurrency: new Map<string, number>() };
          row.count += 1;
          const estimatedValue = lead.estimatedValue ? Number(lead.estimatedValue) : 0;
          if (Number.isFinite(estimatedValue) && estimatedValue > 0) {
            row.valueByCurrency.set(lead.currency, (row.valueByCurrency.get(lead.currency) ?? 0) + estimatedValue);
          }
          agingBuckets.set(bucket, row);
          const threshold = stageThresholdDays[lead.stage];
          if (threshold && ageDays > threshold) {
            staleLeads.push({
              id: lead.id,
              stage: lead.stage,
              service: lead.serviceInterest || "unclassified",
              ageDays: round(ageDays),
              estimatedValue: estimatedValue > 0 ? estimatedValue : null,
              currency: lead.currency,
            });
          }
        }
      }

      const policy = {
        version: "capital-allocation-v1",
        minimumEnquiries: 5,
        minimumProposals: 3,
        minimumWinsForEconomics: 2,
        minimumRevenueCoveragePct: 80,
        minimumCostCoveragePct: 80,
        scaleProposalWinRatePct: 30,
        scaleGrossMarginPct: 35,
        scaleGrossProfitRoas: 2,
        scaleMaximumPaybackDays: 180,
        cutGrossMarginPct: 20,
        cutGrossProfitRoas: 1,
        cutMaximumPaybackDays: 365,
      };

      const recommendations: Array<Record<string, unknown>> = [];
      for (const group of groups.values()) {
        const enquiries = group.leads.length;
        const proposals = group.leads.filter((lead) => {
          const m = milestones.get(lead.id);
          return Boolean(m?.proposal) || ["proposal", "negotiation", "won"].includes(lead.stage);
        }).length;
        const wonLeads = group.leads.filter((lead) => lead.stage === "won");
        const wins = wonLeads.length;
        const proposalWinRate = proposals ? round((wins / proposals) * 100) : 0;
        const stalled = group.leads.filter((lead) => staleLeads.some((item) => item.id === lead.id)).length;
        const stalledShare = enquiries ? round((stalled / enquiries) * 100) : 0;
        const winsWithRevenue = wonLeads.filter((lead) => leadsWithRevenue.has(lead.id)).length;
        const winsWithCost = wonLeads.filter((lead) =>
          leadsWithRevenue.has(lead.id) && leadsWithCostEvidence.has(lead.id)).length;
        const revenueCoveragePct = wins ? round((winsWithRevenue / wins) * 100) : 0;
        const costCoveragePct = winsWithRevenue ? round((winsWithCost / winsWithRevenue) * 100) : 0;
        const spendCurrencies = spendByGroupCurrency.get(group.key) ?? new Map<string, number>();
        const currencies = new Set<string>([
          ...spendCurrencies.keys(),
          ...wonLeads.flatMap((lead) => [
            ...(revenueByLeadCurrency.get(lead.id)?.keys() ?? []),
            ...(costByLeadCurrency.get(lead.id)?.keys() ?? []),
            ...(activeMrrByLeadCurrency.get(lead.id)?.keys() ?? []),
          ]),
        ]);

        if (!currencies.size) currencies.add(wonLeads[0]?.currency || "MWK");

        for (const currency of currencies) {
          const spend = spendCurrencies.get(currency) ?? 0;
          const recognizedRevenue = wonLeads.reduce(
            (sum, lead) => sum + (revenueByLeadCurrency.get(lead.id)?.get(currency) ?? 0),
            0,
          );
          const directCost = wonLeads.reduce(
            (sum, lead) => sum + (costByLeadCurrency.get(lead.id)?.get(currency) ?? 0),
            0,
          );
          const mrr = wonLeads.reduce(
            (sum, lead) => sum + (activeMrrByLeadCurrency.get(lead.id)?.get(currency) ?? 0),
            0,
          );
          const completeCosts = winsWithRevenue > 0 && winsWithCost === winsWithRevenue;
          const grossProfit = completeCosts ? recognizedRevenue - directCost : null;
          const grossMarginPct = completeCosts && recognizedRevenue > 0
            ? round(((recognizedRevenue - directCost) / recognizedRevenue) * 100)
            : null;
          const grossProfitRoas = grossProfit !== null && spend > 0
            ? round(grossProfit / spend, 2)
            : null;
          const monthlyGrossProfit = grossMarginPct !== null && mrr > 0
            ? mrr * (grossMarginPct / 100)
            : null;
          const paybackDays = monthlyGrossProfit && monthlyGrossProfit > 0 && spend > 0
            ? round((spend / monthlyGrossProfit) * 30.44)
            : null;
          const revenueCustomers = wonLeads.filter((lead) =>
            (revenueByLeadCurrency.get(lead.id)?.get(currency) ?? 0) > 0);
          const observedRevenueLtv = revenueCustomers.length
            ? Math.round(recognizedRevenue / revenueCustomers.length)
            : null;
          const observedGrossProfitLtv = completeCosts && revenueCustomers.length && grossProfit !== null
            ? Math.round(grossProfit / revenueCustomers.length)
            : null;

          const blockers: string[] = [];
          if (enquiries < policy.minimumEnquiries) blockers.push(`fewer than ${policy.minimumEnquiries} enquiries`);
          if (proposals < policy.minimumProposals) blockers.push(`fewer than ${policy.minimumProposals} proposals`);
          if (spend <= 0) blockers.push("no service-tagged acquisition spend");
          if (wins > 0 && revenueCoveragePct < policy.minimumRevenueCoveragePct) blockers.push("revenue evidence coverage below 80%");
          if (winsWithRevenue > 0 && costCoveragePct < policy.minimumCostCoveragePct) blockers.push("direct-cost evidence coverage below 80%");

          let decision: "scale" | "maintain" | "cut" | "insufficient_data" = "insufficient_data";
          const reasons: string[] = [];
          const noWinCut = proposals >= 5 && wins === 0 && spend > 0;
          const economicsReady =
            enquiries >= policy.minimumEnquiries &&
            proposals >= policy.minimumProposals &&
            spend > 0 &&
            wins >= policy.minimumWinsForEconomics &&
            revenueCoveragePct >= policy.minimumRevenueCoveragePct &&
            costCoveragePct >= policy.minimumCostCoveragePct &&
            grossMarginPct !== null &&
            grossProfitRoas !== null;

          if (noWinCut) {
            decision = "cut";
            reasons.push("Five or more proposals produced no wins despite recorded service-tagged spend.");
          } else if (economicsReady) {
            const scale =
              proposalWinRate >= policy.scaleProposalWinRatePct &&
              grossMarginPct >= policy.scaleGrossMarginPct &&
              grossProfitRoas >= policy.scaleGrossProfitRoas &&
              (paybackDays === null || paybackDays <= policy.scaleMaximumPaybackDays) &&
              stalledShare < 30;
            const cut =
              grossMarginPct < policy.cutGrossMarginPct ||
              grossProfitRoas < policy.cutGrossProfitRoas ||
              (paybackDays !== null && paybackDays > policy.cutMaximumPaybackDays);
            if (scale) {
              decision = "scale";
              reasons.push("Conversion, gross-margin efficiency and acquisition economics clear the scale policy.");
            } else if (cut) {
              decision = "cut";
              reasons.push("Observed gross-margin efficiency or payback breaches the cut policy.");
            } else {
              decision = "maintain";
              reasons.push("Economics are sufficiently evidenced but do not yet clear scale or cut thresholds.");
            }
          } else {
            reasons.push("The engine will not issue a capital-allocation action until minimum sample and evidence coverage are met.");
          }

          const confidence =
            enquiries >= 20 && proposals >= 8 && wins >= 4 &&
            revenueCoveragePct === 100 && costCoveragePct === 100 && spend > 0
              ? "high"
              : decision !== "insufficient_data"
                ? "medium"
                : "low";

          recommendations.push({
            key: `${group.key}::${currency}`,
            channel: group.channel,
            service: group.service,
            currency,
            decision,
            confidence,
            reasons,
            blockers,
            metrics: {
              enquiries,
              proposals,
              wins,
              proposalWinRate,
              stalledShare,
              spend,
              recognizedRevenue,
              directCost: completeCosts ? directCost : null,
              grossProfit,
              grossMarginPct,
              grossProfitRoas,
              mrr,
              arr: mrr * 12,
              paybackDays,
              revenueCoveragePct,
              costCoveragePct,
              observedRevenueLtv,
              observedGrossProfitLtv,
            },
          });
        }
      }

      const cohortMap = new Map<string, {
        cohort: string;
        enquiries: number;
        proposals: number;
        won: number;
        lost: number;
        revenueByCurrency: Map<string, number>;
        grossProfitByCurrency: Map<string, number>;
        costComplete: boolean;
      }>();
      for (const lead of leadRows) {
        const key = monthKey(lead.createdAt);
        const row = cohortMap.get(key) ?? {
          cohort: key,
          enquiries: 0,
          proposals: 0,
          won: 0,
          lost: 0,
          revenueByCurrency: new Map<string, number>(),
          grossProfitByCurrency: new Map<string, number>(),
          costComplete: true,
        };
        row.enquiries += 1;
        const m = milestones.get(lead.id);
        if (m?.proposal || ["proposal", "negotiation", "won"].includes(lead.stage)) row.proposals += 1;
        if (lead.stage === "won") row.won += 1;
        if (lead.stage === "lost") row.lost += 1;
        const revenue = revenueByLeadCurrency.get(lead.id);
        if (revenue) {
          for (const [currency, value] of revenue) {
            row.revenueByCurrency.set(currency, (row.revenueByCurrency.get(currency) ?? 0) + value);
            if (!leadsWithCostEvidence.has(lead.id)) {
              row.costComplete = false;
            } else {
              const cost = costByLeadCurrency.get(lead.id)?.get(currency) ?? 0;
              row.grossProfitByCurrency.set(
                currency,
                (row.grossProfitByCurrency.get(currency) ?? 0) + value - cost,
              );
            }
          }
        }
        cohortMap.set(key, row);
      }

      const activeMrr = new Map<string, number>();
      for (const values of activeMrrByLeadCurrency.values()) {
        for (const [currency, value] of values) activeMrr.set(currency, (activeMrr.get(currency) ?? 0) + value);
      }

      const endedDurations = agreementRows
        .filter((agreement) => agreement.status !== "active" && agreement.endedAt)
        .map((agreement) => (agreement.endedAt!.getTime() - agreement.startedAt.getTime()) / (30.44 * DAY_MS))
        .filter((value) => value >= 0);
      const recurringLifetime = endedDurations.length >= 3 ? average(endedDurations) : null;

      response.setHeader("Cache-Control", "no-store");
      response.json({
        window: windowValue,
        cohortStart: since?.toISOString() ?? null,
        basis: "acquisition_cohort",
        policy,
        evidenceQuality: {
          leads: leadRows.length,
          wonLeads: leadRows.filter((lead) => lead.stage === "won").length,
          winsWithRevenueEvidence: leadRows.filter((lead) => lead.stage === "won" && leadsWithRevenue.has(lead.id)).length,
          winsWithDirectCostEvidence: leadRows.filter((lead) =>
            lead.stage === "won" && leadsWithRevenue.has(lead.id) && leadsWithCostEvidence.has(lead.id)).length,
          unallocatedSpendRecords,
        },
        recurringRevenue: {
          activeMrrByCurrency: [...activeMrr.entries()].map(([currency, mrr]) => ({
            currency,
            mrr,
            arr: mrr * 12,
          })),
          activeAgreements: agreementRows.filter((agreement) => agreement.status === "active").length,
          endedAgreements: agreementRows.filter((agreement) => agreement.status !== "active").length,
          observedAverageEndedLifetimeMonths: recurringLifetime,
          projectedLtvStatus: endedDurations.length >= 3 ? "eligible_for_observed_lifetime_model" : "insufficient_ended_agreements",
          note: endedDurations.length >= 3
            ? "Observed ended-agreement lifetime can support a transparent LTV model; no retention assumption is injected."
            : "Projected recurring LTV is withheld until at least three ended recurring agreements exist. Observed revenue/gross-profit LTV remains available per allocation segment.",
        },
        proposalVelocityDays: {
          proposalToWon: average(proposalToWonDays),
          proposalToLost: average(proposalToLostDays),
          openProposalAge: average(openProposalAgeDays),
          samples: {
            won: proposalToWonDays.length,
            lost: proposalToLostDays.length,
            open: openProposalAgeDays.length,
          },
        },
        pipelineAging: {
          buckets: ["0-7", "8-14", "15-30", "31-60", "61-90", "90+"].map((key) => {
            const row = agingBuckets.get(key) ?? { key, count: 0, valueByCurrency: new Map<string, number>() };
            return {
              key,
              count: row.count,
              valueByCurrency: [...row.valueByCurrency.entries()].map(([currency, value]) => ({ currency, value })),
            };
          }),
          stalled: staleLeads.sort((a, b) => b.ageDays - a.ageDays).slice(0, 50),
          stageThresholdDays,
        },
        cohorts: [...cohortMap.values()]
          .sort((a, b) => b.cohort.localeCompare(a.cohort))
          .slice(0, 12)
          .map((row) => ({
            cohort: row.cohort,
            enquiries: row.enquiries,
            proposals: row.proposals,
            won: row.won,
            lost: row.lost,
            proposalRate: row.enquiries ? round((row.proposals / row.enquiries) * 100) : 0,
            proposalWinRate: row.proposals ? round((row.won / row.proposals) * 100) : 0,
            recognizedRevenueByCurrency: [...row.revenueByCurrency.entries()].map(([currency, revenue]) => ({ currency, revenue })),
            grossProfitByCurrency: row.costComplete
              ? [...row.grossProfitByCurrency.entries()].map(([currency, grossProfit]) => ({ currency, grossProfit }))
              : [],
            grossProfitStatus: row.costComplete ? "available" : "incomplete_cost_evidence",
          })),
        allocationRecommendations: recommendations.sort((a, b) => {
          const order = { scale: 0, maintain: 1, cut: 2, insufficient_data: 3 } as Record<string, number>;
          return (order[String(a.decision)] ?? 9) - (order[String(b.decision)] ?? 9) ||
            String(a.channel).localeCompare(String(b.channel)) ||
            String(a.service).localeCompare(String(b.service));
        }),
      });
    },
  );

  return router;
}
