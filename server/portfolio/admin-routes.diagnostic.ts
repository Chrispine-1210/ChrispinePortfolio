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


export {};
