import {
  EDITORIAL_PREFIX,
  editorialContent,
  editorialPlainText,
  imageSource,
} from "./editorial.js";
import { z } from "zod";

export const contexts = ["personal", "aothothe", "sudern"] as const;
export const topics = [
  "networking",
  "programming",
  "hardware",
  "servers",
  "software",
  "cybersecurity",
  "embedded",
] as const;
export const recordKinds = [
  "diary",
  "task",
  "work_log",
  "risk",
  "decision",
  "meeting",
  "presentation",
  "content",
  "ai_review",
  "asset",
  "security_event",
  "practice",
] as const;
export const statuses = [
  "draft",
  "planned",
  "active",
  "blocked",
  "review",
  "done",
  "archived",
] as const;
export type EngineeringContext = (typeof contexts)[number];
export type RecordKind = (typeof recordKinds)[number];
export type RecordStatus = (typeof statuses)[number];
const line = z.string().trim().max(1200);
const short = z.string().trim().max(240);
const date = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/)
  .refine(
    (v) =>
      !Number.isNaN(Date.parse(v)) &&
      new Date(v).toISOString().slice(0, 10) === v,
    "Use a real calendar date",
  );
const https = z
  .string()
  .url()
  .max(2000)
  .refine((v) => {
    try {
      const u = new URL(v);
      return u.protocol === "https:" && !u.username && !u.password;
    } catch {
      return false;
    }
  }, "Use an HTTPS URL without credentials");
export const evidenceUrl = https.or(z.literal(""));
const links = z.array(z.string().uuid()).max(12).default([]);

export const detailSchemas = {
  diary: z
    .object({
      objective: line,
      work: line,
      lesson: line,
      nextStep: line,
      topic: z.enum(topics),
      minutes: z.number().int().min(0).max(1440),
    })
    .strict(),
  task: z
    .object({
      acceptance: line,
      result: line,
      dependencies: links,
      impact: z.enum([
        "delivery",
        "revenue",
        "reliability",
        "learning",
        "delegation",
      ]),
      effortMinutes: z.number().int().min(0).max(43200),
    })
    .strict(),
  work_log: z
    .object({
      minutes: z.number().int().min(1).max(1440),
      category: z.enum(["delivery", "learning", "maintenance", "coordination"]),
      result: line,
      relatedEntries: links,
    })
    .strict(),
  risk: z
    .object({
      likelihood: z.number().int().min(1).max(5),
      impact: z.number().int().min(1).max(5),
      mitigation: line,
      trigger: line,
      reviewDate: date,
    })
    .strict(),
  decision: z
    .object({
      problem: line,
      options: z.array(short).min(2).max(6),
      choice: short,
      rationale: line,
      expectedBenefit: line,
      reviewDate: date,
      reversible: z.boolean(),
    })
    .strict(),
  meeting: z
    .object({
      startsAt: z.string().datetime({ offset: true }),
      endsAt: z.string().datetime({ offset: true }),
      agenda: line,
      participants: short,
      minutes: line,
      actionEntries: links,
    })
    .strict()
    .refine(
      (x) => Date.parse(x.endsAt) > Date.parse(x.startsAt),
      "Meeting end must follow its start",
    ),
  presentation: z
    .object({
      audience: short,
      objective: line,
      keyMessage: line,
      sections: z.array(short).min(1).max(12),
      runOfShow: line,
      rehearsalNotes: line,
      assetUrl: evidenceUrl,
    })
    .strict(),
  content: z
    .object({
      topic: z.enum(topics),
      platform: z.enum([
        "website",
        "youtube",
        "vimeo",
        "facebook",
        "instagram",
        "tiktok",
        "linkedin",
      ]),
      mediaUrl: evidenceUrl,
      outline: line,
      transcript: line,
      callToAction: short,
    })
    .strict(),
  ai_review: z
    .object({
      purpose: line,
      provider: short,
      model: short,
      classification: z.enum(["public", "internal", "confidential"]),
      outputSummary: line,
      verdict: z.enum(["pending", "accepted", "rejected"]),
      reviewNotes: line,
      reportedCostMwk: z.number().finite().min(0).max(100000000).nullable(),
    })
    .strict(),
  asset: z
    .object({
      layer: z.enum([
        "physical",
        "endpoint",
        "network",
        "server",
        "application",
        "database",
        "cloud",
      ]),
      identifier: short,
      criticality: z.enum(["low", "medium", "high", "critical"]),
      authorized: z.boolean(),
      monitoring: z.enum(["not_connected", "manual_review"]),
      source: short,
      lastObservedAt: z.string().datetime({ offset: true }).nullable(),
      recoveryPlan: line,
    })
    .strict(),
  security_event: z
    .object({
      assetId: z.string().uuid(),
      observedAt: z.string().datetime({ offset: true }),
      severity: z.enum(["low", "medium", "high", "critical"]),
      source: short,
      finding: line,
      disposition: z.enum([
        "untriaged",
        "investigating",
        "expected",
        "resolved",
      ]),
      response: line,
    })
    .strict(),
  practice: z
    .object({
      topic: z.enum(topics),
      goal: line,
      exercise: line,
      learning: line,
      confidence: z.number().int().min(1).max(5),
      authorizedScope: line,
    })
    .strict(),
} as const;

