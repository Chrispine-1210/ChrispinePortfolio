import { createHash, randomUUID } from "node:crypto";
import { and, asc, count, desc, eq, gte, isNull, ne, sql } from "drizzle-orm";
import { Router, type Request, type Response } from "express";
import { z, ZodError } from "zod";
import {
  auditEvents,
  engineeringPublications,
  engineeringRecords,
  engineeringRequests,
  engineeringVersions,
  users,
} from "../../shared/schema.js";
import {
  contexts,
  detailSchemas,
  mediaReference,
  publicationInput,
  recordInput,
  recordKinds,
  topics,
} from "../../shared/engineering.js";
import { db } from "../db.js";
import { env } from "../env.js";
import { requireAdminPermission } from "../custom-auth.js";
import { requirePermission } from "../security/session-middleware.js";
import { ApiError, asyncHandler } from "../middleware.js";

type Transaction = Parameters<Parameters<typeof db.transaction>[0]>[0];
type Entry = typeof engineeringRecords.$inferSelect;
const privateProjection = ({ ownerUserId: _owner, ...row }: Entry) => row;
const saveInput = z
  .object({
    record: recordInput,
    expectedVersion: z.number().int().positive().optional(),
    requestKey: z.string().uuid(),
  })
  .strict();
const actionInput = z
  .object({
    expectedVersion: z.number().int().positive(),
    requestKey: z.string().uuid(),
    justification: z.string().trim().min(8).max(500),
  })
  .strict();
const listInput = z
  .object({
    context: z.enum(contexts).default("personal"),
    kind: z.enum(recordKinds).optional(),
    q: z.string().trim().max(120).default(""),
    limit: z.coerce.number().int().min(1).max(100).default(60),
    offset: z.coerce.number().int().min(0).max(10000).default(0),
  })
  .strict();
