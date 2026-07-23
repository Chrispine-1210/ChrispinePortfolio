import crypto from "crypto";
import { Request, Response, NextFunction } from "express";
import { env } from "./env.js";
import { getDatabaseAuthRuntime } from "./security/database-auth-routes.js";
import { createSessionAuthentication, requirePermission } from "./security/session-middleware.js";

const authConfigured = Boolean(
  env.AUTH_SECRET && env.ADMIN_EMAIL && env.ADMIN_PASSWORD,
);
const SECRET = env.AUTH_SECRET || crypto.randomBytes(32).toString("hex");
const ADMIN_EMAIL = env.ADMIN_EMAIL || "";
const ADMIN_PASSWORD = env.ADMIN_PASSWORD || "";
const TOKEN_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000;

// Simple token generation without external deps
export function generateToken(email: string, isAdmin: boolean): string {
  const payload = JSON.stringify({ email, isAdmin, iat: Date.now() });
  const encoded = Buffer.from(payload).toString("base64");
  const signature = crypto
    .createHmac("sha256", SECRET)
    .update(encoded)
    .digest("hex");
  return `${encoded}.${signature}`;
}

// Verify token
export function verifyToken(token: string): { email: string; isAdmin: boolean; iat: number } | null {
  if (!authConfigured) return null;

  try {
    const [encoded, signature] = token.split(".");
    if (!encoded || !signature) return null;

    const expectedSignature = crypto
      .createHmac("sha256", SECRET)
      .update(encoded)
      .digest("hex");

    const supplied = Buffer.from(signature, "hex");
    const expected = Buffer.from(expectedSignature, "hex");
    if (supplied.length !== expected.length || !crypto.timingSafeEqual(supplied, expected)) {
      return null;
    }

    const payload = JSON.parse(Buffer.from(encoded, "base64").toString());
    if (
      typeof payload.email !== "string" ||
      typeof payload.isAdmin !== "boolean" ||
      typeof payload.iat !== "number" ||
      !Number.isFinite(payload.iat) ||
      payload.iat > Date.now() ||
      Date.now() - payload.iat > TOKEN_MAX_AGE_MS
    ) {
      return null;
    }
    return payload;
  } catch {
    return null;
  }
}

// Hash password
export function hashPassword(password: string): string {
  return crypto.createHash("sha256").update(password).digest("hex");
}

// Verify password
export function verifyPassword(password: string, hash: string): boolean {
  return hashPassword(password) === hash;
}

// Auth middleware
export function authMiddleware(req: Request, res: Response, next: NextFunction) {
  try {
    const cookieToken = req.headers.cookie
      ?.split(";")
      .map((cookie) => cookie.trim())
      .find((cookie) => cookie.startsWith("authToken="))
      ?.slice("authToken=".length);
    const bearerToken = req.headers.authorization?.startsWith("Bearer ")
      ? req.headers.authorization.slice("Bearer ".length)
      : undefined;
    const token = cookieToken ? decodeURIComponent(cookieToken) : bearerToken;

    if (!token) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const decoded = verifyToken(token);
    if (!decoded) {
      return res.status(401).json({ message: "Invalid or expired token" });
    }

    (req as any).user = decoded;
    next();
  } catch (error) {
    res.status(401).json({ message: "Authentication failed" });
  }
}

// Admin middleware
export function requireAdminPermission(permission: string) {
  return function permissionMiddleware(req: Request, res: Response, next: NextFunction) {
    if (env.ADMIN_AUTH_MODE === "database") {
      const authenticate = createSessionAuthentication(getDatabaseAuthRuntime().sessions);
      return authenticate(req, res, (authenticationError?: unknown) => {
        if (authenticationError) return next(authenticationError);
        return requirePermission(permission)(req, res, next);
      });
    }
    return authMiddleware(req, res, () => {
      const user = (req as any).user;
      if (!user?.isAdmin) {
        return res.status(403).json({ message: "Admin access required" });
      }
      next();
    });
  };
}

export function adminMiddleware(req: Request, res: Response, next: NextFunction) {
  return requireAdminPermission("security.settings.manage")(req, res, next);
}

// Setup auth routes
export function setupAuthRoutes(router: any) {
  // Login
  router.post("/api/auth/login", (req: Request, res: Response) => {
    try {
      if (!authConfigured) {
        return res.status(503).json({ message: "Admin authentication is not configured" });
      }

      const { email, password } = req.body;

      if (email !== ADMIN_EMAIL) {
        return res.status(401).json({ message: "Invalid credentials" });
      }

      if (hashPassword(password) !== hashPassword(ADMIN_PASSWORD)) {
        return res.status(401).json({ message: "Invalid credentials" });
      }

      const token = generateToken(email, true);

      res.cookie("authToken", token, {
        httpOnly: true,
        secure: env.NODE_ENV === "production",
        sameSite: "strict",
        maxAge: TOKEN_MAX_AGE_MS,
      });

      res.json({ message: "Login successful", user: { email, isAdmin: true } });
    } catch (error: any) {
      console.error("Login error:", error);
      res.status(500).json({ message: "Login failed" });
    }
  });

  // Get current user
  router.get("/api/auth/me", (req: Request, res: Response) => {
    try {
      const token = req.cookies?.authToken || req.headers.authorization?.replace("Bearer ", "");

      if (!token) {
        return res.json(null);
      }

      const decoded = verifyToken(token);
      if (!decoded) {
        return res.json(null);
      }

      res.json({ id: decoded.email, email: decoded.email, isAdmin: decoded.isAdmin });
    } catch {
      res.json(null);
    }
  });

  // Logout
  router.post("/api/auth/logout", (req: Request, res: Response) => {
    res.clearCookie("authToken");
    res.json({ message: "Logged out successfully" });
  });
}
