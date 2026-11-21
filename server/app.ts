import express from "express";
import { setupAuthRoutes } from "./custom-auth.js";
import { analyticsMiddleware } from "./analytics.js";
import { setupAnalyticsRoutes } from "./api-analytics.js";
import { setupSeedRoutes } from "./content-seeder.js";
import { setupFilteringRoutes } from "./advanced-filtering.js";
import { setupSeedTriggerRoutes } from "./seed-trigger.js";
import { securityHeaders, requestLogger } from "./middleware.js";
import routes from "./routes.js";
import { env } from "./env.js";
import { setupDatabaseAuthRoutes } from "./security/database-auth-routes.js";
import { setupPostmarkWebhookRoute } from "./email/postmark-webhook-route.js";
import { createNotificationRouter } from "./notifications/routes.js";
import { createEmailRouter } from "./email/routes.js";
import { createTwilioWebhookRouter } from "./notifications/twilio-webhook-route.js";
import { createAdminRouter } from "./admin/routes.js";
import { createPortfolioGovernanceRouter } from "./portfolio/admin-routes.js";
import { createRevenueIntelligenceRouter } from "./revenue/routes.js";
import { createCapitalOperatingRouter } from "./capital/routes.js";
import { createTreasuryRoicRouter } from "./treasury/routes.js";
import { getReleaseMetadata } from "./release-metadata.js";
import { pool } from "./db.js";

import { createEngineeringRouter } from "./engineering/routes.js";
import { requestContext, safeApiError } from "./security/http-boundary.js";

export function createApp() {
  const app = express();
  app.disable("x-powered-by");
  app.use(requestContext);
  app.use(securityHeaders);

  app.use("/api/stripe-webhook", express.raw({ type: "application/json" }));
  setupPostmarkWebhookRoute(app);
  app.use(express.json({
    verify: (req: any, _res, buf) => {
      req.rawBody = buf;
    },
    limit: "10kb",
  }));
  app.use(express.urlencoded({ extended: false, limit: "10kb" }));

  app.use(requestLogger);
  app.use(analyticsMiddleware);

  app.get("/api/release", async (_request, response, next) => {
    try {
      const databaseIdentity = await pool.query(
        "select current_setting('neon.branch_id', true) as branch_id",
      );
      const branchId = databaseIdentity.rows?.[0]?.branch_id ?? null;
      response.setHeader("Cache-Control", "no-store");
      response.json({
        ...getReleaseMetadata(),
        databaseBranchId: typeof branchId === "string" ? branchId : null,
      });
    } catch (error) {
      next(error);
    }
  });

  const customAuthRouter = express.Router();
  if (env.ADMIN_AUTH_MODE === "database") {
    setupDatabaseAuthRoutes(customAuthRouter);
  } else {
    setupAuthRoutes(customAuthRouter);
  }
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

  // Missing public assets must not fall through to the single-page-app shell;
  // in particular, retired document paths should return 404 rather than a 200
  // HTML response that can be mistaken for an available file.
  app.use("/attached_assets", express.static("attached_assets", { fallthrough: false }));
  app.use(routes);
  app.use(createAdminRouter());
  app.use(createPortfolioGovernanceRouter());
  app.use(createRevenueIntelligenceRouter());
  app.use(createCapitalOperatingRouter());
  app.use(createTreasuryRoicRouter());
  app.use(createEngineeringRouter());
  app.use(createEmailRouter());
  app.use(createNotificationRouter());
  app.use(createTwilioWebhookRouter());

  app.use("/api", (_req, res) => res.status(404).json({ message: "API route not found" }));
  app.use(safeApiError);

  return app;
}

export const app = createApp();