const today = () =>
  new Intl.DateTimeFormat("en-CA", {
    timeZone: "Africa/Blantyre",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
function requireOrigin(req: Request) {
  const expected = env.APP_BASE_URL
    ? new URL(env.APP_BASE_URL).origin
    : env.NODE_ENV !== "production"
      ? `${req.protocol}://${req.get("host")}`
      : null;
  if (!expected)
    throw new ApiError(
      503,
      "Workspace write origin is not configured",
      "ORIGIN_NOT_CONFIGURED",
    );
  if (req.get("origin") !== expected)
    throw new ApiError(403, "Request origin is not allowed", "ORIGIN_REJECTED");
  if (!req.is("application/json"))
    throw new ApiError(415, "Send application/json", "JSON_REQUIRED");
}
async function lockOwned(tx: Transaction, req: Request, id: string) {
  if (!z.string().uuid().safeParse(id).success)
    throw new ApiError(404, "Record not found");
  const [row] = await tx
    .select()
    .from(engineeringRecords)
    .where(
      and(
        eq(engineeringRecords.id, id),
        eq(engineeringRecords.ownerUserId, req.securityPrincipal!.userId),
      ),
    )
    .limit(1)
    .for("update");
  if (!row) throw new ApiError(404, "Record not found");
  return row;
}
async function audit(
  tx: Transaction,
  req: Request,
  action: string,
  entry: Entry,
  previous: Entry | null = null,
  justification?: string,
) {
  await tx
    .insert(auditEvents)
    .values({
      actorUserId: req.securityPrincipal!.userId,
      actorSessionId: req.securityPrincipal!.sessionId,
      requestId: req.requestId,
      action: `engineering.${action}`,
      resourceType: "engineering_record",
      resourceId: entry.id,
      result: "success",
      justification,
      previousState: previous
        ? { version: previous.version, status: previous.status }
        : null,
      newState: { version: entry.version, status: entry.status },
      metadata: { context: entry.context, kind: entry.kind },
    });
}
async function version(tx: Transaction, req: Request, entry: Entry) {
  await tx
    .insert(engineeringVersions)
    .values({
      recordId: entry.id,
      version: entry.version,
      snapshot: entry,
      actorUserId: req.securityPrincipal!.userId,
    });
}
async function write(
  req: Request,
  res: Response,
  input: { requestKey: string },
  handler: (tx: Transaction) => Promise<{ status: number; data: unknown }>,
) {
  requireOrigin(req);
  const actor = req.securityPrincipal!.userId;
  const fingerprint = createHash("sha256")
    .update(JSON.stringify({ method: req.method, path: req.path, input }))
    .digest("hex");
  const result = await db.transaction(async (tx) => {
    // Serializes actor writes across processes: rate limit, leases and retry receipts share the transaction.
    await tx
      .select({ id: users.id })
      .from(users)
      .where(eq(users.id, actor))
      .for("update");
    const [cached] = await tx
      .select()
      .from(engineeringRequests)
      .where(
        and(
          eq(engineeringRequests.actorUserId, actor),
          eq(engineeringRequests.requestKey, input.requestKey),
        ),
      )
      .limit(1);
    if (cached) {
      if (cached.fingerprint !== fingerprint)
        throw new ApiError(
          409,
          "This request key belongs to a different operation",
          "IDEMPOTENCY_CONFLICT",
        );
      return {
        ...(cached.response as { status: number; data: unknown }),
        replayed: true,
      };
    }
    const [rate] = await tx
      .select({ count: count() })
      .from(engineeringRequests)
      .where(
        and(
          eq(engineeringRequests.actorUserId, actor),
          gte(engineeringRequests.createdAt, new Date(Date.now() - 60000)),
        ),
      );
    if (rate.count >= 60)
      throw new ApiError(
        429,
        "Too many workspace changes; retry in a minute",
        "RATE_LIMITED",
      );
    const response = await handler(tx);
    await tx
      .insert(engineeringRequests)
      .values({
        actorUserId: actor,
        requestKey: input.requestKey,
        fingerprint,
        response,
      });
    return { ...response, replayed: false };
  });
  res.setHeader("Idempotency-Replayed", String(result.replayed));
  if (result.status === 429) res.setHeader("Retry-After", "60");
  res.status(result.status).json(result.data);
}
async function validateLinks(
  tx: Transaction,
  req: Request,
  input: z.infer<typeof recordInput>,
  id?: string,
) {
  const details = detailSchemas[input.kind].parse(input.details) as Record<
    string,
    unknown
  >;
  const links = [
    ...new Set([
      ...((details.dependencies as string[]) ?? []),
      ...((details.relatedEntries as string[]) ?? []),
      ...((details.actionEntries as string[]) ?? []),
      ...(details.assetId ? [String(details.assetId)] : []),
    ]),
  ];
  for (const link of links) {
    if (link === id)
      throw new ApiError(409, "A record cannot depend on itself");
    const [row] = await tx
      .select()
      .from(engineeringRecords)
      .where(
        and(
          eq(engineeringRecords.id, link),
          eq(engineeringRecords.ownerUserId, req.securityPrincipal!.userId),
          eq(engineeringRecords.context, input.context),
        ),
      )
      .limit(1);
    if (!row || row.status === "archived")
      throw new ApiError(400, "A linked record is unavailable in this context");
    if (
      input.kind === "security_event" &&
      (row.kind !== "asset" || row.details.authorized !== true)
    )
      throw new ApiError(
        403,
        "Monitoring evidence requires an explicitly authorized asset",
      );
    if ((details.dependencies || details.actionEntries) && row.kind !== "task")
      throw new ApiError(
        400,
        "Dependencies and meeting actions must link to tasks",
      );
    if (
      input.kind === "task" &&
      input.status === "done" &&
      row.status !== "done"
    )
      throw new ApiError(409, "Complete prerequisite tasks before delivery");
  }
  if (input.kind === "task" && id && input.status !== "done") {
    const [dependent] = await tx
      .select({ id: engineeringRecords.id })
      .from(engineeringRecords)
      .where(
        and(
          eq(engineeringRecords.ownerUserId, req.securityPrincipal!.userId),
          eq(engineeringRecords.context, input.context),
          eq(engineeringRecords.kind, "task"),
          eq(engineeringRecords.status, "done"),
          sql`${engineeringRecords.details}->'dependencies' @> ${JSON.stringify([id])}::jsonb`,
        ),
      )
      .limit(1);
    if (dependent)
      throw new ApiError(
        409,
        "Reopen completed dependent tasks before changing prerequisite completion",
      );
  }
  if (
    input.kind === "task" &&
    id &&
    (details.dependencies as string[])?.length
  ) {
    const tasks = await tx
      .select({
        id: engineeringRecords.id,
        details: engineeringRecords.details,
      })
      .from(engineeringRecords)
      .where(
        and(
          eq(engineeringRecords.ownerUserId, req.securityPrincipal!.userId),
          eq(engineeringRecords.context, input.context),
          eq(engineeringRecords.kind, "task"),
        ),
      )
      .limit(501);
    if (tasks.length > 500)
      throw new ApiError(
        409,
        "Dependency graph requires an administrative review before adding links",
      );
    const graph = new Map(
      tasks.map((t) => [t.id, (t.details.dependencies as string[]) ?? []]),
    );
    graph.set(id, details.dependencies as string[]);
    const visiting = new Set<string>(),
      done = new Set<string>();
    const cycle = (node: string): boolean => {
      if (visiting.has(node)) return true;
      if (done.has(node)) return false;
      visiting.add(node);
      if ((graph.get(node) ?? []).some(cycle)) return true;
      visiting.delete(node);
      done.add(node);
      return false;
    };
    if (cycle(id))
      throw new ApiError(409, "Task dependencies would create a cycle");
  }
  if (input.kind === "work_log" && input.status !== "archived") {
    const [total] = await tx
      .select({
        minutes: sql<number>`coalesce(sum((${engineeringRecords.details}->>'minutes')::int),0)`,
      })
      .from(engineeringRecords)
      .where(
        and(
          eq(engineeringRecords.ownerUserId, req.securityPrincipal!.userId),
          eq(engineeringRecords.workDate, input.workDate),
          eq(engineeringRecords.kind, "work_log"),
          ne(engineeringRecords.status, "archived"),
          id ? ne(engineeringRecords.id, id) : undefined,
        ),
      );
    if (Number(total.minutes) + Number(details.minutes) > 1440)
      throw new ApiError(
        409,
        "Daily recorded work exceeds 24 hours across your contexts",
      );
  }
  return details;
}
function publicSnapshot(row: typeof engineeringPublications.$inferSelect) {
  const s = row.snapshot as Record<string, unknown>;
  return {
    id: row.id,
    slug: row.slug,
    title: s.title,
    summary: s.summary,
    body: s.body,
    learning: s.learning,
    topic: s.topic,
    mediaUrl: s.mediaUrl,
    imageUrl: s.imageUrl,
    imageAlt: s.imageAlt,
    evidenceLevel: s.evidenceLevel,
    evidenceUrls: s.evidenceUrls,
    limitations: s.limitations,
    publishedAt: row.publishedAt,
  };
}

export function createEngineeringRouter() {
  const router = Router();
  router.get(
    "/api/journey",
    asyncHandler(async (req, res) => {
      const query = z
        .object({
          topic: z.enum(topics).optional(),
          limit: z.coerce.number().int().min(1).max(24).default(12),
          offset: z.coerce.number().int().min(0).max(10000).default(0),
        })
        .strict()
        .parse(req.query);
      const filter = and(
        isNull(engineeringPublications.withdrawnAt),
        query.topic
          ? sql`${engineeringPublications.snapshot}->>'topic' = ${query.topic}`
          : undefined,
      );
      const rows = await db
        .select()
        .from(engineeringPublications)
        .where(filter)
        .orderBy(
          desc(engineeringPublications.publishedAt),
          desc(engineeringPublications.id),
        )
        .limit(query.limit + 1)
        .offset(query.offset);
      res.setHeader("Cache-Control", "no-store");
      res.json({
        data: rows.slice(0, query.limit).map(publicSnapshot),
        hasMore: rows.length > query.limit,
      });
    }),
  );
  router.get(
    "/api/journey/:slug",
    asyncHandler(async (req, res) => {
      const slug = z
        .string()
        .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)
        .max(180)
        .parse(req.params.slug);
      const [row] = await db
        .select()
        .from(engineeringPublications)
        .where(
          and(
            eq(engineeringPublications.slug, slug),
            isNull(engineeringPublications.withdrawnAt),
          ),
        )
        .limit(1);
      res.setHeader("Cache-Control", "no-store");
      if (!row)
        return res.status(404).json({ message: "Field note not found" });
      res.json(publicSnapshot(row));
    }),
  );
  router.use(
    "/api/admin/engineering",
    (req, res, next) => {
      req.requestId ??= randomUUID();
      res.setHeader("X-Request-Id", req.requestId);
      res.setHeader("Cache-Control", "no-store");
      if (env.ADMIN_AUTH_MODE !== "database")
        return res
          .status(503)
          .json({
            message: "Engineering workspace requires database authentication",
          });
      next();
    },
    requireAdminPermission("engineering.read"),
  );
  router.get("/api/admin/engineering/connections", (_req, res) =>
    res.json({
      connections: [
        {
          name: "Aöthothe Revenue Execution",
          context: "aothothe",
          url: "https://aothothe-revenue-execution.chrispine-ala.chatgpt.site",
          access: "Owner-restricted",
          integration: "Link only · no data synchronization",
          verifiedAt: "2026-11-18",
        },
        {
          name: "Aöthothe Operating Control Center",
          context: "aothothe",
          url: "https://aothothe-operating-control.chrispine-ala.chatgpt.site",
          access: "Owner-restricted",
          integration: "Link only · no data synchronization",
          verifiedAt: "2026-11-18",
        },
        {
          name: "Aöthothe Enterprise OS",
          context: "aothothe",
          url: "https://aothothe-enterprise-os.vercel.app",
          access: "Public institutional surface",
          integration:
            "Separate application · operational status requires its own evidence",
          verifiedAt: "2026-11-18",
        },
        {
          name: "SUDERN delivery evidence",
          context: "sudern",
          url: "/portfolio/sudern-institutional-operations",
          access: "Public case study",
          integration:
            "Source and release evidence · public alias currently a canary",
          verifiedAt: "2026-11-18",
        },
      ],
      capabilities: {
        telemetry: "Not connected",
        networkBlocking: "Not connected",
        aiProvider: "Not connected",
        calendarSync: "Not connected",
        automaticMessaging: "Not connected",
      },
    }),
  );
  router.get(
    "/api/admin/engineering/records",
    asyncHandler(async (req, res) => {
      const query = listInput.parse(req.query);
      const filter = and(
        eq(engineeringRecords.ownerUserId, req.securityPrincipal!.userId),
        eq(engineeringRecords.context, query.context),
        query.kind ? eq(engineeringRecords.kind, query.kind) : undefined,
        query.q
          ? sql`position(lower(${query.q}) in lower(${engineeringRecords.title} || ' ' || ${engineeringRecords.summary})) > 0`
          : undefined,
      );
      const rows = await db
        .select()
        .from(engineeringRecords)
        .where(filter)
        .orderBy(
          desc(engineeringRecords.workDate),
          desc(engineeringRecords.updatedAt),
          desc(engineeringRecords.id),
        )
        .limit(query.limit + 1)
        .offset(query.offset);
      res.json({
        data: rows.slice(0, query.limit).map(privateProjection),
        hasMore: rows.length > query.limit,
        offset: query.offset,
      });
    }),
  );
  router.get(
    "/api/admin/engineering/brief",
    asyncHandler(async (req, res) => {
      const context = z.enum(contexts).parse(req.query.context ?? "personal"),
        workDate = today();
      const filter = and(
        eq(engineeringRecords.ownerUserId, req.securityPrincipal!.userId),
        eq(engineeringRecords.context, context),
        ne(engineeringRecords.status, "archived"),
      );
      const [metrics] = await db
        .select({
          openTasks: sql<number>`count(*) filter (where kind='task' and status<>'done')`,
          blocked: sql<number>`count(*) filter (where status='blocked')`,
          highRisks: sql<number>`count(*) filter (where kind='risk' and status<>'done' and (details->>'likelihood')::int*(details->>'impact')::int>=12)`,
          loggedMinutes: sql<number>`coalesce(sum(case when kind='work_log' and work_date=${workDate} then (details->>'minutes')::int else 0 end),0)`,
          untriagedEvents: sql<number>`count(*) filter (where kind='security_event' and status<>'done' and details->>'disposition'='untriaged')`,
          assets: sql<number>`count(*) filter (where kind='asset')`,
        })
        .from(engineeringRecords)
        .where(filter);
      const score = sql<number>`priority*10 + case when due_date<${workDate} then 25 else 0 end + case when status='blocked' then 10 else 0 end`;
      const tasks = await db
        .select({
          id: engineeringRecords.id,
          title: engineeringRecords.title,
          priority: engineeringRecords.priority,
          status: engineeringRecords.status,
          dueDate: engineeringRecords.dueDate,
          score,
        })
        .from(engineeringRecords)
        .where(
          and(
            filter,
            eq(engineeringRecords.kind, "task"),
            ne(engineeringRecords.status, "done"),
          ),
        )
        .orderBy(desc(score), asc(engineeringRecords.id))
        .limit(3);
      const recent = await db
        .select({
          id: engineeringRecords.id,
          title: engineeringRecords.title,
          kind: engineeringRecords.kind,
          status: engineeringRecords.status,
          workDate: engineeringRecords.workDate,
          updatedAt: engineeringRecords.updatedAt,
        })
        .from(engineeringRecords)
        .where(filter)
        .orderBy(desc(engineeringRecords.updatedAt))
        .limit(8);
      const dailyEffort = await db
        .select({
          date: engineeringRecords.workDate,
          minutes: sql<number>`sum((details->>'minutes')::int)`,
        })
        .from(engineeringRecords)
        .where(and(filter, eq(engineeringRecords.kind, "work_log")))
        .groupBy(engineeringRecords.workDate)
        .orderBy(desc(engineeringRecords.workDate))
        .limit(7);
      res.json({
        context,
        workDate,
        complete: true,
        method:
          "Rule-based prioritization of recorded tasks; no predictive model",
        topActions: tasks.map((r) => ({
          ...r,
          blocked: r.status === "blocked",
          overdue: Boolean(r.dueDate && r.dueDate < workDate),
          reason:
            r.status === "blocked"
              ? "Resolve the recorded blocker"
              : r.dueDate && r.dueDate < workDate
                ? "Delivery date has passed"
                : "Highest recorded priority",
        })),
        metrics: Object.fromEntries(
          Object.entries(metrics).map(([k, v]) => [k, Number(v)]),
        ),
        recent,
        dailyEffort: dailyEffort.map((r) => ({
          ...r,
          minutes: Number(r.minutes),
        })),
      });
    }),
  );
  router.get(
    "/api/admin/engineering/publications",
    asyncHandler(async (req, res) => {
      const context = z.enum(contexts).parse(req.query.context ?? "personal");
      const rows = await db
        .select({
          publication: engineeringPublications,
          currentVersion: engineeringRecords.version,
        })
        .from(engineeringPublications)
        .innerJoin(
          engineeringRecords,
          eq(engineeringRecords.id, engineeringPublications.recordId),
        )
        .where(
          and(
            eq(engineeringRecords.ownerUserId, req.securityPrincipal!.userId),
            eq(engineeringRecords.context, context),
            isNull(engineeringPublications.withdrawnAt),
          ),
        )
        .orderBy(desc(engineeringPublications.publishedAt))
        .limit(60);
      res.json({
        data: rows.map(({ publication, currentVersion }) => ({
          ...publicSnapshot(publication),
          recordId: publication.recordId,
          recordVersion: publication.version,
          currentVersion,
        })),
      });
    }),
  );
  router.get(
    "/api/admin/engineering/records/:id/history",
    asyncHandler(async (req, res) => {
      await db.transaction(async (tx) => {
        const row = await lockOwned(tx, req, req.params.id);
        const history = await tx
          .select()
          .from(engineeringVersions)
          .where(eq(engineeringVersions.recordId, row.id))
          .orderBy(desc(engineeringVersions.version))
          .limit(50);
        res.json(
          history.map((h) => ({
            version: h.version,
            createdAt: h.createdAt,
            snapshot: privateProjection(h.snapshot as Entry),
          })),
        );
      });
    }),
  );
  router.post(
    "/api/admin/engineering/records",
    requirePermission("engineering.manage"),
    asyncHandler(async (req, res) => {
      const input = saveInput.parse(req.body);
      await write(req, res, input, async (tx) => {
        const details = await validateLinks(tx, req, input.record);
        const [row] = await tx
          .insert(engineeringRecords)
          .values({
            ...input.record,
            details,
            ownerUserId: req.securityPrincipal!.userId,
          })
          .returning();
        await version(tx, req, row);
        await audit(tx, req, "create", row);
        return { status: 201, data: privateProjection(row) };
      });
    }),
  );
  router.patch(
    "/api/admin/engineering/records/:id",
    requirePermission("engineering.manage"),
    asyncHandler(async (req, res) => {
      const input = saveInput.parse(req.body);
      if (!input.expectedVersion)
        throw new ApiError(400, "Expected record version is required");
      await write(req, res, input, async (tx) => {
        const previous = await lockOwned(tx, req, req.params.id);
        if (previous.version !== input.expectedVersion)
          throw new ApiError(
            409,
            "This record changed; reload before saving",
            "VERSION_CONFLICT",
          );
        if (
          previous.context !== input.record.context ||
          previous.kind !== input.record.kind
        )
          throw new ApiError(
            409,
            "Record context and type cannot be moved after creation",
          );
        const details = await validateLinks(tx, req, input.record, previous.id);
        const [row] = await tx
          .update(engineeringRecords)
          .set({
            ...input.record,
            details,
            version: previous.version + 1,
            updatedAt: new Date(),
          })
          .where(eq(engineeringRecords.id, previous.id))
          .returning();
        // Public snapshots are independent and immutable; private edits never change a public note silently.
        await version(tx, req, row);
        await audit(tx, req, "revise", row, previous);
        return { status: 200, data: privateProjection(row) };
      });
    }),
  );
  router.post(
    "/api/admin/engineering/records/:id/publish",
    requirePermission("engineering.publish"),
    asyncHandler(async (req, res) => {
      const input = publicationInput.parse(req.body);
      await write(req, res, input, async (tx) => {
        const row = await lockOwned(tx, req, req.params.id);
        if (
          !["diary", "content", "practice"].includes(row.kind) ||
          !["review", "done"].includes(row.status)
        )
          throw new ApiError(
            409,
            "Only reviewed diary, content or practice records can publish",
          );
        if (row.version !== input.expectedVersion)
          throw new ApiError(
            409,
            "The reviewed record changed; review the current version",
          );
        const {
          requestKey: _key,
          expectedVersion: _version,
          disclosureReviewed: _review,
          ...publicFields
        } = input;
        const snapshot = {
          ...publicFields,
          mediaUrl: input.mediaUrl ? mediaReference(input.mediaUrl)!.url : null,
          imageUrl: input.imageUrl || null,
          imageAlt: input.imageAlt || null,
        };
        const [published] = await tx
          .insert(engineeringPublications)
          .values({
            recordId: row.id,
            version: row.version,
            slug: input.slug,
            snapshot,
            publishedBy: req.securityPrincipal!.userId,
          })
          .returning();
        await audit(
          tx,
          req,
          "publish",
          row,
          null,
          "Explicit sanitized public snapshot reviewed by the signed-in operator",
        );
        return { status: 201, data: publicSnapshot(published) };
      });
    }),
  );
  router.post(
    "/api/admin/engineering/publications/:id/withdraw",
    requirePermission("engineering.publish"),
    asyncHandler(async (req, res) => {
      const input = actionInput.parse(req.body);
      await write(req, res, input, async (tx) => {
        const [publication] = await tx
          .select()
          .from(engineeringPublications)
          .where(eq(engineeringPublications.id, req.params.id))
          .limit(1)
          .for("update");
        if (!publication) throw new ApiError(404, "Publication not found");
        const row = await lockOwned(tx, req, publication.recordId);
        if (row.version !== input.expectedVersion)
          throw new ApiError(409, "Record changed; refresh before withdrawal");
        if (!publication.withdrawnAt)
          await tx
            .update(engineeringPublications)
            .set({ withdrawnAt: new Date() })
            .where(eq(engineeringPublications.id, publication.id));
        await audit(tx, req, "withdraw", row, null, input.justification);
        return { status: 200, data: { withdrawn: true } };
      });
    }),
  );
  router.use(
    (
      error: unknown,
      _req: Request,
      _res: Response,
      next: (error?: unknown) => void,
    ) => {
      if (error instanceof ZodError)
        return next(
          new ApiError(
            400,
            "Invalid engineering record",
            "VALIDATION_ERROR",
            error.issues
              .slice(0, 20)
              .map((e) => ({ path: e.path, message: e.message })),
          ),
        );
      const cause =
        error && typeof error === "object" && "cause" in error
          ? (error as { cause: unknown }).cause
          : error;
      const code =
        cause && typeof cause === "object" && "code" in cause
          ? (cause as { code: unknown }).code
          : undefined;
      if (code === "23505")
        return next(
          new ApiError(
            409,
            "A record with this identifier or publication version already exists",
          ),
        );
      if (code === "42P01")
        return next(
          new ApiError(
            503,
            "Engineering workspace migration is not available",
            "SCHEMA_NOT_READY",
          ),
        );
      next(error);
    },
  );
  return router;
}
