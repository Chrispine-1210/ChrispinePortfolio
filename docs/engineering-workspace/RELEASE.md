# Release and migration boundaries

This slice was developed on top of `agent/project-casebooks-20261118`. Current source consolidation is recorded in [workspace synchronization](../workspace-sync/README.md). Source integration does not activate production or waive the migration and dependency-audit gates below.

## Current evidence

- TypeScript, integration tests and a production bundle pass; see VERIFICATION.md.
- Migration 0011 was applied successfully to existing nonproduction review branch `br-steep-dew-bboxeusj` in project `twilight-meadow-16888716`, database `neondb`, on 18 November 2026. The review branch is a child of production main `br-misty-wave-bb79bj7l` and was created earlier for the casebook review.
- A separate new branch attempt failed because Neon reached its branch limit. No branch was deleted or reset.
- The production database has not received migration 0011.
- Browser UI verification uses actual application routes and an isolated PGlite database through a test-only session fixture outside the repository. The preview host cannot resolve the Neon endpoint. This does not certify production login, cookies, networking or Neon-backed browser transactions.
- Existing dependency audits remain release-blocking. The inspected picomatch advisory includes registry latest 4.0.7. No workflow, audit script or security gate has been weakened or rerun manually.

## Activation procedure

1. Reconcile the stacked source with the current target branch; repeat affected checks after reconciliation. Record the exact source SHA and provider deployment identity.
2. Resolve the dependency findings with a reviewed compatible dependency/build-chain change, or obtain an explicit accountable release exception that states exposure and compensating controls. Do not silently bypass `verify:release`.
3. Confirm the intended production project/database from current provider configuration. `APP_DATABASE_URL` takes precedence over `DATABASE_URL`; do not apply the schema to a similarly named legacy project.
4. Before any production migration, establish an independently recoverable backup and verify a restore on an isolated target. Record an accountable maintenance/rollback decision and source/database compatibility.
5. Apply the reviewed additive migration 0011 using the existing migration procedure and schema-owner account. It creates four tables, immutable-history triggers, constraints/indexes and three engineering permissions assigned to existing administrator roles. Do not create new organization users or broaden unrelated finance permissions.
6. Deploy the exact reviewed source. Require `ADMIN_AUTH_MODE=database`, a valid `AUTH_KEY_PEPPER`, correct runtime database configuration and `APP_BASE_URL` set to the actual deployment origin. Missing origin configuration intentionally blocks workspace writes in production. Never put privileged database credentials into public frontend variables.
7. Use real authenticated sessions to verify own-record CRUD, another account's 404, stale-version 409, repeated request replay, rejected origin, immutable history, denied unauthorized asset observation, public review/publish/withdrawal, safe error messages and no private API caching. Use synthetic fixtures with a documented retirement path, not client records.
8. Check public `/journey`, existing case studies, admin navigation, narrow layout and media click consent. Verify API security headers on the deployed serverless path, not only static local pages.
9. Confirm that communications, treasury and other applications retain their existing independent permissions. Test provider integrations only after their credentials, consent, cost and incident procedures are defined.
10. Record the release decision and evidence. If a rollback is needed, revert the application release while preserving the additive tables/history. Do not delete audit history or reset the production database as a routine rollback.

The application does not set database role grants, TLS policies, Vercel WAF rules, physical network controls, endpoint agents or security alert integrations. Those require separate infrastructure implementation and certification.
