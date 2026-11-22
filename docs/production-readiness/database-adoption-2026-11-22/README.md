# Operational database separation and migration adoption

Source baseline: production `f5e728526d3b566a97c44462f434a155896b43e0` (PR #39). This delivery addresses operational B04. Financial idempotency, exact-money/concurrency rules, recovery, billing, provider delivery, restore certification, owner admin-browser acceptance and GitHub-hosted assurance remain distinct gates.

## Source authority and target comparison

A fresh, source-only PGlite reference independently applied all twelve original migration files through the guarded runner. Reference checksum files and complete catalogs are retained here. No existing SQL migration was changed. The reference digest is `fb3449de6524fa4517834ff5de672708c9f388f8d926c92d0ab77d7ae301d67a`.

Read-only catalog comparison established:

| Database | Schema objects | Reference difference |
| --- | ---: | --- |
| Production `br-misty-wave-bb79bj7l` | 1,599 | Exact match to all twelve source migrations |
| Existing Preview `br-restless-credit-bb387cat` | 1,488 | Exact match through migration 0010; 0011 was missing |

The project refused a new branch with `branches limit exceeded`. Existing backup branches were preserved. Workspace WebSocket connectivity failed, so operations use a single PostgreSQL DO statement through Neon's supported SQL connector, authenticated as the named migration role. The direct-session runner remains available for operator environments with database network access. No runtime connection contains migration credentials.

## Guarded connector batches

`scripts/migrations/connector-batch.ts` generates SQL but executes nothing. It verifies source hashes, a source-derived reference catalog and the production/environment boundary before generating a batch. The database statement rechecks actual database, branch, current role, runtime role privileges, the exact current catalog, journal checksums and the shared migration advisory lock. It uses one server transaction, so schema and history commit together. SQL values are collision-safe dollar-quoted. Existing baseline adoption inserts history only; it does not replay old source SQL or seeds. A repeated matching adoption is a no-op. Errors must be reconciled through catalog/history readback before another attempt.

A pending-migration batch verifies the prefix history and before/after catalogs, and records newly applied source checksums in the same transaction. No force-adopt, checksum-ignore or destructive-reset option exists. The connector compiler uses the same lock keys and history schema as the original direct-session runner.

Reproduce the independent reference and prepare reviewable SQL without connecting to any application database:

```sh
node --import tsx scripts/qa/export-migration-reference.ts
node --import tsx scripts/qa/prepare-adoption-batches.ts preview br-restless-credit-bb387cat /tmp/preview-adoption
node --import tsx scripts/qa/prepare-adoption-batches.ts production br-misty-wave-bb79bj7l /tmp/production-adoption
```

## Database roles

`portfolio_runtime` and `portfolio_migrator` are separate login roles, created with Neon's explicit scoped `read_write` access rather than the default administrative access. Neither has superuser, CREATE ROLE, CREATE DATABASE or BYPASSRLS attributes. Credentials remain in provider-managed role storage; only the runtime connection is supplied to the application environment.

The migration role owns application tables/functions/enums and may create objects only within the application database. The connected operator retains membership for maintenance. Role-policy changes use the same advisory lock as migrations, with a five-second lock timeout and a sixty-second statement budget. The runtime role owns no application objects and is not a member of the migration role. It receives schema usage, ordinary data access and sequence usage; DELETE is restricted to the small existing set of routes that actually remove mutable records. Financial ledger deletion, TRUNCATE, trigger/reference privileges, immutable-history mutation and migration-journal access are denied. Newly migrated objects receive runtime privileges through migration-role defaults; known immutable history tables receive explicit mutation exclusions. Provider/extension-owned objects and service roles are excluded from ownership changes.

`/api/release` adds the connected database role to existing public release metadata, enabling live confirmation of the actual runtime credential without disclosing secrets.

## Preview rehearsal

The existing isolated Preview successfully adopted eleven matching history entries without replay, applied `0011_engineering_workspace.sql` atomically, and reached the twelve-file reference. Named-role SQL readback confirms application access under `portfolio_runtime` and denied schema/database creation, financial deletion and audit update privileges. All sixteen database URL/user/password/host aliases in this branch-specific Preview are mapped to its restricted runtime credential, preventing legacy owner secrets from remaining in the runtime environment. Exact-head hosted application verification and production activation are recorded on the PR.

## Verification

Full `npm run verify:release`: PASS, 256 tests in 19 files; TypeScript, builds, runtime imports and audit policy pass. Production dependencies: zero findings. Full tree: six moderate, zero high/critical; no exception.

Independent native PostgreSQL 18.7 evidence in `native-role-proof.json` uses real simultaneous sessions and a disposable loopback-only cluster. It verifies baseline adoption/no-op replay, real runtime permission denials, normal DML, wrong role/branch rejection, migration-lock contention, complete rollback after a deliberately mismatched post-migration catalog, the pending migration, new-object grants and immutable-history exclusions. No production data is used. Tooling is installed outside application dependencies; the disposable cluster is removed afterward.

Native command:

```sh
node --import tsx scripts/qa/database-roles-native.mjs /tmp/portfolio-pg-qa/node_modules
```

Production operations remain pending in this source snapshot until the exact-head application Preview passes. Live execution, runtime-role activation and readback are recorded separately on the PR. This source snapshot does not claim complete business readiness or backup/restore certification.
