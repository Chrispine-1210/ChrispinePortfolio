import type { RequestHandler } from "express";
import type { SessionService } from "./session-service.js";

export const ADMIN_SESSION_COOKIE = "admin_session";

export function readCookie(cookieHeader: string | undefined, name: string): string | undefined {
  const prefix = `${name}=`;
  const encoded = cookieHeader
    ?.split(";")
    .map((cookie) => cookie.trim())
    .find((cookie) => cookie.startsWith(prefix))
    ?.slice(prefix.length);
  if (!encoded) return undefined;
  try {
    return decodeURIComponent(encoded);
  } catch {
    return undefined;
  }
}

export function createSessionAuthentication(
  sessionService: SessionService,
  cookieName = ADMIN_SESSION_COOKIE,
): RequestHandler {
  return async (request, response, next) => {
    try {
      const token = readCookie(request.headers.cookie, cookieName);
      if (!token) return response.status(401).json({ message: "Unauthorized" });

      const principal = await sessionService.authenticate(token);
      if (!principal) {
        response.clearCookie(cookieName, {
          httpOnly: true,
          secure: process.env.NODE_ENV === "production",
          sameSite: "strict",
          path: "/",
        });
        return response.status(401).json({ message: "Unauthorized" });
      }

      request.securityPrincipal = principal;
      next();
    } catch (error) {
      next(error);
    }
  };
}

export function requirePermission(...requiredPermissions: string[]): RequestHandler {
  return (request, response, next) => {
    const principal = request.securityPrincipal;
    if (!principal) return response.status(401).json({ message: "Unauthorized" });

    const granted = new Set(principal.permissions);
    if (!requiredPermissions.every((permission) => granted.has(permission))) {
      return response.status(403).json({ message: "Forbidden" });
    }
    next();
  };
}
