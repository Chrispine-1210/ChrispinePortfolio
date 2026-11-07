import { and, desc, eq, isNull } from "drizzle-orm";
import { Router } from "express";
import { z } from "zod";
import {
  auditEvents,
  caseStudies,
  caseStudyEvidence,
  projects,
} from "../../shared/schema.js";
import { requireAdminPermission } from "../custom-auth.js";
import { db } from "../db.js";
import { evaluateEvidenceGate } from "./policy.js";

const projectFields = {
  projectCode: z.string().trim().min(2).max(80).regex(/^[A-Za-z0-9._-]+$/),
  name: z.string().trim().min(1).max(240),
  organizationName: z.string().trim().max(240).nullable().optional(),
  sector: z.string().trim().max(160).nullable().optional(),
  country: z.string().trim().max(120).nullable().optional(),
  status: z.enum(["planned", "active", "hold", "completed", "cancelled", "legacy"]),
  confidentiality: z.enum(["internal", "confidential", "restricted"]),
  internalSummary: z.string().trim().max(20_000).nullable().optional(),
  commercialValue: z.union([
    z.number().nonnegative(),
    z.string().regex(/^\d+(?:\.\d{1,2})?$/),
    z.null(),
  ]).optional(),
  currency: z.string().length(3).transform((value) => value.toUpperCase()),
  startDate: z.string().datetime().nullable().optional(),
  targetDate: z.string().datetime().nullable().optional(),
  repositoryUrl: z.string().url().nullable().optional(),
  deploymentUrl: z.string().url().nullable().optional(),
};

const projectCreateInput = z.object({
  ...projectFields,
  status: projectFields.status.default("active"),
  confidentiality: projectFields.confidentiality.default("internal"),
  currency: projectFields.currency.default("USD"),
}).strict();

const projectPatchInput = z.object(projectFields).partial().strict();

const caseStudyFields = {
  projectId: z.string().uuid().nullable().optional(),
  title: z.string().trim().min(1).max(300),
  slug: z.string().trim().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/).max(240),
  summary: z.string().trim().min(1).max(5000),
  challenge: z.string().max(50_000).nullable().optional(),
  constraints: z.string().max(50_000).nullable().optional(),
  objectives: z.string().max(50_000).nullable().optional(),
  solution: z.string().max(100_000).nullable().optional(),
  architecture: z.string().max(100_000).nullable().optional(),
  technologies: z.array(z.string().trim().min(1).max(100)).max(50),
  securityControls: z.string().max(50_000).nullable().optional(),
  integrations: z.string().max(50_000).nullable().optional(),
  roleDescription: z.string().max(50_000).nullable().optional(),
  teamDescription: z.string().max(50_000).nullable().optional(),
  timeline: z.string().max(50_000).nullable().optional(),
  outcome: z.string().max(50_000).nullable().optional(),
  lessons: z.string().max(50_000).nullable().optional(),
  nextPhase: z.string().max(50_000).nullable().optional(),
  category: z.string().trim().min(1).max(160),
  featuredImage: z.string().url().nullable().optional(),
  images: z.array(z.string().url()).max(30),
  liveUrl: z.string().url().nullable().optional(),
  githubUrl: z.string().url().nullable().optional(),
  visibility: z.enum(["public", "unlisted", "private"]),
  featured: z.boolean(),
  order: z.number().int().min(0).max(10_000),
  seoTitle: z.string().trim().max(70).nullable().optional(),
  seoDescription: z.string().trim().max(170).nullable().optional(),
  canonicalUrl: z.string().url().nullable().optional(),
  ogImage: z.string().url().nullable().optional(),
};

const caseStudyCreateInput = z.object({
  ...caseStudyFields,
  technologies: caseStudyFields.technologies.default([]),
  images: caseStudyFields.images.default([]),
  visibility: caseStudyFields.visibility.default("private"),
  featured: caseStudyFields.featured.default(false),
  order: caseStudyFields.order.default(0),
}).strict();

const caseStudyPatchInput = z.object(caseStudyFields).partial().strict();

