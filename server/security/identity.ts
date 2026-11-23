import type { Request } from "express";
import { getDatabaseAuthRuntime } from "./database-auth-routes.js";
import { ADMIN_SESSION_COOKIE, readCookie } from "./session-middleware.js";
import { env } from "../env.js";
import type { SessionPrincipal } from "./session-service.js";

export function administrativePrincipal(principal: SessionPrincipal) {
  return principal.permissions.some(permission => permission !== "notifications.read");
}
export function publicIdentity(principal: SessionPrincipal) {
  return { id: principal.userId, email: principal.email,
    isAdmin: administrativePrincipal(principal), permissions: principal.permissions };
}
export async function optionalPrincipal(request: Request) {
  if (request.securityPrincipal) return request.securityPrincipal;
  if (env.ADMIN_AUTH_MODE !== "database") return null;
  const token = readCookie(request.headers.cookie, ADMIN_SESSION_COOKIE);
  if (!token) return null;
  return getDatabaseAuthRuntime().sessions.authenticate(token);
}
