import {
  and,
  desc,
  eq,
  gt,
  ilike,
  inArray,
  isNull,
  lte,
  or,
  sql,
} from "drizzle-orm";
import { Router } from "express";
import { z } from "zod";
import {
  blogPosts,
  auditEvents,
  contentVersions,
  contactRequests,
  emailOutbox,
  leadActivities,
  leads,
  newsletterSubscribers,
  notificationCampaigns,
  notificationInbox,
  permissions,
  portfolioProjects,
  rolePermissions,
  roles,
  securityEvents,
  sessions,
  users,
  userRoles,
} from "../../shared/schema.js";
import { requireAdminPermission } from "../custom-auth.js";
import { db } from "../db.js";
import { env } from "../env.js";

const count = sql<number>`count(*)::int`;
const leadStages = [
  "new",
  "reviewing",
  "qualified",
  "discovery",
  "proposal",
  "negotiation",
  "won",
  "lost",
] as const;
const workflowStates = [
  "draft",
  "in_review",
  "approved",
  "scheduled",
  "published",
  "archived",
] as const;

const contentInputSchema = z
  .object({
    title: z.string().trim().min(1).max(300),
    slug: z
      .string()
      .trim()
      .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)
      .max(240),
    excerpt: z.string().trim().min(1).max(2000),
    content: z.string().min(1).max(1_000_000),
    category: z.string().trim().min(1).max(120),
    tags: z.array(z.string().trim().min(1).max(80)).max(30).default([]),
    featuredImage: z.string().url().nullable().optional(),
    isPremium: z.boolean().default(false),
    readTimeMinutes: z.number().int().min(1).max(240).default(5),
    seoTitle: z.string().trim().max(70).nullable().optional(),
    seoDescription: z.string().trim().max(170).nullable().optional(),
    canonicalUrl: z.string().url().nullable().optional(),
    ogImage: z.string().url().nullable().optional(),
    visibility: z.enum(["public", "unlisted", "private"]).default("public"),
    changeSummary: z.string().trim().max(500).optional(),
  })
  .strict();

function can(request: Express.Request, permission: string) {
  return (
    !request.securityPrincipal ||
    request.securityPrincipal.permissions.includes(permission)
  );
}

const updateLeadSchema = z
  .object({
    stage: z.enum(leadStages).optional(),
    priority: z.enum(["low", "normal", "high", "urgent"]).optional(),
    qualificationScore: z.number().int().min(0).max(100).optional(),
    estimatedValue: z
      .union([
        z.number().nonnegative(),
        z.string().regex(/^\d+(?:\.\d{1,2})?$/),
        z.null(),
      ])
      .optional(),
    currency: z
      .string()
      .length(3)
      .transform((value) => value.toUpperCase())
      .optional(),
    probability: z.number().int().min(0).max(100).optional(),
    nextAction: z.string().trim().max(2000).nullable().optional(),
    followUpAt: z.string().datetime().nullable().optional(),
    lostReason: z.string().trim().max(2000).nullable().optional(),
    serviceInterest: z.string().trim().max(180).nullable().optional(),
    budgetRange: z.string().trim().max(120).nullable().optional(),
    expectedTimeline: z.string().trim().max(120).nullable().optional(),
    organization: z.string().trim().max(220).nullable().optional(),
    industry: z.string().trim().max(160).nullable().optional(),
    country: z.string().trim().max(120).nullable().optional(),
  })
  .strict()
  .superRefine((value, context) => {
    if (value.stage === "lost" && !value.lostReason)
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["lostReason"],
        message: "A lost reason is required",
      });
  });