export type EngineeringDetails = {
  [K in RecordKind]: z.infer<(typeof detailSchemas)[K]>;
}[RecordKind];
const base = z
  .object({
    context: z.enum(contexts),
    kind: z.enum(recordKinds),
    title: z.string().trim().min(3).max(200),
    summary: z.string().trim().max(1600),
    workDate: date,
    dueDate: date.nullable(),
    status: z.enum(statuses),
    priority: z.number().int().min(1).max(4),
    accountable: z.string().trim().min(1).max(160),
    evidence: z.array(https).max(8),
    details: z.unknown(),
  })
  .strict();
export const recordInput = base.superRefine((value, ctx) => {
  const result = detailSchemas[value.kind].safeParse(value.details);
  if (!result.success)
    for (const e of result.error.issues)
      ctx.addIssue({
        code: "custom",
        path: ["details", ...e.path],
        message: e.message,
      });
  // This workspace is not a credential vault. Never retain credential-shaped values in logs/history.
  if (
    /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----|postgres(?:ql)?:\/\/[^\s]+:[^\s]+@|\bsk-(?:proj-)?[A-Za-z0-9_-]{20,}|\bAKIA[A-Z0-9]{16}\b/.test(
      JSON.stringify(value),
    )
  )
    ctx.addIssue({
      code: "custom",
      message: "Remove credentials or private keys before saving",
    });
  if (value.kind === "task" && value.status === "done") {
    const task = value.details as z.infer<typeof detailSchemas.task>;
    if (!task?.acceptance?.trim() || !task?.result?.trim())
      ctx.addIssue({
        code: "custom",
        path: ["details", "result"],
        message:
          "Record acceptance criteria and a result before completing a task",
      });
  }
  if (value.kind === "decision" && value.status === "done") {
    const d = value.details as z.infer<typeof detailSchemas.decision>;
    if (!d?.choice || !d?.rationale || !d.options?.includes(d.choice))
      ctx.addIssue({
        code: "custom",
        message: "A completed decision needs a listed choice and rationale",
      });
  }
  if (
    value.kind === "meeting" &&
    value.status === "done" &&
    !(value.details as { minutes?: string })?.minutes?.trim()
  )
    ctx.addIssue({
      code: "custom",
      message: "Record meeting minutes before completion",
    });
  if (
    value.kind === "ai_review" &&
    value.status === "done" &&
    ((value.details as { verdict?: string })?.verdict === "pending" ||
      !(value.details as { reviewNotes?: string })?.reviewNotes?.trim())
  )
    ctx.addIssue({
      code: "custom",
      message: "An AI review needs a human verdict and notes",
    });
});
export type EngineeringRecordInput = z.infer<typeof base> & {
  details: EngineeringDetails;
};
export type EngineeringRecord = EngineeringRecordInput & {
  id: string;
  version: number;
  createdAt: string;
  updatedAt: string;
};
export type Publication = {
  id: string;
  slug: string;
  title: string;
  summary: string;
  body: string;
  learning: string;
  topic: (typeof topics)[number];
  mediaUrl: string | null;
  imageUrl: string | null;
  imageAlt: string | null;
  publishedAt: string;
  evidenceLevel: "self_reported" | "source_reviewed" | "runtime_verified";
  evidenceUrls: string[];
  limitations: string;
};

