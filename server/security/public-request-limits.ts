import { createHmac } from "node:crypto";
import { sql } from "drizzle-orm";
import type { Request } from "express";
import { db } from "../db.js";
import { env } from "../env.js";
import { ApiError } from "../middleware.js";

// Shared database counters, with no plaintext IP/email stored. Never trust an
// arbitrary client-supplied forwarding header as a new rate-limit identity.
export function requestNetwork(request: Request) {
  return request.ip || request.socket.remoteAddress || "unknown";
}
export async function withinPublicLimit(
  scope: string,
  identity: string,
  limit: number,
  windowMs: number,
  now = new Date(),
) {
  if (!env.AUTH_KEY_PEPPER)
    throw new ApiError(503, "Request protection is unavailable");
  const key = createHmac("sha256", env.AUTH_KEY_PEPPER)
    .update(scope + ":" + identity)
    .digest("hex");
  const bucket = new Date(Math.floor(now.getTime() / windowMs) * windowMs);
  const result = await db.execute<{
    hits: number;
  }>(sql`INSERT INTO public_request_limits(key_hash,bucket_start,hits,expires_at)
    VALUES(${key},${bucket},1,${new Date(bucket.getTime() + windowMs * 2)})
    ON CONFLICT(key_hash,bucket_start) DO UPDATE SET hits=LEAST(public_request_limits.hits+1,1000000)
    RETURNING hits`);
  return Number(result.rows[0]?.hits) <= limit;
}
export async function protectPublicIntake(request: Request) {
  if (
    !(await withinPublicLimit(
      "commercial-intake",
      requestNetwork(request),
      30,
      15 * 60000,
    ))
  )
    throw new ApiError(
      429,
      "Too many requests. Wait before submitting another enquiry.",
      "INTAKE_LIMIT",
    );
}
