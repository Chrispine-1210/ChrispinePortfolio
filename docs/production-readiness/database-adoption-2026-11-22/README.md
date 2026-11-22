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

`scripts/migrations/connector-batch.ts` generates SQL but executes nothing. It verifies source hashes, a source-derived reference catalog and the production/environment boundary before generating a batch. The database statement rechecks actual database, branch, current role, runtime role privileges, the exact current catalog, journal checksums and the shared migration advisory lock. Role/ownership changes also require the reviewed current catalog before any grants or ownership transfers. It uses one server transaction, so schema and history commit together. Execute generated `.json` statement arrays with `run_sql_transaction`, or generated `.sql` files in an operator client with error-stop enabled. Separate SET LOCAL statements configure the statement/lock budgets before DO starts; each DO refuses unbounded or excessive session budgets. Setting statement_timeout inside DO cannot start its outer timer, so that initial implementation was corrected following review. A real slow native migration was canceled by the outer timer and left both schema and history unchanged. PostgreSQL timing reference: https://www.postgresql.org/docs/18/runtime-config-client.html . SQL values are collision-safe dollar-quoted. Existing baseline adoption inserts history only; it does not replay old source SQL or seeds. A repeated matching adoption is a no-op. Errors must be reconciled through catalog/history readback before another attempt.

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

Full `npm run verify:release`: PASS, 263 tests in 19 files; TypeScript, builds, runtime imports and audit policy pass. Production dependencies: zero findings. Full tree: six moderate, zero high/critical; no exception.

Independent native PostgreSQL 18.7 evidence in `native-role-proof.json` uses real simultaneous sessions and a disposable loopback-only cluster. It verifies baseline adoption/no-op replay, real runtime permission denials, normal DML, wrong role/branch rejection, migration-lock contention, complete rollback after a deliberately mismatched post-migration catalog, the pending migration, new-object grants and immutable-history exclusions. No production data is used. Tooling is installed outside application dependencies; the disposable cluster is removed afterward.

Native command:

```sh
node --import tsx scripts/qa/database-roles-native.mjs /tmp/portfolio-pg-qa/node_modules
```

## Production operational adoption

Production now has twelve matching baseline journal entries, recorded as `portfolio_migrator`; no historical migration SQL or business seeds were replayed. The final bounded connector execution rechecked the role policy and matching journal in transactions with timeouts configured before each operation. Both named roles have no superuser/create-role/create-database/BYPASSRLS flags. Runtime membership in the migration role, schema/database creation, financial deletion and audit mutation are all false. See `production-readback.json`.

All sixteen database aliases for the next production deployment and default Preview environment now use their restricted runtime credentials. Original shared development credentials were retained only in the development target; migration/operator credentials are excluded from new deployed runtime aliases. Existing historical deployment snapshots are not claimed to have changed. Application runtime activation still requires the subsequent merged production deployment and `/api/release` role readback, recorded on the PR.

The hosted application Preview at `c22953678347447c90831065c45fa26ec49112cf` reached READY using `portfolio_runtime`. Twenty-seven normal-password/RBAC and financial HTTP checks passed. Synthetic expense, invoice and collection fixtures were voided through the app, with six corresponding financial audits. The QA lead was archived, QA account disabled, password removed and active sessions reduced to zero. See `preview-runtime.json` and `preview-retirement.json`. Later changes affect the operator compiler, its verification and documentation; application behavior is unchanged from that Preview.

This source snapshot does not claim complete business readiness, restore certification or a signed-in owner admin-browser acceptance. No production financial fixtures, charges or provider messages were created.
