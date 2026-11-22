import { randomUUID } from "node:crypto";
import type { ErrorRequestHandler, RequestHandler } from "express";
import { ZodError } from "zod";
import { ApiError } from "../middleware.js";

// Drizzle preserves the driver error as `cause`. Inspect only a bounded chain
// and known SQLSTATEs; neither driver text nor query parameters are public data.
function databaseFailure(error: unknown): { status: number; code: string } | undefined {
  let current = error;
  for (let depth = 0; depth < 5 && current && typeof current === "object"; depth++) {
    const { code, cause } = current as { code?: unknown; cause?: unknown };
    if (typeof code === "string") {
      if (["23505", "23503", "40001", "40P01"].includes(code)) {
        return { status: 409, code: "CONFLICT" };
      }
      if (["23502", "23514", "22P02", "22003", "22007", "22008"].includes(code)) {
        return { status: 400, code: "INVALID_REQUEST" };
      }
      if (["55P03", "57014", "53300", "57P01", "57P02", "57P03"].includes(code)
        || /^08[0-9A-Z]{3}$/.test(code)) {
        return { status: 503, code: "SERVICE_UNAVAILABLE" };
      }
    }
    current = cause;
  }
}

export const requestContext: RequestHandler = (req, res, next) => {
  req.requestId = randomUUID();
  res.setHeader("X-Request-Id", req.requestId);
  next();
};
export const safeApiError: ErrorRequestHandler = (error, req, res, next) => {
  if (res.headersSent) return next(error);
  const validation = error instanceof ZodError;
  const database = databaseFailure(error);
  const declared = Number(error?.statusCode ?? error?.status ?? 500);
  const status = validation ? 400 : database?.status ?? (
    Number.isInteger(declared) && declared >= 400 && declared <= 599
      ? declared
      : 500);
  const writeUnconfirmed = status >= 500 && !["GET", "HEAD", "OPTIONS"].includes(req.method);
  const trusted = error instanceof ApiError && status < 500;
  const message = writeUnconfirmed
    ? "The change could not be confirmed. Check the record before submitting again."
    : trusted
    ? error.message
    : status === 413
      ? "Request body is too large"
      : status === 400
        ? "Invalid request body"
        : status === 409
          ? "The request conflicts with the current record state"
        : status === 503
          ? "Service temporarily unavailable"
          : "The request could not be completed";
  const code = writeUnconfirmed
    ? "WRITE_OUTCOME_UNKNOWN"
    : trusted
    ? error.code
    : database?.code ?? (status === 413
      ? "PAYLOAD_TOO_LARGE"
      : status === 400
        ? "INVALID_REQUEST"
        : status === 503
          ? "SERVICE_UNAVAILABLE"
          : "INTERNAL_ERROR");
  // Never log request bodies, cookies, tokens, database URLs or raw driver errors.
  console.error("API request failed", {
    requestId: req.requestId,
    status,
    code,
    type: validation ? "ValidationError" : database ? "DatabaseError" : trusted ? "ApiError" : "Error",
  });
  res.setHeader("Cache-Control", "no-store");
  if (status === 429 || (status === 503 && !writeUnconfirmed)) res.setHeader("Retry-After", "60");
  res
    .status(status)
    .json({
      message,
      code,
      requestId: req.requestId,
      ...(validation ? { fields: error.issues.slice(0, 20).map((issue) => ({
        path: issue.path.slice(0, 10).map(String),
        code: issue.code,
        message: issue.message.slice(0, 200),
      })) } : {}),
      ...(trusted && error.details ? { fields: error.details } : {}),
    });
};
