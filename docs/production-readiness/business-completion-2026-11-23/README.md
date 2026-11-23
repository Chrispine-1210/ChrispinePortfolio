# Business completion — 23 November 2026

The broad implementation is authorized by the owner. This candidate combines the public redesign, membership/payment boundaries, durable financial receipts and exact-money controls, communication reconciliation, unsubscribe, encrypted account recovery, editorial concurrency and operating controls.

This increment replaces treasury row caps with PostgreSQL numeric full-window aggregates. Current UTC periods include their lower boundary and as-of; prior periods exclude the shared upper boundary. Voided/future evidence is excluded. Revenue lead/cost coverage is aggregated without join multiplication. Other financial/cohort reports read all eligible rows and use SQL cohort subqueries rather than one parameter per identifier. Detail-list limits remain separate.

A new local production recovery proof captured 57 public application tables plus migration history in one read-only repeatable-read connector transaction, preserving original row JSON text and numeric precision. All restored row counts/content fingerprints, schema objects and application table grants matched on disposable PostgreSQL 18. Login secrets were not cloned; restored runtime/migrator roles are NOLOGIN. Provider schemas, external media and operational secret custody remain separate. No production writes or restore occurred.

The encrypted backup is retained privately; its separate AES-256-GCM key is in Vercel development environment variable `PORTFOLIO_BACKUP_KEY_20261123`. No data archive or encryption key is committed. `scripts/qa/restore-connector-backup.mjs` accepts `{encryptedPath,encryptionKey}` on hidden stdin and replays only on a disposable loopback cluster. Source migrations are checked against the backup's history. The backup format is documented in the proof.

Verification: 325 ordinary tests passed, 9 native-only skipped; the expanded PostgreSQL 18 native suite passed 48 checks, covering all native-only cases with overlap. TypeScript, build, runtime import policy and advisory policy passed. Current production dependency audit is zero findings; six moderate development findings remain.

The isolated Neon Preview branch `br-restless-credit-bb387cat` adopted 0013 and 0014 with source/catalog/target guards and runtime grants. Billing, recovery and outbound delivery are disabled there until actual provider acceptance. Production remains at d116fcfa9c44cf66c0cc3dbb619c367b22c94243. Provider sandbox/merchant setup, controlled real transport, owner/mobile browser acceptance and GitHub-hosted assurance are not claimed by these checks.

## Completed operating workflows

Communications now has whole-queue counts, filtered cursor pagination, delivery records and paged event timelines without returning message bodies/callback payloads. Reconciliation records provider evidence and rejects a different known provider message ID. Email queue and campaign creation require an actor-bound durable reference; atomic insert/audit and original-content conflict checks prevent duplicate intent after a lost response. The UI retains only hashes/references, offers receipt lookup, and distinguishes fanout, provider acceptance and delivery. No dispatch occurs in these request paths. Provider configuration and activation remain disabled on Preview.

Financial evidence decisions now use exact record counts rather than rounded coverage percentages. Tax coverage must span the full reporting interval. UTC millisecond intervals and cumulative monetary allocation prevent shared-boundary and rounding duplication. Economic profit preserves cents and large-balance averages do not overflow an intermediate sum. The sign-in form submits actual named browser fields to support secure autofill without depending on React change events.

Actual Postmark test-API transport from this executor timed out; that is not provider acceptance proof. Current hosted Quality/CodeQL jobs failed before executable steps, with no rerun requested. Normal owner authentication remains unconfirmed: the secure browser request returned submitted, but no session or login audit was observed. Mobile/native browser input was unavailable; no mobile-device certification is claimed.
