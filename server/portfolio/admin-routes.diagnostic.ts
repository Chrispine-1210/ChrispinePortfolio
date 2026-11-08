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

export {};
