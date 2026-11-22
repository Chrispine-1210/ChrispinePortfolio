# Financial writes and their audit records

Implements the transaction portion of production-completion ticket B05. Based on the migration-safety source from PR #37. No migration SQL, dependencies, UI, business amounts, provider configuration or GitHub workflow changes are included.

## Corrected failure

An injected database audit failure reproduced partial business writes in 19 financial operations. These operations could return a server error after the business record had already persisted. The affected creates now insert their financial record and audit event in one database transaction, and respond only after that transaction commits.

Collection reversal now commits the collection's void state, recalculated invoice status and audit together. Invoice voiding and collection creation/reversal lock the parent invoice in the same order. Existing record corrections take a row lock before capturing the audit's previous state. Audit helpers require an explicitly supplied transaction writer, preventing accidental fallback to a separate global connection.

These transactions protect the relationship between financial changes and audit history. They do not make an unknown HTTP write outcome safe to retry: an uncertain commit can still have succeeded. The existing `WRITE_OUTCOME_UNKNOWN` response and manual reconciliation instruction remain in force until persistent request idempotency is implemented.

## Verification

`server/financial-atomicity.test.ts` exercises actual authenticated Express routes against isolated PostgreSQL-compatible PGlite databases initialized from all 12 source migrations. The disposable authentication principal has the super-administrator application role; this is local test setup, not a production identity or bypass of live authentication.

For each of 40 operations, the test prepares valid prerequisites, snapshots all 23 relevant financial, lead and audit tables, then installs a trigger that rejects the next audit insert. It checks a bounded HTTP 500 with redacted `WRITE_OUTCOME_UNKNOWN`, no `Retry-After`, and an unchanged complete database snapshot. After the trigger is removed and rollback is established, the test confirms the operation succeeds and writes exactly one matching audit for its HTTP request ID.

| Area | Tested operations | Cases |
| --- | --- | ---: |
| Revenue | Agreement create/end/void; event create/void; direct cost create/void; cost attestation create/void | 9 |
| Cash, retention, capacity and budgets | Invoice create/void; collection create/void; recurring movement create/void; capacity create/void; budget create; allocation create/update; budget approve/close | 13 |
| Treasury and return evidence | Nine creation paths and seven supported evidence void paths, including deployments and hurdle approval | 16 |
| Acquisition | Spending create/void | 2 |

Before the fix: 19 failed, 21 passed. After the fix: all 40 pass. The local rollback proof establishes when a test retry is safe; it is not advice to retry an uncertain live response.

Full `npm run verify:release`: **PASS, 226 tests in 17 files**. TypeScript, certification syntax, frontend/server build, production import checks and dependency policy passed. Production dependency audit: zero vulnerabilities. Full dependency tree: six moderate, zero high/critical; no exception applied. See `verification.log`.

## Evidence boundaries and remaining work

- This failure-injection proof is local. It does not establish live Neon fault injection or concurrent-session financial certification.
- Persistent scoped request idempotency, payload conflict handling, replay after response loss and restart/concurrent request certification remain open (B06).
- Period/policy uniqueness and overlap protection, exact decimal money, blank-value/date rules and reporting completeness remain separate work (B07–B09).
- Migration target/history safeguards are implemented in PR #37; production journal adoption and least-privilege migration/runtime roles still need operational certification.
- Recovery, billing, provider delivery, restore evidence and GitHub-hosted assurance remain separate release gates. A successful build or this matrix does not certify full business readiness.
- No production financial fixtures, real customer records, charges or provider messages were created for these tests.
