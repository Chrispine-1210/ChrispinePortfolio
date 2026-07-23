import express, { type Request, type Response, type NextFunction } from "express";
import { setupAuthRoutes } from "./custom-auth.js";
import { analyticsMiddleware } from "./analytics.js";
import { setupAnalyticsRoutes } from "./api-analytics.js";
import { setupSeedRoutes } from "./content-seeder.js";
import { setupFilteringRoutes } from "./advanced-filtering.js";
import { setupSeedTriggerRoutes } from "./seed-trigger.js";
import { securityHeaders, requestLogger } from "./middleware.js";
import routes from "./routes.js";

export function createApp() {
  const app = express();

  app.use("/api/stripe-webhook", express.raw({ type: "application/json" }));
  app.use(express.json({
    verify: (req: any, _res, buf) => {
      req.rawBody = buf;
    },
    limit: "10kb",
  }));
  app.use(express.urlencoded({ extended: false, limit: "10kb" }));

  app.use(securityHeaders);
  app.use(requestLogger);
  app.use(analyticsMiddleware);

  const customAuthRouter = express.Router();
  setupAuthRoutes(customAuthRouter);
  app.use(customAuthRouter);

  const analyticsRouter = express.Router();
  setupAnalyticsRoutes(analyticsRouter);
  app.use(analyticsRouter);

  const seedRouter = express.Router();
  setupSeedRoutes(seedRouter);
  app.use(seedRouter);

  const filterRouter = express.Router();
  setupFilteringRoutes(filterRouter);
  app.use(filterRouter);

  const seedTriggerRouter = express.Router();
  setupSeedTriggerRoutes(seedTriggerRouter);
  app.use(seedTriggerRouter);

  app.use("/attached_assets", express.static("attached_assets"));
  app.use(routes);

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    console.error("Server error:", err);
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";
    res.status(status).json({ message });
  });

  return app;
}

export const app = createApp();
