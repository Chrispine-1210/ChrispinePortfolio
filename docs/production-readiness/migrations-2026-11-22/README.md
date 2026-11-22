# Migration target and history safeguards

Source baseline: main `4959b4568e90257345e1009d98117dda22d78220`. Implements the engineering portion of production-completion ticket B04. No existing migration SQL, hosted workflow, production schema, production data, database role or permission has been changed or activated by this package.

## Corrected failure

The application prioritizes `APP_DATABASE_URL`, while the old operational runner read only `DATABASE_URL` and replayed every SQL file. The attached legacy integration can populate the latter with a different database. The guarded runner now compares its explicitly supplied direct migration connection with the same effective application-target resolver used by the server. It also verifies the connected database, migration role and actual `neon.branch_id` before any DDL.

All migration commands default to a read-only plan. Applying requires `--apply`. Unjournaled existing schemas cannot receive a blind replay: they require a reviewed structural baseline exported from an isolated database where the same source SQL was applied through the runner. Applied filenames/checksums must remain an exact prefix of the current source. Changed, missing, reordered or duplicated historical versions are refused before pending SQL. Malformed top-level SQL filenames are refused rather than silently omitted.

One direct session holds a transaction-scoped PostgreSQL advisory lock across schema/data changes and their history inserts. A second runner fails promptly. All pending files and their history commit together. A failed commit response is reported as uncertain; the operator must inspect the journal before another apply. A subsequent verified invocation skips any already committed file. Explicit transaction-control statements in migration files are refused; source SQL still requires normal review.

The journal lives in `chrispine_migrations.history`, with PUBLIC access revoked. A separately named migration role is mandatory; runtime superuser, role-creation/database-creation authority or membership in that migration role is rejected. Direct `db:push` is disabled, and Drizzle generation no longer loads a live database credential.

## Operator contract

Supply these through secure execution-environment configuration, never chat or shell arguments. Keep the migration credential outside the application's runtime environment: for local use, an ignored `.env.migrations` overlay can be loaded only by the migration command. The runtime process receives its own application credential only.

| Input | Required value |
| --- | --- |
| `APP_DATABASE_URL` or `DATABASE_URL` | Actual effective application connection; `APP_DATABASE_URL` wins |
| `MIGRATION_DATABASE_URL` | Separate migration-role credential, direct endpoint of that same database |
| `MIGRATION_ENVIRONMENT` | `preview`, `production`, `development` or `test`; must agree with `VERCEL_ENV` when present |
| `MIGRATION_EXPECTED_BRANCH_ID` | Explicit target Neon branch ID; production is pinned to `br-misty-wave-bb79bj7l` |
| `MIGRATION_EXPECTED_DATABASE` | `neondb` |
| `MIGRATION_EXPECTED_ROLE` | Migration role from the direct connection |

Preview/test/development cannot name the reviewed production branch. A production restore that changes that branch identity requires a reviewed source update. Pooler endpoints and connection options that can alter the effective target/search path are refused. Output contains target metadata and fingerprints, never credential URLs or raw driver errors.

Commands:

```sh
npm run db:migrate -- --plan
npm run db:migrate -- --apply
npm run db:migrate -- --export-baseline
npm run db:migrate -- --plan --baseline-file /absolute/reviewed-baseline.json
npm run db:migrate -- --apply --baseline-file /absolute/reviewed-baseline.json
```

For existing schemas, first build an isolated reference from all reviewed source files and export its baseline. Review and retain that artifact, then compare it against the target in plan mode. A matching adoption writes only history; it never replays the historical SQL or seeds. A mismatch stops adoption and requires schema/source reconciliation. There is no force/ignore-checksum/adopt-current flag. A database previously adopted through a baseline cannot serve as the reference authority for a new baseline.

The structural fingerprint covers the application's public relations, columns/defaults, constraints, indexes, functions, triggers, enum types, views, sequences and RLS policies. Object identifiers remain full-length text; native verification caught and corrected truncation of composite names longer than PostgreSQL's identifier length. This is structural adoption, not evidence that business rows, owner privileges, grants or provider-managed schemas were reconciled. Those remain separate operating checks.

## Verification

- `npm run verify:release`: PASS, **186 tests in 16 files**, including 29 migration regressions; TypeScript, certification syntax, frontend/server builds, runtime import checks and audits passed.
- Production dependency vulnerabilities: zero. Full dependency tree: six moderate, zero high/critical; no exception applied. Dependencies and lockfile are unchanged.
- Regressions cover effective-target mismatch, actual branch/database/role mismatch, credential separation, read-only planning, lock refusal, checksum/history changes, schema/history rollback, journal-write failure, uncertain commit reconciliation, wrong baseline schema/checksums, adoption without replay and the complete 12-file repository history.
- Native PostgreSQL **18.7**: two actual sessions exercised the runner; one held the migration transaction and the other received `MIGRATION_BUSY`. All 12 source files applied, a restart applied zero files, and an independently materialized legacy clone adopted the reference without replay. Temporary native databases were removed afterward. This is independent local evidence, not live Neon role/baseline activation.
- A previous connector-only Neon lock probe did not establish contention and is not counted as passing concurrency evidence.
- Command-line checks confirmed missing configuration and direct schema push refuse execution safely.

Native proof is reproducible with `scripts/qa/migration-native.mjs`, using external QA-only binary/driver tooling installed outside the application dependency tree. The launcher refuses Vercel and production mode, binds only to loopback, uses synthetic identities, and cleans up its cluster. See `native-postgres.json` and `verification.log`.

## Activation boundary

The code can ship without changing any database. Production journal adoption remains pending until dedicated credentials, least-privilege runtime access, an equivalent reviewed reference and actual target comparison have been completed. The runner intentionally refuses an unconfigured or unjournaled production apply. Do not report B04 operational adoption or full business readiness as complete on the strength of these source/local tests.