const evidenceContentFields = {
  claim: z.string().trim().min(1).max(20_000),
  claimType: z.string().trim().min(1).max(80),
  sourceType: z.string().trim().min(1).max(80),
  sourceReference: z.string().trim().min(1).max(4000),
  measurementPeriod: z.string().trim().max(160).nullable().optional(),
  calculationMethod: z.string().max(20_000).nullable().optional(),
  notes: z.string().max(20_000).nullable().optional(),
};

const evidenceCreateInput = z.object({
  ...evidenceContentFields,
  claimType: evidenceContentFields.claimType.default("delivery"),
}).strict();

const evidenceApprovalInput = z.object({
  verificationStatus: z.enum([
    "unverified",
    "internally_verified",
    "externally_verified",
    "rejected",
  ]),
  disclosureStatus: z.enum(["private", "review", "approved_public", "rejected"]),
  notes: z.string().max(20_000).nullable().optional(),
}).strict();

async function refreshEvidenceGate(transaction: any, caseStudyId: string) {
  const records = await transaction
    .select({
      verificationStatus: caseStudyEvidence.verificationStatus,
      disclosureStatus: caseStudyEvidence.disclosureStatus,
    })
    .from(caseStudyEvidence)
    .where(eq(caseStudyEvidence.caseStudyId, caseStudyId));
  const gate = evaluateEvidenceGate(records);
  await transaction
    .update(caseStudies)
    .set({ evidenceGateStatus: gate.status, updatedAt: new Date() })
    .where(eq(caseStudies.id, caseStudyId));
  return gate;
}

function auditValues(request: Express.Request) {
  return {
    actorUserId: request.securityPrincipal?.userId ?? null,
    actorSessionId: request.securityPrincipal?.sessionId ?? null,
    requestId: request.requestId,
  };
}