export function mediaReference(value: string): {
  provider: "youtube" | "vimeo" | "link";
  url: string;
  embedUrl?: string;
} | null {
  try {
    const u = new URL(value);
    if (u.protocol !== "https:" || u.username || u.password) return null;
    const host = u.hostname.toLowerCase();
    if (
      ["youtube.com", "www.youtube.com", "m.youtube.com", "youtu.be"].includes(
        host,
      )
    ) {
      const id =
        host === "youtu.be"
          ? u.pathname.slice(1)
          : u.pathname.startsWith("/shorts/")
            ? u.pathname.split("/")[2]
            : u.searchParams.get("v");
      if (!id || !/^[A-Za-z0-9_-]{11}$/.test(id)) return null;
      return {
        provider: "youtube",
        url: `https://www.youtube.com/watch?v=${id}`,
        embedUrl: `https://www.youtube-nocookie.com/embed/${id}`,
      };
    }
    if (host === "vimeo.com" || host === "www.vimeo.com") {
      const id = u.pathname.slice(1);
      if (!/^\d{5,12}$/.test(id)) return null;
      return {
        provider: "vimeo",
        url: `https://vimeo.com/${id}`,
        embedUrl: `https://player.vimeo.com/video/${id}`,
      };
    }
    if (
      [
        "facebook.com",
        "www.facebook.com",
        "instagram.com",
        "www.instagram.com",
        "tiktok.com",
        "www.tiktok.com",
        "linkedin.com",
        "www.linkedin.com",
      ].includes(host) &&
      u.pathname !== "/"
    )
      return { provider: "link", url: u.origin + u.pathname };
    return null;
  } catch {
    return null;
  }
}
export const publicationInput = z
  .object({
    slug: z
      .string()
      .trim()
      .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)
      .max(180),
    title: z.string().trim().min(3).max(200),
    summary: z.string().trim().min(20).max(600),
    body: editorialContent
      .refine(
        (value) =>
          value.length <= 100_000 &&
          (value.startsWith(EDITORIAL_PREFIX) || value.length <= 5000),
        "Field notes must fit within the document limit.",
      )
      .refine(
        (value) => editorialPlainText(value).trim().length >= 80,
        "Write at least 80 characters.",
      ),
    learning: z.string().trim().min(10).max(1200),
    topic: z.enum(topics),
    mediaUrl: evidenceUrl,
    imageUrl: z
      .union([
        z.literal(""),
        imageSource.refine(
          (value) => !value.startsWith("data:"),
          "Use a library image or a hosted image URL.",
        ),
      ])
      .transform((value) => value || null)
      .nullable()
      .optional(),
    imageAlt: z.string().trim().max(240),
    evidenceLevel: z.enum([
      "self_reported",
      "source_reviewed",
      "runtime_verified",
    ]),
    evidenceUrls: z.array(https).max(8),
    limitations: z.string().trim().min(10).max(1200),
    disclosureReviewed: z.literal(true),
    expectedVersion: z.number().int().positive(),
    requestKey: z.string().uuid(),
  })
  .strict()
  .superRefine((x, ctx) => {
    if (new TextEncoder().encode(JSON.stringify(x)).byteLength > 128 * 1024)
      ctx.addIssue({
        code: "custom",
        path: ["body"],
        message:
          "The complete field note exceeds 128 KB. Reduce its text or image URLs before publishing.",
      });
    if (x.mediaUrl && !mediaReference(x.mediaUrl))
      ctx.addIssue({
        code: "custom",
        path: ["mediaUrl"],
        message: "Use a supported YouTube, Vimeo or social post URL",
      });
    if (x.imageUrl && !x.imageAlt)
      ctx.addIssue({
        code: "custom",
        path: ["imageAlt"],
        message: "Describe the approved image",
      });
    if (
      /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----|postgres(?:ql)?:\/\/[^\s]+:[^\s]+@|\bsk-(?:proj-)?[A-Za-z0-9_-]{20,}|\bAKIA[A-Z0-9]{16}\b/.test(
        JSON.stringify(x),
      )
    )
      ctx.addIssue({
        code: "custom",
        message: "Remove credentials or private keys before publication",
      });
    if (x.evidenceLevel !== "self_reported" && !x.evidenceUrls.length)
      ctx.addIssue({
        code: "custom",
        path: ["evidenceUrls"],
        message: "Add the source or runtime evidence",
      });
  });

export function emptyDetails(
  kind: RecordKind,
  workDate: string,
): EngineeringDetails {
  const common = {
    diary: {
      objective: "",
      work: "",
      lesson: "",
      nextStep: "",
      topic: "networking",
      minutes: 0,
    },
    task: {
      acceptance: "",
      result: "",
      dependencies: [],
      impact: "delivery",
      effortMinutes: 0,
    },
    work_log: {
      minutes: 30,
      category: "learning",
      result: "",
      relatedEntries: [],
    },
    risk: {
      likelihood: 3,
      impact: 3,
      mitigation: "",
      trigger: "",
      reviewDate: workDate,
    },
    decision: {
      problem: "",
      options: ["", ""],
      choice: "",
      rationale: "",
      expectedBenefit: "",
      reviewDate: workDate,
      reversible: true,
    },
    meeting: {
      startsAt: workDate + "T08:00:00+02:00",
      endsAt: workDate + "T09:00:00+02:00",
      agenda: "",
      participants: "",
      minutes: "",
      actionEntries: [],
    },
    presentation: {
      audience: "",
      objective: "",
      keyMessage: "",
      sections: ["Opening"],
      runOfShow: "",
      rehearsalNotes: "",
      assetUrl: "",
    },
    content: {
      topic: "networking",
      platform: "website",
      mediaUrl: "",
      outline: "",
      transcript: "",
      callToAction: "",
    },
    ai_review: {
      purpose: "",
      provider: "",
      model: "",
      classification: "public",
      outputSummary: "",
      verdict: "pending",
      reviewNotes: "",
      reportedCostMwk: null,
    },
    asset: {
      layer: "endpoint",
      identifier: "",
      criticality: "medium",
      authorized: false,
      monitoring: "not_connected",
      source: "",
      lastObservedAt: null,
      recoveryPlan: "",
    },
    security_event: {
      assetId: "",
      observedAt: new Date().toISOString(),
      severity: "medium",
      source: "",
      finding: "",
      disposition: "untriaged",
      response: "",
    },
    practice: {
      topic: "networking",
      goal: "",
      exercise: "",
      learning: "",
      confidence: 1,
      authorizedScope: "",
    },
  };
  return common[kind] as EngineeringDetails;
}
