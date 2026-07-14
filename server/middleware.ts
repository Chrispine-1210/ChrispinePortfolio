import { Request, Response, NextFunction } from "express";
import Stripe from "stripe";

// Standard API response format
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: {
    message: string;
    code?: string;
    details?: any;
  };
  timestamp: string;
}

// Error handler utility
export class ApiError extends Error {
  constructor(
    public statusCode: number,
    message: string,
    public code?: string,
    public details?: any
  ) {
    super(message);
    this.name = "ApiError";
  }
}

// Send standardized response
export function sendResponse<T>(
  res: Response,
  data: T,
  statusCode = 200
): Response {
  return res.status(statusCode).json({
    success: statusCode < 400,
    data,
    timestamp: new Date().toISOString(),
  } as ApiResponse<T>);
}

// Send standardized error
export function sendError(
  res: Response,
  error: ApiError | Error,
  statusCode = 500
): Response {
  const message = error.message || "Internal Server Error";
  const code = error instanceof ApiError ? error.code : undefined;
  const details = error instanceof ApiError ? error.details : undefined;

  return res.status(statusCode).json({
    success: false,
    error: {
      message,
      code,
      details,
    },
    timestamp: new Date().toISOString(),
  } as ApiResponse);
}

// Premium check middleware
export async function requirePremium(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const user = (req as any).user;
  
  if (!user?.claims?.sub) {
    return sendError(res, new ApiError(401, "Unauthorized"), 401);
  }

  // Check premium status from user object
  const userObj = (req as any).user;
  if (!userObj.isPremium) {
    return sendError(
      res,
      new ApiError(403, "Premium subscription required", "PREMIUM_REQUIRED"),
      403
    );
  }

  next();
}

// Safe async handler wrapper
export const asyncHandler = (
  fn: (req: Request, res: Response, next: NextFunction) => Promise<any>
) => (req: Request, res: Response, next: NextFunction) => {
  return Promise.resolve(fn(req, res, next)).catch(next);
};

// Security headers middleware
export const securityHeaders = (req: Request, res: Response, next: NextFunction) => {
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "SAMEORIGIN");
  res.setHeader("X-XSS-Protection", "1; mode=block");
  res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
  res.setHeader("Strict-Transport-Security", "max-age=31536000; includeSubDomains");
  res.setHeader("Content-Security-Policy", "default-src 'self'; script-src 'self' 'unsafe-inline' https://js.stripe.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data: https:; connect-src 'self'; frame-src https://js.stripe.com");
  next();
};

// Cache control middleware
export const cacheControl = (maxAge: number = 3600) => {
  return (req: Request, res: Response, next: NextFunction) => {
    res.setHeader("Cache-Control", `public, max-age=${maxAge}`);
    next();
  };
};

// Request logging middleware
export const requestLogger = (req: Request, res: Response, next: NextFunction) => {
  const start = Date.now();
  res.on("finish", () => {
    const duration = Date.now() - start;
    const logLevel = res.statusCode >= 400 ? "warn" : "info";
    console.log(`[${logLevel.toUpperCase()}] ${req.method} ${req.path} ${res.statusCode} ${duration}ms`);
  });
  next();
};