export function createPortfolioGovernanceRouter() {
  const router = Router();

  router.get("/api/admin/projects", requireAdminPermission("portfolio.read"), async (_request, response) => {
    response.setHeader("Cache-Control", "no-store");
    response.json(await db.select().from(projects).where(isNull(projects.archivedAt)).orderBy(desc(projects.updatedAt)).limit(500));
  });

  router.post("/api/admin/projects", requireAdminPermission("portfolio.manage"), async (request, response) => {
    const input = projectCreateInput.parse(request.body);
    const record = await db.transaction(async (transaction) => {
      const [created] = await transaction.insert(projects).values({
        ...input,
        commercialValue: input.commercialValue == null ? input.commercialValue : String(input.commercialValue),
        startDate: input.startDate ? new Date(input.startDate) : null,
        targetDate: input.targetDate ? new Date(input.targetDate) : null,
        ownerId: request.securityPrincipal?.userId ?? null,
      }).returning();
      await transaction.insert(auditEvents).values({
        ...auditValues(request), action: "project.create", resourceType: "project",
        resourceId: created.id, result: "success", newState: created,
      });
      return created;
    });
    response.status(201).json(record);
  });

  router.patch("/api/admin/projects/:id", requireAdminPermission("portfolio.manage"), async (request, response) => {
    const input = projectPatchInput.parse(request.body);
    const record = await db.transaction(async (transaction) => {
      const [previous] = await transaction.select().from(projects).where(eq(projects.id, request.params.id)).limit(1);
      if (!previous || previous.archivedAt) return undefined;
      const changes = {
        ...input,
        commercialValue: input.commercialValue === undefined ? undefined : input.commercialValue === null ? null : String(input.commercialValue),
        startDate: input.startDate === undefined ? undefined : input.startDate === null ? null : new Date(input.startDate),
        targetDate: input.targetDate === undefined ? undefined : input.targetDate === null ? null : new Date(input.targetDate),
        updatedAt: new Date(),
      };
      const [updated] = await transaction.update(projects).set(changes).where(eq(projects.id, previous.id)).returning();
      await transaction.insert(auditEvents).values({
        ...auditValues(request), action: "project.update", resourceType: "project",
        resourceId: previous.id, result: "success", previousState: previous, newState: updated,
      });
      return updated;
    });
    if (!record) return response.status(404).json({ message: "Project not found" });
    response.json(record);
  });

  router.post("/api/admin/projects/:id/archive", requireAdminPermission("portfolio.manage"), async (request, response) => {
    const { justification } = z.object({ justification: z.string().trim().min(8).max(1000) }).strict().parse(request.body);
    const record = await db.transaction(async (transaction) => {
      const [previous] = await transaction.select().from(projects).where(eq(projects.id, request.params.id)).limit(1);
      if (!previous || previous.archivedAt) return undefined;
      const [updated] = await transaction.update(projects).set({ archivedAt: new Date(), updatedAt: new Date() }).where(eq(projects.id, previous.id)).returning();
      await transaction.insert(auditEvents).values({
        ...auditValues(request), action: "project.archive", resourceType: "project",
        resourceId: previous.id, result: "success", justification,
        previousState: { archivedAt: previous.archivedAt }, newState: { archivedAt: updated.archivedAt },
      });
      return updated;
    });
    if (!record) return response.status(404).json({ message: "Project not found" });
    response.json(record);
  });

  router.get("/api/admin/case-studies", requireAdminPermission("portfolio.read"), async (_request, response) => {
    const records = await db.select().from(caseStudies).orderBy(desc(caseStudies.updatedAt)).limit(500);
    const evidence = await db.select({
      caseStudyId: caseStudyEvidence.caseStudyId,
      verificationStatus: caseStudyEvidence.verificationStatus,
      disclosureStatus: caseStudyEvidence.disclosureStatus,
    }).from(caseStudyEvidence);
    response.setHeader("Cache-Control", "no-store");
    response.json(records.map((record) => ({
      ...record,
      evidenceCount: evidence.filter((item) => item.caseStudyId === record.id).length,
      approvedPublicEvidenceCount: evidence.filter((item) =>
        item.caseStudyId === record.id &&
        ["internally_verified", "externally_verified"].includes(item.verificationStatus) &&
        item.disclosureStatus === "approved_public"
      ).length,
    })));
  });

  router.post("/api/admin/case-studies", requireAdminPermission("portfolio.manage"), async (request, response) => {
    const input = caseStudyCreateInput.parse(request.body);
    const record = await db.transaction(async (transaction) => {
      if (input.projectId) {
        const [project] = await transaction.select({ id: projects.id }).from(projects)
          .where(and(eq(projects.id, input.projectId), isNull(projects.archivedAt))).limit(1);
        if (!project) return undefined;
      }
      const [created] = await transaction.insert(caseStudies).values({
        ...input,
        workflowStatus: "draft",
        visibility: input.visibility ?? "private",
        evidenceGateStatus: "blocked",
        createdBy: request.securityPrincipal?.userId ?? null,
        updatedBy: request.securityPrincipal?.userId ?? null,
      }).returning();
      await transaction.insert(auditEvents).values({
        ...auditValues(request), action: "case_study.create", resourceType: "case_study",
        resourceId: created.id, result: "success", newState: created,
      });
      return created;
    });
    if (!record) return response.status(400).json({ message: "Linked project does not exist or is archived" });
    response.status(201).json(record);
  });

  router.patch("/api/admin/case-studies/:id", requireAdminPermission("portfolio.manage"), async (request, response) => {
    const input = caseStudyPatchInput.parse(request.body);
    const record = await db.transaction(async (transaction) => {
      const [previous] = await transaction.select().from(caseStudies).where(eq(caseStudies.id, request.params.id)).limit(1);
      if (!previous) return { outcome: "missing" as const };
      if (previous.workflowStatus !== "draft") return { outcome: "locked" as const };
      if (input.projectId) {
        const [project] = await transaction.select({ id: projects.id }).from(projects)
          .where(and(eq(projects.id, input.projectId), isNull(projects.archivedAt))).limit(1);
        if (!project) return { outcome: "project" as const };
      }
      const [updated] = await transaction.update(caseStudies).set({
        ...input,
        evidenceGateStatus: "blocked",
        updatedBy: request.securityPrincipal?.userId ?? null,
        updatedAt: new Date(),
      }).where(eq(caseStudies.id, previous.id)).returning();
      // Any editorial change invalidates prior public-disclosure approval until
      // the supporting evidence is explicitly reviewed again.
      await transaction.update(caseStudyEvidence).set({
        disclosureStatus: "review",
        updatedAt: new Date(),
      }).where(and(
        eq(caseStudyEvidence.caseStudyId, previous.id),
        eq(caseStudyEvidence.disclosureStatus, "approved_public"),
      ));
      await refreshEvidenceGate(transaction, previous.id);
      await transaction.insert(auditEvents).values({
        ...auditValues(request), action: "case_study.update", resourceType: "case_study",
        resourceId: previous.id, result: "success", previousState: previous, newState: updated,
      });
      return { outcome: "ok" as const, record: updated };
    });
    if (record.outcome === "missing") return response.status(404).json({ message: "Case study not found" });
    if (record.outcome === "locked") return response.status(409).json({ message: "Only draft case studies can be edited" });
    if (record.outcome === "project") return response.status(400).json({ message: "Linked project does not exist or is archived" });
    response.json(record.record);
  });

  router.get("/api/admin/case-studies/:id/evidence", requireAdminPermission("portfolio.read"), async (request, response) => {
    response.setHeader("Cache-Control", "no-store");
    response.json(await db.select().from(caseStudyEvidence)
      .where(eq(caseStudyEvidence.caseStudyId, request.params.id))
      .orderBy(desc(caseStudyEvidence.createdAt)).limit(500));
  });

  router.post("/api/admin/case-studies/:id/evidence", requireAdminPermission("portfolio.manage"), async (request, response) => {
    const input = evidenceCreateInput.parse(request.body);
    const result = await db.transaction(async (transaction) => {
      const [caseStudy] = await transaction.select().from(caseStudies).where(eq(caseStudies.id, request.params.id)).limit(1);
      if (!caseStudy) return { outcome: "missing" as const };
      if (!["draft", "in_review"].includes(caseStudy.workflowStatus)) return { outcome: "locked" as const };
      const [created] = await transaction.insert(caseStudyEvidence).values({
        ...input,
        verificationStatus: "unverified",
        disclosureStatus: "private",
        verifiedBy: null,
        verifiedAt: null,
        createdBy: request.securityPrincipal?.userId ?? null,
      }).returning();
      const gate = await refreshEvidenceGate(transaction, caseStudy.id);
      await transaction.insert(auditEvents).values({
        ...auditValues(request), action: "case_study.evidence.create", resourceType: "case_study_evidence",
        resourceId: created.id, result: "success", newState: created,
        metadata: { caseStudyId: caseStudy.id, evidenceGateStatus: gate.status },
      });
      return { outcome: "ok" as const, record: created, gate };
    });
    if (result.outcome === "missing") return response.status(404).json({ message: "Case study not found" });
    if (result.outcome === "locked") return response.status(409).json({ message: "Evidence can only be changed while the case study is draft or in review" });
    response.status(201).json({ evidence: result.record, gate: result.gate });
  });

  router.patch("/api/admin/case-study-evidence/:id", requireAdminPermission("portfolio.approve"), async (request, response) => {
    const input = evidenceApprovalInput.parse(request.body);
    const result = await db.transaction(async (transaction) => {
      const [previous] = await transaction.select().from(caseStudyEvidence).where(eq(caseStudyEvidence.id, request.params.id)).limit(1);
      if (!previous) return { outcome: "missing" as const };
      const [caseStudy] = await transaction.select().from(caseStudies).where(eq(caseStudies.id, previous.caseStudyId)).limit(1);
      if (!caseStudy || !["draft", "in_review"].includes(caseStudy.workflowStatus)) return { outcome: "locked" as const };
      const nextVerification = input.verificationStatus ?? previous.verificationStatus;
      const verified = ["internally_verified", "externally_verified"].includes(nextVerification);
      const [updated] = await transaction.update(caseStudyEvidence).set({
        ...input,
        verifiedBy: verified ? request.securityPrincipal?.userId ?? previous.verifiedBy : null,
        verifiedAt: verified ? new Date() : null,
        updatedAt: new Date(),
      }).where(eq(caseStudyEvidence.id, previous.id)).returning();
      const gate = await refreshEvidenceGate(transaction, previous.caseStudyId);
      await transaction.insert(auditEvents).values({
        ...auditValues(request), action: "case_study.evidence.update", resourceType: "case_study_evidence",
        resourceId: previous.id, result: "success", previousState: previous, newState: updated,
        metadata: { caseStudyId: previous.caseStudyId, evidenceGateStatus: gate.status },
      });
      return { outcome: "ok" as const, record: updated, gate };
    });
    if (result.outcome === "missing") return response.status(404).json({ message: "Evidence record not found" });
    if (result.outcome === "locked") return response.status(409).json({ message: "Evidence can only be changed while the case study is draft or in review" });
    response.json({ evidence: result.record, gate: result.gate });
  });

  router.post("/api/admin/case-studies/:id/transition", requireAdminPermission("portfolio.manage"), async (request, response) => {
    const input = z.object({
      action: z.enum(["submit_review", "return_draft", "approve", "publish", "archive", "restore"]),
      justification: z.string().trim().max(1000).optional(),
    }).strict().parse(request.body);
    const policy = {
      submit_review: { from: ["draft"], to: "in_review" },
      return_draft: { from: ["in_review", "approved"], to: "draft" },
      approve: { from: ["in_review"], to: "approved" },
      publish: { from: ["approved"], to: "published" },
      archive: { from: ["draft", "in_review", "approved", "published"], to: "archived" },
      restore: { from: ["archived"], to: "draft" },
    }[input.action];
    if (
      ["approve", "publish"].includes(input.action) &&
      request.securityPrincipal &&
      !request.securityPrincipal.permissions.includes("portfolio.approve")
    ) {
      return response.status(403).json({ message: "Portfolio approval permission required" });
    }
    if (input.action === "archive" && (!input.justification || input.justification.length < 8)) {
      return response.status(400).json({ message: "Archive justification must contain at least 8 characters" });
    }
    const result = await db.transaction(async (transaction) => {
      const [previous] = await transaction.select().from(caseStudies).where(eq(caseStudies.id, request.params.id)).limit(1);
      if (!previous) return { outcome: "missing" as const };
      if (!policy.from.includes(previous.workflowStatus)) return { outcome: "transition" as const };
      const gate = await refreshEvidenceGate(transaction, previous.id);
      if (["approve", "publish"].includes(input.action) && gate.status !== "approved") {
        return { outcome: "evidence" as const, gate };
      }
      if (input.action === "publish" && previous.visibility === "private") {
        return { outcome: "visibility" as const };
      }
      const now = new Date();
      const [updated] = await transaction.update(caseStudies).set({
        workflowStatus: policy.to,
        evidenceGateStatus: gate.status,
        approvedAt: input.action === "approve" ? now : input.action === "return_draft" || input.action === "restore" ? null : previous.approvedAt,
        publishedAt: input.action === "publish" ? now : previous.publishedAt,
        archivedAt: input.action === "archive" ? now : input.action === "restore" ? null : previous.archivedAt,
        visibility: input.action === "restore" ? "private" : previous.visibility,
        updatedBy: request.securityPrincipal?.userId ?? null,
        updatedAt: now,
      }).where(eq(caseStudies.id, previous.id)).returning();
      await transaction.insert(auditEvents).values({
        ...auditValues(request), action: `case_study.${input.action}`, resourceType: "case_study",
        resourceId: previous.id, result: "success", justification: input.justification,
        previousState: { workflowStatus: previous.workflowStatus, evidenceGateStatus: previous.evidenceGateStatus },
        newState: { workflowStatus: updated.workflowStatus, evidenceGateStatus: gate.status },
      });
      return { outcome: "ok" as const, record: updated, gate };
    });
    if (result.outcome === "missing") return response.status(404).json({ message: "Case study not found" });
    if (result.outcome === "transition") return response.status(409).json({ message: "Invalid case study workflow transition" });
    if (result.outcome === "evidence") return response.status(409).json({ message: "Evidence gate blocked this transition", gate: result.gate });
    if (result.outcome === "visibility") return response.status(409).json({ message: "Private case studies cannot be published" });
    response.json({ caseStudy: result.record, gate: result.gate });
  });

  return router;
}
