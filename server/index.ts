import express, { type Request, type Response, type NextFunction } from "express";
import { setupAuth, registerAuthRoutes } from "./replit_integrations/auth";
import routes from "./routes";
import { setupVite, serveStatic, log } from "./vite";

declare global {
  namespace Express {
    interface User {
      claims: {
        sub: string;
        email?: string;
        given_name?: string;
        family_name?: string;
        picture?: string;
      };
      access_token?: string;
      refresh_token?: string;
      expires_at?: number;
    }
  }
}

const app = express();

// Raw body handling for Stripe webhooks
app.use("/api/stripe-webhook", express.raw({ type: "application/json" }));

// Body parsing middleware
app.use(express.json({
  verify: (req: any, _res, buf) => {
    req.rawBody = buf;
  }
}));
app.use(express.urlencoded({ extended: false }));

// Request logging middleware
app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});

// Setup Replit Auth (BEFORE registering other routes)
(async () => {
  await setupAuth(app);
  registerAuthRoutes(app);
})();

// Serve static files from attached_assets
app.use("/attached_assets", express.static("attached_assets"));

// API routes
app.use(routes);

// Error handling middleware
app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
  console.error("Server error:", err);
  const status = err.status || err.statusCode || 500;
  const message = err.message || "Internal Server Error";
  res.status(status).json({ message });
});

// Start server with Vite integration
(async () => {
  const server = await import("http").then((mod) => mod.createServer(app));

  // Setup Vite in development
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  const port = parseInt(process.env.PORT || "5000", 10);
  server.listen({
    port,
    host: "0.0.0.0",
    reusePort: true,
  }, () => {
    log(`Server is listening on port ${port}...`);
  });

  // Graceful shutdown
  process.on("SIGTERM", () => {
    log("SIGTERM signal received: closing HTTP server");
    server.close(() => {
      log("HTTP server closed");
      pgPool.end();
    });
  });
})();
