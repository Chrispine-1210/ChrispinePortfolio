import crypto from "crypto";
import { Request, Response, NextFunction } from "express";

const SECRET = process.env.AUTH_SECRET || "your-super-secret-key-change-in-prod";
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || "admin@example.com";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "admin123";

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
export function verifyToken(token: string): { email: string; isAdmin: boolean } | null {
  try {
    const [encoded, signature] = token.split(".");
    if (!encoded || !signature) return null;

    const expectedSignature = crypto
      .createHmac("sha256", SECRET)
      .update(encoded)
      .digest("hex");

    if (signature !== expectedSignature) return null;

    const payload = JSON.parse(Buffer.from(encoded, "base64").toString());
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
    const token = req.cookies?.authToken || req.headers.authorization?.replace("Bearer ", "");

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
export function adminMiddleware(req: Request, res: Response, next: NextFunction) {
  authMiddleware(req, res, () => {
    const user = (req as any).user;
    if (!user?.isAdmin) {
      return res.status(403).json({ message: "Admin access required" });
    }
    next();
  });
}

// Setup auth routes
export function setupAuthRoutes(router: any) {
  // Login
  router.post("/api/auth/login", (req: Request, res: Response) => {
    try {
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
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        maxAge: 7 * 24 * 60 * 60 * 1000,
      });

      res.json({ message: "Login successful", token, user: { email, isAdmin: true } });
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