export function createAdminRouter(): Router {
  const router = Router();

  router.get(
    "/api/admin/content/posts",
    requireAdminPermission("content.read"),
    async (_request, response) => {
      response.setHeader("Cache-Control", "no-store");
      response.json(
        await db
          .select()
          .from(blogPosts)
          .orderBy(desc(blogPosts.updatedAt))
          .limit(500),
      );
    },
  );

  router.post(
    "/api/admin/content/posts",
    requireAdminPermission("content.create"),
    async (request, response) => {
      const { changeSummary, ...input } = contentInputSchema.parse(
        request.body,
      );
      const post = await db.transaction(async (transaction) => {
        const [created] = await transaction
          .insert(blogPosts)
          .values({
            ...input,
            isPublished: false,
            publishedAt: null,
            workflowStatus: "draft",
            authorId: request.securityPrincipal?.userId ?? null,
            currentVersion: 1,
          })
          .returning();
        await transaction.insert(contentVersions).values({
          postId: created.id,
          version: 1,
          snapshot: created,
          changeSummary: changeSummary || "Initial draft",
          createdBy: request.securityPrincipal?.userId ?? null,
        });
        await transaction.insert(auditEvents).values({
          actorUserId: request.securityPrincipal?.userId ?? null,
          actorSessionId: request.securityPrincipal?.sessionId ?? null,
          action: "content.create",
          resourceType: "blog_post",
          resourceId: created.id,
          result: "success",
          requestId: request.requestId,
          newState: created,
        });
        return created;
      });
      response.status(201).json(post);
    },
  );

  router.patch(
    "/api/admin/content/posts/:id",
    requireAdminPermission("content.update"),
    async (request, response) => {
      const { changeSummary, ...input } = contentInputSchema.parse(
        request.body,
      );
      const post = await db.transaction(async (transaction) => {
        const [previous] = await transaction
          .select()
          .from(blogPosts)
          .where(eq(blogPosts.id, request.params.id))
          .limit(1);
        if (!previous) return undefined;
        if (previous.workflowStatus !== "draft") return null;
        const nextVersion = previous.currentVersion + 1;
        const [updated] = await transaction
          .update(blogPosts)
          .set({
            ...input,
            editorId: request.securityPrincipal?.userId ?? null,
            currentVersion: nextVersion,
            updatedAt: new Date(),
          })
          .where(eq(blogPosts.id, previous.id))
          .returning();
        await transaction.insert(contentVersions).values({
          postId: updated.id,
          version: nextVersion,
          snapshot: updated,
          changeSummary: changeSummary || "Content updated",
          createdBy: request.securityPrincipal?.userId ?? null,
        });
        await transaction.insert(auditEvents).values({
          actorUserId: request.securityPrincipal?.userId ?? null,
          actorSessionId: request.securityPrincipal?.sessionId ?? null,
          action: "content.update",
          resourceType: "blog_post",
          resourceId: updated.id,
          result: "success",
          requestId: request.requestId,
          previousState: previous,
          newState: updated,
        });
        return updated;
      });
      if (post === undefined)
        return response.status(404).json({ message: "Post not found" });
      if (post === null)
        return response
          .status(409)
          .json({
            message:
              "Only drafts can be edited; return the item to draft first",
          });
      response.json(post);
    },
  );

  router.get(
    "/api/admin/content/posts/:id/versions",
    requireAdminPermission("content.read"),
    async (request, response) => {
      response.json(
        await db
          .select({
            id: contentVersions.id,
            version: contentVersions.version,
            changeSummary: contentVersions.changeSummary,
            createdBy: contentVersions.createdBy,
            createdAt: contentVersions.createdAt,
          })
          .from(contentVersions)
          .where(eq(contentVersions.postId, request.params.id))
          .orderBy(desc(contentVersions.version))
          .limit(200),
      );
    },
  );

  router.post(
    "/api/admin/content/posts/:id/transition",
    requireAdminPermission("content.read"),
    async (request, response) => {
      const input = z
        .object({
          action: z.enum([
            "submit_review",
            "return_draft",
            "approve",
            "schedule",
            "publish",
            "archive",
            "restore",
          ]),
          scheduledAt: z.string().datetime().optional(),
          justification: z.string().trim().max(1000).optional(),
        })
        .strict()
        .parse(request.body);
      const policy = {
        submit_review: {
          from: ["draft"],
          to: "in_review",
          permission: "content.update",
        },
        return_draft: {
          from: ["in_review", "approved", "scheduled"],
          to: "draft",
          permission: "content.update",
        },
        approve: {
          from: ["in_review"],
          to: "approved",
          permission: "content.approve",
        },
        schedule: {
          from: ["approved"],
          to: "scheduled",
          permission: "content.publish",
        },
        publish: {
          from: ["approved", "scheduled"],
          to: "published",
          permission: "content.publish",
        },
        archive: {
          from: ["draft", "in_review", "approved", "scheduled", "published"],
          to: "archived",
          permission: "content.delete",
        },
        restore: {
          from: ["archived"],
          to: "draft",
          permission: "content.update",
        },
      }[input.action];
      if (!can(request, policy.permission))
        return response.status(403).json({ message: "Forbidden" });
      if (
        input.action === "archive" &&
        (!input.justification || input.justification.length < 8)
      )
        return response
          .status(400)
          .json({
            message: "Archive justification must contain at least 8 characters",
          });
      const scheduledAt = input.scheduledAt
        ? new Date(input.scheduledAt)
        : null;
      if (
        input.action === "schedule" &&
        (!scheduledAt || scheduledAt <= new Date())
      )
        return response
          .status(400)
          .json({ message: "A future schedule time is required" });
      const post = await db.transaction(async (transaction) => {
        const [previous] = await transaction
          .select()
          .from(blogPosts)
          .where(eq(blogPosts.id, request.params.id))
          .limit(1);
        if (!previous) return undefined;
        if (!policy.from.includes(previous.workflowStatus)) return null;
        const now = new Date();
        const nextVersion = previous.currentVersion + 1;
        const [updated] = await transaction
          .update(blogPosts)
          .set({
            workflowStatus: policy.to,
            isPublished: policy.to === "published",
            publishedAt:
              policy.to === "published"
                ? now
                : policy.to === "archived"
                  ? previous.publishedAt
                  : null,
            scheduledAt: policy.to === "scheduled" ? scheduledAt : null,
          approvedAt:
            policy.to === "approved"
              ? now
              : policy.to === "draft"
                ? null
                : previous.approvedAt,
          approverId:
            policy.to === "approved"
              ? (request.securityPrincipal?.userId ?? null)
              : policy.to === "draft"
                ? null
                : previous.approverId,
            archivedAt: policy.to === "archived" ? now : null,
            currentVersion: nextVersion,
            updatedAt: now,
          })
          .where(eq(blogPosts.id, previous.id))
          .returning();
        await transaction.insert(contentVersions).values({
          postId: updated.id,
          version: nextVersion,
          snapshot: updated,
          changeSummary: `Workflow: ${previous.workflowStatus} → ${policy.to}`,
          createdBy: request.securityPrincipal?.userId ?? null,
        });
        await transaction.insert(auditEvents).values({
          actorUserId: request.securityPrincipal?.userId ?? null,
          actorSessionId: request.securityPrincipal?.sessionId ?? null,
          action: `content.${input.action}`,
          resourceType: "blog_post",
          resourceId: updated.id,
          result: "success",
          requestId: request.requestId,
          justification: input.justification,
          previousState: { workflowStatus: previous.workflowStatus },
          newState: { workflowStatus: policy.to, scheduledAt },
        });
        return updated;
      });
      if (post === undefined)
        return response.status(404).json({ message: "Post not found" });
      if (post === null)
        return response
          .status(409)
          .json({ message: "Invalid workflow transition" });
      response.json(post);
    },
  );

  router.get("/api/internal/content-scheduler", async (request, response) => {
    if (
      !env.CRON_SECRET ||
      request.headers.authorization !== `Bearer ${env.CRON_SECRET}`
    )
      return response.status(403).json({ message: "Forbidden" });
    const now = new Date();
    const published = await db.transaction(async (transaction) => {
      const due = await transaction
        .select()
        .from(blogPosts)
        .where(
          and(
            eq(blogPosts.workflowStatus, "scheduled"),
            lte(blogPosts.scheduledAt, now),
          ),
        )
        .limit(100);
      for (const previous of due) {
        const [updated] = await transaction
          .update(blogPosts)
          .set({
            workflowStatus: "published",
            isPublished: true,
            publishedAt: now,
            scheduledAt: null,
            currentVersion: sql`${blogPosts.currentVersion} + 1`,
            updatedAt: now,
          })
          .where(
            and(
              eq(blogPosts.id, previous.id),
              eq(blogPosts.workflowStatus, "scheduled"),
              lte(blogPosts.scheduledAt, now),
            ),
          )
          .returning();
        if (!updated) continue;
        await transaction
          .insert(contentVersions)
          .values({
            postId: updated.id,
            version: updated.currentVersion,
            snapshot: updated,
            changeSummary: "Published by scheduler",
          });
        await transaction
          .insert(auditEvents)
          .values({
            action: "content.scheduled_publish",
            resourceType: "blog_post",
            resourceId: updated.id,
            result: "success",
            newState: { workflowStatus: "published" },
          });
      }
      return due.length;
    });
    response.json({ published });
  });

  router.get(
    "/api/admin/leads",
    requireAdminPermission("leads.read"),
    async (request, response) => {
      const search =
        typeof request.query.search === "string"
          ? request.query.search.trim().slice(0, 120)
          : "";
      const stage =
        typeof request.query.stage === "string" &&
        leadStages.includes(request.query.stage as (typeof leadStages)[number])
          ? request.query.stage
          : undefined;
      const filters = [
        isNull(leads.archivedAt),
        ...(stage ? [eq(leads.stage, stage)] : []),
        ...(search
          ? [
              or(
                ilike(leads.name, `%${search}%`),
                ilike(leads.email, `%${search}%`),
                ilike(leads.organization, `%${search}%`),
                ilike(leads.serviceInterest, `%${search}%`),
              )!,
            ]
          : []),
      ];
      const records = await db
        .select()
        .from(leads)
        .where(and(...filters))
        .orderBy(desc(leads.updatedAt))
        .limit(500);
      const canViewFinancial =
        !request.securityPrincipal ||
        request.securityPrincipal.permissions.includes(
          "pipeline.financial.read",
        );
      response.setHeader("Cache-Control", "no-store");
      response.json(
        records.map((record) =>
          canViewFinancial ? record : { ...record, estimatedValue: null },
        ),
      );
    },
  );

  router.get(
    "/api/admin/leads/:id/activities",
    requireAdminPermission("leads.read"),
    async (request, response) => {
      response.json(
        await db
          .select()
          .from(leadActivities)
          .where(eq(leadActivities.leadId, request.params.id))
          .orderBy(desc(leadActivities.createdAt))
          .limit(200),
      );
    },
  );

  router.patch(
    "/api/admin/leads/:id",
    requireAdminPermission("leads.manage"),
    async (request, response) => {
      const input = updateLeadSchema.parse(request.body);
      const changes = {
        ...input,
        estimatedValue:
          input.estimatedValue === undefined
            ? undefined
            : input.estimatedValue === null
              ? null
              : String(input.estimatedValue),
        followUpAt:
          input.followUpAt === undefined
            ? undefined
            : input.followUpAt === null
              ? null
              : new Date(input.followUpAt),
        updatedAt: new Date(),
      };
      const updated = await db.transaction(async (transaction) => {
        const [previous] = await transaction
          .select()
          .from(leads)
          .where(eq(leads.id, request.params.id))
          .limit(1);
        if (!previous) return undefined;
        const [record] = await transaction
          .update(leads)
          .set(changes)
          .where(eq(leads.id, request.params.id))
          .returning();
        const stageChanged = input.stage && input.stage !== previous.stage;
        await transaction.insert(leadActivities).values({
          leadId: previous.id,
          actorUserId: request.securityPrincipal?.userId ?? null,
          type: stageChanged ? "stage_changed" : "updated",
          body: stageChanged
            ? `Pipeline stage changed from ${previous.stage} to ${input.stage}.`
            : "Lead details updated.",
          metadata: input,
        });
        await transaction.insert(auditEvents).values({
          actorUserId: request.securityPrincipal?.userId ?? null,
          actorSessionId: request.securityPrincipal?.sessionId ?? null,
          action: stageChanged ? "lead.stage_change" : "lead.update",
          resourceType: "lead",
          resourceId: previous.id,
          result: "success",
          requestId: request.requestId,
          previousState: previous,
          newState: record,
        });
        return record;
      });
      if (!updated)
        return response.status(404).json({ message: "Lead not found" });
      response.json(updated);
    },
  );

  router.post(
    "/api/admin/leads/:id/activities",
    requireAdminPermission("leads.manage"),
    async (request, response) => {
      const input = z
        .object({
          type: z.enum(["note", "call", "email", "meeting", "task"]),
          body: z.string().trim().min(1).max(10_000),
        })
        .strict()
        .parse(request.body);
      const [lead] = await db
        .select({ id: leads.id })
        .from(leads)
        .where(eq(leads.id, request.params.id))
        .limit(1);
      if (!lead)
        return response.status(404).json({ message: "Lead not found" });
      const [activity] = await db
        .insert(leadActivities)
        .values({
          ...input,
          leadId: lead.id,
          actorUserId: request.securityPrincipal?.userId ?? null,
        })
        .returning();
      response.status(201).json(activity);
    },
  );

  router.get(
    "/api/admin/pipeline/summary",
    requireAdminPermission("leads.read"),
    async (request, response) => {
      const canViewFinancial =
        !request.securityPrincipal ||
        request.securityPrincipal.permissions.includes(
          "pipeline.financial.read",
        );
      const byStage = await db
        .select({
          stage: leads.stage,
          count,
          value: sql<string>`coalesce(sum(${leads.estimatedValue}), 0)::text`,
          weightedValue: sql<string>`coalesce(sum(${leads.estimatedValue} * ${leads.probability} / 100.0), 0)::text`,
        })
        .from(leads)
        .where(isNull(leads.archivedAt))
        .groupBy(leads.stage);
      response.setHeader("Cache-Control", "no-store");
      response.json(
        byStage.map((row) =>
          canViewFinancial ? row : { ...row, value: null, weightedValue: null },
        ),
      );
    },
  );

  router.get(
    "/api/admin/audit",
    requireAdminPermission("audit.read"),
    async (request, response) => {
      const search =
        typeof request.query.search === "string"
          ? request.query.search.trim().slice(0, 120)
          : "";
      const events = await db
        .select()
        .from(auditEvents)
        .where(
          search
            ? or(
                ilike(auditEvents.action, `%${search}%`),
                ilike(auditEvents.resourceType, `%${search}%`),
                ilike(auditEvents.resourceId, `%${search}%`),
                ilike(auditEvents.result, `%${search}%`),
              )
            : undefined,
        )
        .orderBy(desc(auditEvents.createdAt))
        .limit(500);
      response.setHeader("Cache-Control", "no-store");
      response.json(events);
    },
  );

  router.get(
    "/api/admin/security/events",
    requireAdminPermission("security.events.read"),
    async (_request, response) => {
      response.setHeader("Cache-Control", "no-store");
      response.json(
        await db
          .select()
          .from(securityEvents)
          .orderBy(desc(securityEvents.createdAt))
          .limit(500),
      );
    },
  );

  router.get(
    "/api/admin/security/sessions",
    requireAdminPermission("security.events.read"),
    async (_request, response) => {
      response.setHeader("Cache-Control", "no-store");
      response.json(
        await db
          .select({
            id: sessions.id,
            userId: sessions.userId,
            email: users.email,
            userAgent: sessions.userAgent,
            createdAt: sessions.createdAt,
            lastSeenAt: sessions.lastSeenAt,
            expiresAt: sessions.expiresAt,
            idleExpiresAt: sessions.idleExpiresAt,
            revokedAt: sessions.revokedAt,
            revokedReason: sessions.revokedReason,
          })
          .from(sessions)
          .innerJoin(users, eq(sessions.userId, users.id))
          .orderBy(desc(sessions.lastSeenAt))
          .limit(500),
      );
    },
  );

  router.post(
    "/api/admin/security/sessions/:id/revoke",
    requireAdminPermission("security.settings.manage"),
    async (request, response) => {
      const { justification } = z
        .object({ justification: z.string().trim().min(8).max(1000) })
        .strict()
        .parse(request.body);
      const revoked = await db.transaction(async (transaction) => {
        const [previous] = await transaction
          .select()
          .from(sessions)
          .where(eq(sessions.id, request.params.id))
          .limit(1);
        if (!previous) return undefined;
        if (!previous.revokedAt)
          await transaction
            .update(sessions)
            .set({ revokedAt: new Date(), revokedReason: justification })
            .where(eq(sessions.id, previous.id));
        await transaction.insert(auditEvents).values({
          actorUserId: request.securityPrincipal?.userId ?? null,
          actorSessionId: request.securityPrincipal?.sessionId ?? null,
          action: "session.revoke",
          resourceType: "session",
          resourceId: previous.id,
          result: "success",
          requestId: request.requestId,
          justification,
          previousState: { revokedAt: previous.revokedAt },
          newState: { revokedAt: new Date(), revokedReason: justification },
        });
        return previous.id;
      });
      if (!revoked)
        return response.status(404).json({ message: "Session not found" });
      response.json({ revoked: true });
    },
  );

  router.get(
    "/api/admin/users",
    requireAdminPermission("users.manage"),
    async (_request, response) => {
      const userRecords = await db
        .select({
          id: users.id,
          email: users.email,
          firstName: users.firstName,
          lastName: users.lastName,
          status: users.status,
          isAdmin: users.isAdmin,
          lastLoginAt: users.lastLoginAt,
          emailVerifiedAt: users.emailVerifiedAt,
          createdAt: users.createdAt,
        })
        .from(users)
        .orderBy(desc(users.createdAt))
        .limit(500);
      const assignments = await db
        .select({
          userId: userRoles.userId,
          roleKey: roles.key,
          roleName: roles.name,
        })
        .from(userRoles)
        .innerJoin(roles, eq(userRoles.roleId, roles.id));
      response.setHeader("Cache-Control", "no-store");
      response.json(
        userRecords.map((user) => ({
          ...user,
          roles: assignments
            .filter((item) => item.userId === user.id)
            .map((item) => ({ key: item.roleKey, name: item.roleName })),
        })),
      );
    },
  );

  router.get(
    "/api/admin/roles",
    requireAdminPermission("users.manage"),
    async (_request, response) => {
      const roleRecords = await db.select().from(roles).orderBy(roles.name);
      const grants = await db
        .select({
          roleId: rolePermissions.roleId,
          permissionKey: permissions.key,
        })
        .from(rolePermissions)
        .innerJoin(
          permissions,
          eq(rolePermissions.permissionId, permissions.id),
        );
      response.json(
        roleRecords.map((role) => ({
          ...role,
          permissions: grants
            .filter((item) => item.roleId === role.id)
            .map((item) => item.permissionKey),
        })),
      );
    },
  );

  router.patch(
    "/api/admin/users/:id/status",
    requireAdminPermission("users.manage"),
    async (request, response) => {
      const input = z
        .object({
          status: z.enum(["active", "disabled"]),
          justification: z.string().trim().min(8).max(1000),
        })
        .strict()
        .parse(request.body);
      if (
        request.securityPrincipal?.userId === request.params.id &&
        input.status === "disabled"
      )
        return response
          .status(409)
          .json({ message: "You cannot disable your own account" });
      const updated = await db.transaction(async (transaction) => {
        const [previous] = await transaction
          .select()
          .from(users)
          .where(eq(users.id, request.params.id))
          .limit(1);
        if (!previous) return undefined;
        const [record] = await transaction
          .update(users)
          .set({
            status: input.status,
            securityVersion: previous.securityVersion + 1,
            updatedAt: new Date(),
          })
          .where(eq(users.id, previous.id))
          .returning();
        if (input.status === "disabled")
          await transaction
            .update(sessions)
            .set({ revokedAt: new Date(), revokedReason: input.justification })
            .where(
              and(eq(sessions.userId, previous.id), isNull(sessions.revokedAt)),
            );
        await transaction.insert(auditEvents).values({
          actorUserId: request.securityPrincipal?.userId ?? null,
          actorSessionId: request.securityPrincipal?.sessionId ?? null,
          action: `user.${input.status}`,
          resourceType: "user",
          resourceId: previous.id,
          result: "success",
          justification: input.justification,
          requestId: request.requestId,
          previousState: { status: previous.status },
          newState: { status: input.status },
        });
        return record;
      });
      if (!updated)
        return response.status(404).json({ message: "User not found" });
      response.json({ id: updated.id, status: updated.status });
    },
  );

  router.put(
    "/api/admin/users/:id/roles",
    requireAdminPermission("users.manage"),
    async (request, response) => {
      const input = z
        .object({
          roleKeys: z.array(z.string().min(1).max(80)).min(1).max(20),
          justification: z.string().trim().min(8).max(1000),
        })
        .strict()
        .parse(request.body);
      const uniqueRoleKeys = [...new Set(input.roleKeys)];
      const result = await db.transaction(async (transaction) => {
        const [target] = await transaction
          .select({ id: users.id })
          .from(users)
          .where(eq(users.id, request.params.id))
          .limit(1);
        if (!target) return { outcome: "missing" as const };
        const selectedRoles = await transaction
          .select()
          .from(roles)
          .where(inArray(roles.key, uniqueRoleKeys));
        if (selectedRoles.length !== uniqueRoleKeys.length)
          return { outcome: "invalid_roles" as const };
        const previousAssignments = await transaction
          .select({ key: roles.key })
          .from(userRoles)
          .innerJoin(roles, eq(userRoles.roleId, roles.id))
          .where(eq(userRoles.userId, target.id));
        const wasSuper = previousAssignments.some(
          (item) => item.key === "super_administrator",
        );
        const remainsSuper = uniqueRoleKeys.includes("super_administrator");
        if (wasSuper && !remainsSuper) {
          const [superCount] = await transaction
            .select({
              count: sql<number>`count(distinct ${userRoles.userId})::int`,
            })
            .from(userRoles)
            .innerJoin(roles, eq(userRoles.roleId, roles.id))
            .where(eq(roles.key, "super_administrator"));
          if ((superCount?.count ?? 0) <= 1)
            return { outcome: "last_super" as const };
        }
        await transaction
          .delete(userRoles)
          .where(eq(userRoles.userId, target.id));
        await transaction
          .insert(userRoles)
          .values(
            selectedRoles.map((role) => ({
              userId: target.id,
              roleId: role.id,
              assignedBy: request.securityPrincipal?.userId ?? null,
            })),
          )
          .onConflictDoNothing();
        await transaction
          .update(users)
          .set({
            securityVersion: sql`${users.securityVersion} + 1`,
            updatedAt: new Date(),
          })
          .where(eq(users.id, target.id));
        await transaction
          .update(sessions)
          .set({ revokedAt: new Date(), revokedReason: "roles_changed" })
          .where(
            and(eq(sessions.userId, target.id), isNull(sessions.revokedAt)),
          );
        await transaction.insert(auditEvents).values({
          actorUserId: request.securityPrincipal?.userId ?? null,
          actorSessionId: request.securityPrincipal?.sessionId ?? null,
          action: "user.roles_update",
          resourceType: "user",
          resourceId: target.id,
          result: "success",
          justification: input.justification,
          requestId: request.requestId,
          previousState: { roles: previousAssignments.map((item) => item.key) },
          newState: { roles: uniqueRoleKeys },
        });
        return { outcome: "updated" as const, roleKeys: uniqueRoleKeys };
      });
      if (result.outcome === "missing")
        return response.status(404).json({ message: "User not found" });
      if (result.outcome === "invalid_roles")
        return response
          .status(400)
          .json({ message: "One or more roles are invalid" });
      if (result.outcome === "last_super")
        return response
          .status(409)
          .json({
            message: "The final super administrator role cannot be removed",
          });
      response.json(result);
    },
  );

  router.get(
    "/api/admin/contacts",
    requireAdminPermission("leads.read"),
    async (request, response) => {
      const search =
        typeof request.query.search === "string"
          ? request.query.search.trim().slice(0, 120)
          : "";
      const unreadOnly = request.query.status === "unread";
      const filters = [
        ...(unreadOnly ? [eq(contactRequests.isRead, false)] : []),
        ...(search
          ? [
              or(
                ilike(contactRequests.name, `%${search}%`),
                ilike(contactRequests.email, `%${search}%`),
                ilike(contactRequests.message, `%${search}%`),
              )!,
            ]
          : []),
      ];
      const contacts = await db
        .select()
        .from(contactRequests)
        .where(filters.length ? and(...filters) : undefined)
        .orderBy(desc(contactRequests.createdAt))
        .limit(200);
      response.setHeader("Cache-Control", "no-store");
      response.json(contacts);
    },
  );

  router.patch(
    "/api/admin/contacts/:id",
    requireAdminPermission("leads.manage"),
    async (request, response) => {
      const { isRead } = z
        .object({ isRead: z.boolean() })
        .strict()
        .parse(request.body);
      const contact = await db.transaction(async (transaction) => {
        const [previous] = await transaction
          .select()
          .from(contactRequests)
          .where(eq(contactRequests.id, request.params.id))
          .limit(1);
        if (!previous) return undefined;
        const [updated] = await transaction
          .update(contactRequests)
          .set({ isRead })
          .where(eq(contactRequests.id, request.params.id))
          .returning();
        await transaction.insert(auditEvents).values({
          actorUserId: request.securityPrincipal?.userId ?? null,
          actorSessionId: request.securityPrincipal?.sessionId ?? null,
          action: isRead ? "contact.mark_read" : "contact.mark_unread",
          resourceType: "contact_request",
          resourceId: request.params.id,
          result: "success",
          requestId: request.requestId,
          previousState: { isRead: previous.isRead },
          newState: { isRead },
        });
        return updated;
      });
      if (!contact)
        return response.status(404).json({ message: "Contact not found" });
      response.json(contact);
    },
  );

  router.get(
    "/api/admin/subscribers",
    requireAdminPermission("email.delivery.read"),
    async (request, response) => {
      const search =
        typeof request.query.search === "string"
          ? request.query.search.trim().slice(0, 120)
          : "";
      const activeOnly = request.query.status === "active";
      const filters = [
        ...(activeOnly ? [eq(newsletterSubscribers.isActive, true)] : []),
        ...(search
          ? [
              or(
                ilike(newsletterSubscribers.email, `%${search}%`),
                ilike(newsletterSubscribers.name, `%${search}%`),
              )!,
            ]
          : []),
      ];
      const subscribers = await db
        .select()
        .from(newsletterSubscribers)
        .where(filters.length ? and(...filters) : undefined)
        .orderBy(desc(newsletterSubscribers.subscribedAt))
        .limit(500);
      response.setHeader("Cache-Control", "no-store");
      response.json(subscribers);
    },
  );

  router.patch(
    "/api/admin/subscribers/:id",
    requireAdminPermission("notifications.manage"),
    async (request, response) => {
      const { isActive } = z
        .object({ isActive: z.boolean() })
        .strict()
        .parse(request.body);
      const subscriber = await db.transaction(async (transaction) => {
        const [previous] = await transaction
          .select()
          .from(newsletterSubscribers)
          .where(eq(newsletterSubscribers.id, request.params.id))
          .limit(1);
        if (!previous) return undefined;
        const [updated] = await transaction
          .update(newsletterSubscribers)
          .set({
            isActive,
            unsubscribedAt: isActive ? null : new Date(),
          })
          .where(eq(newsletterSubscribers.id, request.params.id))
          .returning();
        await transaction.insert(auditEvents).values({
          actorUserId: request.securityPrincipal?.userId ?? null,
          actorSessionId: request.securityPrincipal?.sessionId ?? null,
          action: isActive ? "subscriber.reactivate" : "subscriber.deactivate",
          resourceType: "newsletter_subscriber",
          resourceId: request.params.id,
          result: "success",
          requestId: request.requestId,
          previousState: { isActive: previous.isActive },
          newState: { isActive },
        });
        return updated;
      });
      if (!subscriber)
        return response.status(404).json({ message: "Subscriber not found" });
      response.json(subscriber);
    },
  );

  router.get(
    "/api/admin/overview",
    requireAdminPermission("analytics.read"),
    async (request, response) => {
      const now = new Date();
      const userId = request.securityPrincipal?.userId;
      const [
        [posts],
        [publishedPosts],
        [projects],
        [featuredProjects],
        [subscribers],
        [activeSubscribers],
        [contacts],
        [unreadContacts],
        [pendingEmail],
        [failedEmail],
        [scheduledCampaigns],
        [activeSessions],
        inboxResult,
        recentContacts,
        recentEmail,
        [openLeads],
        [qualifiedLeads],
        [dueFollowUps],
        [pipelineValue],
      ] = await Promise.all([
        db.select({ count }).from(blogPosts),
        db
          .select({ count })
          .from(blogPosts)
          .where(eq(blogPosts.isPublished, true)),
        db.select({ count }).from(portfolioProjects),
        db
          .select({ count })
          .from(portfolioProjects)
          .where(eq(portfolioProjects.featured, true)),
        db.select({ count }).from(newsletterSubscribers),
        db
          .select({ count })
          .from(newsletterSubscribers)
          .where(eq(newsletterSubscribers.isActive, true)),
        db.select({ count }).from(contactRequests),
        db
          .select({ count })
          .from(contactRequests)
          .where(eq(contactRequests.isRead, false)),
        db
          .select({ count })
          .from(emailOutbox)
          .where(
            sql`${emailOutbox.status} in ('pending', 'retry', 'processing')`,
          ),
        db
          .select({ count })
          .from(emailOutbox)
          .where(
            sql`${emailOutbox.status} in ('failed', 'bounced', 'complained')`,
          ),
        db
          .select({ count })
          .from(notificationCampaigns)
          .where(eq(notificationCampaigns.status, "scheduled")),
        db
          .select({ count })
          .from(sessions)
          .where(and(isNull(sessions.revokedAt), gt(sessions.expiresAt, now))),
        userId
          ? db
              .select({ count })
              .from(notificationInbox)
              .where(
                and(
                  eq(notificationInbox.userId, userId),
                  isNull(notificationInbox.readAt),
                  isNull(notificationInbox.archivedAt),
                ),
              )
          : Promise.resolve([{ count: 0 }]),
        db
          .select({
            id: contactRequests.id,
            name: contactRequests.name,
            email: contactRequests.email,
            projectType: contactRequests.projectType,
            isRead: contactRequests.isRead,
            createdAt: contactRequests.createdAt,
          })
          .from(contactRequests)
          .orderBy(desc(contactRequests.createdAt))
          .limit(5),
        db
          .select({
            id: emailOutbox.id,
            recipient: emailOutbox.toEmail,
            subject: emailOutbox.subject,
            status: emailOutbox.status,
            createdAt: emailOutbox.createdAt,
          })
          .from(emailOutbox)
          .orderBy(desc(emailOutbox.createdAt))
          .limit(5),
        db
          .select({ count })
          .from(leads)
          .where(
            and(
              isNull(leads.archivedAt),
              sql`${leads.stage} not in ('won', 'lost')`,
            ),
          ),
        db
          .select({ count })
          .from(leads)
          .where(
            and(
              isNull(leads.archivedAt),
              sql`${leads.stage} in ('qualified','discovery','proposal','negotiation')`,
            ),
          ),
        db
          .select({ count })
          .from(leads)
          .where(
            and(
              isNull(leads.archivedAt),
              lte(leads.followUpAt, now),
              sql`${leads.stage} not in ('won', 'lost')`,
            ),
          ),
        db
          .select({
            value: sql<string>`coalesce(sum(${leads.estimatedValue} * ${leads.probability} / 100.0), 0)::text`,
          })
          .from(leads)
          .where(
            and(
              isNull(leads.archivedAt),
              sql`${leads.stage} not in ('won', 'lost')`,
            ),
          ),
      ]);

      response.setHeader("Cache-Control", "no-store");
      response.json({
        content: {
          posts: posts?.count ?? 0,
          publishedPosts: publishedPosts?.count ?? 0,
          draftPosts: Math.max(
            0,
            (posts?.count ?? 0) - (publishedPosts?.count ?? 0),
          ),
          projects: projects?.count ?? 0,
          featuredProjects: featuredProjects?.count ?? 0,
        },
        audience: {
          subscribers: subscribers?.count ?? 0,
          activeSubscribers: activeSubscribers?.count ?? 0,
          contacts: contacts?.count ?? 0,
          unreadContacts: unreadContacts?.count ?? 0,
        },
        delivery: {
          pendingEmail: pendingEmail?.count ?? 0,
          failedEmail: failedEmail?.count ?? 0,
          scheduledCampaigns: scheduledCampaigns?.count ?? 0,
          unreadNotifications: inboxResult[0]?.count ?? 0,
        },
        security: { activeSessions: activeSessions?.count ?? 0 },
        pipeline: {
          openLeads: openLeads?.count ?? 0,
          qualifiedLeads: qualifiedLeads?.count ?? 0,
          dueFollowUps: dueFollowUps?.count ?? 0,
          weightedValue:
            !request.securityPrincipal ||
            request.securityPrincipal.permissions.includes(
              "pipeline.financial.read",
            )
              ? (pipelineValue?.value ?? "0")
              : null,
        },
        providers: {
          email:
            env.EMAIL_PROVIDER === "postmark" &&
            Boolean(env.POSTMARK_SERVER_TOKEN),
          sms: Boolean(
            env.TWILIO_ACCOUNT_SID &&
            env.TWILIO_AUTH_TOKEN &&
            env.TWILIO_SMS_FROM,
          ),
          whatsapp: Boolean(
            env.TWILIO_ACCOUNT_SID &&
            env.TWILIO_AUTH_TOKEN &&
            env.TWILIO_WHATSAPP_FROM,
          ),
          push: Boolean(
            env.VAPID_SUBJECT && env.VAPID_PUBLIC_KEY && env.VAPID_PRIVATE_KEY,
          ),
        },
        recent: { contacts: recentContacts, email: recentEmail },
        generatedAt: now.toISOString(),
      });
    },
  );

  return router;
}
