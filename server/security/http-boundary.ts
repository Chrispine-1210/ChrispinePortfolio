import { randomUUID } from "node:crypto";
import type { ErrorRequestHandler, RequestHandler } from "express";
import { ApiError } from "../middleware.js";

export const requestContext: RequestHandler = (req, res, next) => {
  req.requestId = randomUUID();
  res.setHeader("X-Request-Id", req.requestId);
  next();
};
export const safeApiError: ErrorRequestHandler = (error, req, res, next) => {
  if (res.headersSent) return next(error);
  const declared = Number(error?.statusCode ?? error?.status ?? 500);
  const status =
    Number.isInteger(declared) && declared >= 400 && declared <= 599
      ? declared
      : 500;
  const trusted = error instanceof ApiError && status < 500;
  const message = trusted
    ? error.message
    : status === 413
      ? "Request body is too large"
      : status === 400
        ? "Invalid request body"
        : status === 503
          ? "Service temporarily unavailable"
          : "The request could not be completed";
  const code = trusted
    ? error.code
    : status === 413
      ? "PAYLOAD_TOO_LARGE"
      : status === 400
        ? "INVALID_REQUEST"
        : status === 503
          ? "SERVICE_UNAVAILABLE"
          : "INTERNAL_ERROR";
  // Never log request bodies, cookies, tokens, database URLs or raw driver errors.
  console.error("API request failed", {
    requestId: req.requestId,
    status,
    code,
    type: error?.name ?? "Error",
  });
  res.setHeader("Cache-Control", "no-store");
  if (status === 429) res.setHeader("Retry-After", "60");
  res
    .status(status)
    .json({
      message,
      code,
      requestId: req.requestId,
      ...(trusted && error.details ? { fields: error.details } : {}),
    });
};
