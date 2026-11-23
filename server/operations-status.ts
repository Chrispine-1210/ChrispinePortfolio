import { sql } from "drizzle-orm";
import { Router } from "express";
import { requireAdminPermission } from "./custom-auth.js";
import { db } from "./db.js";
import { env } from "./env.js";
import { asyncHandler } from "./middleware.js";
import { billingEnabled } from "./billing.js";
import { recoveryEnabled } from "./security/account-recovery.js";
import { getReleaseMetadata } from "./release-metadata.js";
export function createOperationsStatusRouter() {
  const router = Router();
  router.get(
    "/api/admin/operations/status",
    requireAdminPermission("analytics.read"),
    asyncHandler(async (_req, res) => {
      const result = await db.transaction(
        async (transaction) => {
          const identity = await transaction.execute<{
            role: string;
            branch_id: string | null;
          }>(
            sql`SELECT current_user AS role,current_setting('neon.branch_id',true) AS branch_id`,
          );
          const queue = await transaction.execute<
            Record<string, string>
          >(sql`SELECT
        count(*) FILTER(WHERE status IN('pending','retry'))::text AS pending,
        count(*) FILTER(WHERE status='uncertain')::text AS uncertain,
        count(*) FILTER(WHERE status='processing' AND locked_at<now()-interval '10 minutes')::text AS expired,
        count(*) FILTER(WHERE status IN('failed','bounced','complained'))::text AS failed
        FROM email_outbox`);
          return {
            database: identity.rows[0],
            queue: Object.fromEntries(
              Object.entries(queue.rows[0]).map(([key, value]) => [
                key,
                Number(value),
              ]),
            ),
          };
        },
        { isolationLevel: "repeatable read", accessMode: "read only" },
      );
      res.json({
        sampledAt: new Date().toISOString(),
        release: getReleaseMetadata(),
        ...result,
        integrations: {
          email: {
            configured: env.EMAIL_PROVIDER === "postmark",
            acceptance: "external_evidence_required",
          },
          billing: {
            configured: billingEnabled(),
            mode: env.BILLING_MODE,
            acceptance: "external_evidence_required",
          },
          recovery: {
            configured: recoveryEnabled(),
            acceptance: "external_evidence_required",
          },
        },
        releaseGates: [
          {
            key: "restore",
            label: "Current backup & restore",
            state: "external_evidence_required",
            detail:
              "Verify the backup boundary and an isolated restore before production changes.",
          },
          {
            key: "owner",
            label: "Owner browser acceptance",
            state: "external_evidence_required",
            detail:
              "Record normal authenticated owner/member journeys on the exact candidate.",
          },
          {
            key: "hosted",
            label: "GitHub-hosted assurance",
            state: "external_evidence_required",
            detail:
              "Inspect account restrictions and collect exact-head Quality and CodeQL evidence.",
          },
          {
            key: "activation",
            label: "Production activation",
            state: "owner_approval_required",
            detail:
              "A connected database and configured provider do not authorize activation.",
          },
        ],
      });
    }),
  );
  return router;
}
