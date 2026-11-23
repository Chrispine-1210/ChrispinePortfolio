# Release and migration boundaries

This slice was developed on top of `agent/project-casebooks-20261118`. Current source consolidation is recorded in [workspace synchronization](../workspace-sync/README.md). Source integration does not activate production or waive the migration and dependency-audit gates below.

## Current evidence

Use the [release gate register](../production-readiness/RELEASE_GATES.md) for the
dated current baseline and open gates. The earlier 18 November source snapshot
is superseded for production migration/deployment status.

- Production is READY at `d116fcfa9c44cf66c0cc3dbb619c367b22c94243`.
- Retained production evidence records all 13 migrations through 0012, named
  restricted runtime/migration roles and runtime identity `portfolio_runtime`.
  Do not replay adopted 0011/0012 or apply their seeds again.
- PR #41 contains native PostgreSQL request-receipt proof and authenticated
  isolated Preview evidence. These do not close exact-money/distinct-key
  concurrency, owner-browser acceptance or the other open business gates.
- Retained release checks passed the production and full audit policy. Keep those
  audits enabled; a bundle alone is insufficient. GitHub jobs were account-billing
  blocked and are not passing assurance. Their current recovery was not rechecked.
- Current backup/restore certification remains unverified. Preserve existing
  snapshots/backup branches; do not reset production or delete backups for space.
- Earlier synthetic/PGlite browser evidence does not certify the owner's real
  sign-in, cookies, navigation or production financial workflows.

## Activation procedure

1. Reconcile the stacked source with the current target branch; repeat affected checks after reconciliation. Record the exact source SHA and provider deployment identity.
2. Resolve the dependency findings with a reviewed compatible dependency/build-chain change, or obtain an explicit accountable release exception that states exposure and compensating controls. Do not silently bypass `verify:release`.
3. Confirm the intended production project/database from current provider configuration. `APP_DATABASE_URL` takes precedence over `DATABASE_URL`; do not apply the schema to a similarly named legacy project.
4. Before any production migration, establish an independently recoverable backup and verify a restore on an isolated target. Record an accountable maintenance/rollback decision and source/database compatibility.
5. Inspect the guarded read-only migration plan and matching journal for the exact candidate and target. Production 0011/0012 are already adopted: no replay is proposed. If a later candidate adds a migration, review its exact SQL, compatibility, restricted migration role and isolated rehearsal before separate approval to apply. Do not create organization users or broaden unrelated finance permissions.
6. Deploy the exact reviewed source. Require `ADMIN_AUTH_MODE=database`, a valid `AUTH_KEY_PEPPER`, correct runtime database configuration and `APP_BASE_URL` set to the actual deployment origin. Missing origin configuration intentionally blocks workspace writes in production. Never put privileged database credentials into public frontend variables.
7. Use real authenticated sessions to verify own-record CRUD, another account's 404, stale-version 409, repeated request replay, rejected origin, immutable history, denied unauthorized asset observation, public review/publish/withdrawal, safe error messages and no private API caching. Use synthetic fixtures with a documented retirement path, not client records.
8. Check public `/journey`, existing case studies, admin navigation, narrow layout and media click consent. Verify API security headers on the deployed serverless path, not only static local pages.
9. Confirm that communications, treasury and other applications retain their existing independent permissions. Test provider integrations only after their credentials, consent, cost and incident procedures are defined.
10. Record the release decision and evidence. If a rollback is needed, revert the application release while preserving the additive tables/history. Do not delete audit history or reset the production database as a routine rollback.

The application does not set database role grants, TLS policies, Vercel WAF rules, physical network controls, endpoint agents or security alert integrations. Those require separate infrastructure implementation and certification.
