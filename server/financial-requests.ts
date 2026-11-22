import { createHash } from "node:crypto";
import { and, eq, sql } from "drizzle-orm";
import { Router, type Request, type Response, type NextFunction } from "express";
import { financialRequestReceipts } from "../shared/schema.js";
import { canonicalRequestJson, financialRequestKeyPattern, isFinancialWrite } from "../shared/financial-requests.js";
import { db } from "./db.js";
import { ApiError, asyncHandler } from "./middleware.js";
import { requireAdminPermission } from "./custom-auth.js";

type Handler = (request: Request, response: Response, next: NextFunction) => Promise<unknown>;
const digest = (value: string) => createHash("sha256").update(value).digest();

// Authentication/route permissions run first. Never flush a financial success
// before the mutation, audit and receipt have committed on the SAME connection.
export function financialHandler(handler: Handler) {
  return asyncHandler(async (request, response, next) => {
    if (!isFinancialWrite(request.method, request.originalUrl)) return handler(request, response, next);
    const principal = request.securityPrincipal;
    const permission = request.authorizedAdminPermission;
    if (!principal || !permission) throw new ApiError(503, "Database-backed financial authentication required");
    if (request.get("X-Financial-Actor") && request.get("X-Financial-Actor") !== principal.userId) throw new ApiError(409, "The signed-in account changed before submission. Verify the active account first.", "FINANCIAL_ACTOR_CHANGED");
    const key = request.get("Idempotency-Key") ?? "";
    if (!financialRequestKeyPattern.test(key)) throw new ApiError(400, "A valid financial request reference is required", "IDEMPOTENCY_KEY_REQUIRED");
    response.setHeader("Cache-Control", "no-store");
    response.setHeader("Idempotency-Key", key);
    const path = request.originalUrl.replace(/\/+$/, "");
    const fingerprint = digest(canonicalRequestJson({ version: 1, method: request.method, path, body: request.body ?? null, permission })).toString("hex");
    const lock = digest(principal.userId + ":" + key).readBigInt64BE(0).toString();
    const originalJson = response.json;
    let captured: { status: number; body: unknown } | undefined;
    try {
      const result = await db.transaction(async (transaction) => {
        await transaction.execute(sql`SET LOCAL statement_timeout='15000ms'`);
        await transaction.execute(sql`SET LOCAL lock_timeout='5000ms'`);
        await transaction.execute(sql`SELECT pg_advisory_xact_lock(${lock}::bigint)`);
        const [previous] = await transaction.select().from(financialRequestReceipts).where(and(
          eq(financialRequestReceipts.actorUserId, principal.userId), eq(financialRequestReceipts.requestKey, key),
        )).limit(1);
        if (previous) {
          if (previous.fingerprint !== fingerprint) throw new ApiError(409, "This request reference belongs to different input. Reconcile the original request first.", "IDEMPOTENCY_CONFLICT");
          return { status: previous.responseStatus, body: previous.responseBody, requestId: previous.originalRequestId, replayed: true };
        }
        response.json = function (body: unknown) {
          if (captured) throw new Error("Financial handler produced multiple responses");
          captured = { status: response.statusCode, body: JSON.parse(JSON.stringify(body)) };
          return response;
        } as Response["json"];
        await handler(request, response, (error?: unknown) => { throw error ?? new Error("Financial handler did not complete"); });
        if (!captured || captured.status < 200 || captured.status >= 500 || response.headersSent) throw new Error("Financial handler did not produce a recordable result");
        const requestId = request.requestId;
        if (!requestId) throw new Error("Financial request context missing");
        await transaction.insert(financialRequestReceipts).values({
          actorUserId: principal.userId, requestKey: key, fingerprint, method: request.method, path,
          requiredPermission: permission, responseStatus: captured.status, responseBody: captured.body,
          originalRequestId: requestId,
        });
        return { ...captured, requestId, replayed: false };
      });
      response.json = originalJson;
      response.setHeader("Idempotency-Replayed", String(result.replayed));
      response.setHeader("Idempotency-Result", "recorded");
      response.setHeader("X-Original-Request-Id", result.requestId);
      response.status(result.status).json(result.body);
    } finally {
      response.json = originalJson;
    }
  });
}

export function createFinancialRequestRouter() {
  const router = Router();
  router.get("/api/admin/financial-requests/:key", requireAdminPermission("pipeline.financial.read"), asyncHandler(async (request, response) => {
    const principal = request.securityPrincipal;
    if (!principal) throw new ApiError(403, "Database-backed financial authentication required");
    const key = request.params.key;
    if (!financialRequestKeyPattern.test(key)) throw new ApiError(400, "Invalid financial request reference");
    const [receipt] = await db.select().from(financialRequestReceipts).where(and(
      eq(financialRequestReceipts.actorUserId, principal.userId), eq(financialRequestReceipts.requestKey, key),
    )).limit(1);
    response.setHeader("Cache-Control", "no-store");
    if (!receipt) return response.json({ state: "unconfirmed", key, message: "No committed receipt is visible. A request may still be running. Do not submit with a new reference." });
    if (!principal.permissions.includes(receipt.requiredPermission)) throw new ApiError(403, "Permission to view the original financial operation is required");
    response.json({ state: "recorded", key, method: receipt.method, path: receipt.path, status: receipt.responseStatus,
      result: receipt.responseBody, originalRequestId: receipt.originalRequestId, recordedAt: receipt.createdAt });
  }));
  return router;
}
