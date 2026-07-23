import { randomUUID } from "node:crypto";
import type { Request, Response, Router } from "express";
import { z } from "zod";
import { env } from "../env.js";
import { AuthenticationService } from "./authentication-service.js";
import { DrizzleAuditWriter } from "./audit-repository.js";
import { DrizzleAuthenticationUserRepository } from "./drizzle-authentication-user-repository.js";
import { DrizzleLoginAttemptRepository } from "./drizzle-login-attempt-repository.js";
import { DrizzleSessionRepository } from "./drizzle-session-repository.js";
import { LoginThrottleService } from "./login-throttle.js";
import { ADMIN_SESSION_COOKIE, createSessionAuthentication, readCookie } from "./session-middleware.js";
import { SessionService } from "./session-service.js";

const loginSchema = z.object({
  email: z.string().email().max(320),
  password: z.string().min(1).max(1024),
}).strict();

function cookieOptions(expires?: Date) {
  return {
    httpOnly: true,
    secure: env.NODE_ENV === "production",
    sameSite: "strict" as const,
    path: "/",
    ...(expires ? { expires } : {}),
  };
}

function networkAddress(request: Request): string {
  return request.ip || request.socket.remoteAddress || "unknown";
}

export function createDatabaseAuthRuntime() {
  if (!env.AUTH_KEY_PEPPER) {
    throw new Error("AUTH_KEY_PEPPER is required when ADMIN_AUTH_MODE=database");
  }
  const sessions = new SessionService(new DrizzleSessionRepository());
  const throttle = new LoginThrottleService(
    new DrizzleLoginAttemptRepository(),
    env.AUTH_KEY_PEPPER,
  );
  const authentication = new AuthenticationService(
    new DrizzleAuthenticationUserRepository(),
    sessions,
    throttle,
    new DrizzleAuditWriter(),
  );
  return { sessions, authentication };
}

let sharedRuntime: ReturnType<typeof createDatabaseAuthRuntime> | undefined;

export function getDatabaseAuthRuntime() {
  sharedRuntime ??= createDatabaseAuthRuntime();
  return sharedRuntime;
}

export function setupDatabaseAuthRoutes(router: Router, runtime = getDatabaseAuthRuntime()) {
  const authenticate = createSessionAuthentication(runtime.sessions);

  router.post("/api/auth/login", async (request: Request, response: Response, next) => {
    try {
      const parsed = loginSchema.safeParse(request.body);
      if (!parsed.success) return response.status(400).json({ message: "Invalid login request" });
      const requestId = request.requestId ?? randomUUID();
      const result = await runtime.authentication.login(parsed.data.email, parsed.data.password, {
        networkAddress: networkAddress(request),
        userAgent: request.get("user-agent"),
        requestId,
      });
      response.setHeader("Cache-Control", "no-store");
      if (result.outcome === "throttled") {
        response.setHeader("Retry-After", String(result.retryAfterSeconds));
        return response.status(429).json({ message: "Too many login attempts" });
      }
      if (result.outcome === "invalid") {
        return response.status(401).json({ message: "Invalid credentials" });
      }
      response.cookie(ADMIN_SESSION_COOKIE, result.session.token, cookieOptions(result.session.expiresAt));
      return response.json({
        message: "Login successful",
        user: { id: result.user.id, email: result.user.email, isAdmin: true },
      });
    } catch (error) {
      next(error);
    }
  });

  router.get("/api/auth/me", authenticate, (request: Request, response: Response) => {
    response.setHeader("Cache-Control", "no-store");
    const principal = request.securityPrincipal!;
    response.json({
      id: principal.userId,
      email: principal.email,
      isAdmin: true,
      permissions: principal.permissions,
    });
  });

  router.post("/api/auth/logout", async (request: Request, response: Response, next) => {
    try {
      const token = readCookie(request.headers.cookie, ADMIN_SESSION_COOKIE);
      if (token) await runtime.sessions.revoke(token, "logout");
      response.clearCookie(ADMIN_SESSION_COOKIE, cookieOptions());
      response.setHeader("Cache-Control", "no-store");
      response.json({ message: "Logged out successfully" });
    } catch (error) {
      next(error);
    }
  });

  return { authenticate };
}
