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

## Live isolated Preview

Reviewed application head `28d0d8c8af8e96b9f9eb06f680f5df1c86dd81ad`, deployment `dpl_FpMSpV5j4yaYMbBKxauAgUJL34Py`: READY. Before every financial write, `/api/release` confirmed that exact immutable deployment, environment `preview` and database `br-restless-credit-bb387cat`.

All 32 HTTP checks passed using normal password authentication with a disposable `finance_manager` application identity. Anonymous and logged-out identity requests returned 401; budget and hurdle approval attempts returned 403. Expense, invoice and collection creation returned 201. A partially collected invoice could not be voided (409). Reversing its collection returned 200 and changed its status from `partially_paid` to `issued`; subsequent invoice and expense voids returned 200. Treasury evidence/intelligence readback returned 200. Logout was confirmed with a subsequent 401.

Database readback confirmed all three financial fixtures voided, six matching financial audit events, the synthetic lead archived/lost, the disposable account disabled with its password removed, and all its sessions revoked. The temporary hosting share was revoked. Records and audit history were retained; no database rows were deleted. See `preview-runtime.json` and `preview-readback.json`. These are synthetic XTS fixtures, never customer, cash or revenue evidence. No production financial writes were made.

CodeRabbit completed review of that application source with no blocking defect. Its one test-quality recommendation was implemented: the rollback matrix now also asserts `issued` after successful collection reversal. A complete release verification passed again after that assertion. The follow-up changes only this assertion and evidence files; live runtime proof remains tied to the exact reviewed application head above.

## GitHub assurance blocker

Quality run `44986102526` and CodeQL run `44986102500` failed before execution. Their check annotations state: **“The job was not started because your account is locked due to a billing issue.”** Neither workflow edits nor repeated runs address this account restriction. No manual rerun or workflow change was made. Account-owner billing resolution is required before a new exact-head run can establish hosted assurance. Local and Vercel verification do not certify a GitHub CodeQL pass.

Codex's automated review did not complete because its account code-review allowance was exhausted. This is recorded as unavailable, not a passing review or a source finding. CodeRabbit's application review and the local/Preview evidence are separate evidence sources.

## Evidence boundaries and remaining work

- This failure-injection proof is local. It does not establish live Neon fault injection or concurrent-session financial certification.
- Persistent scoped request idempotency, payload conflict handling, replay after response loss and restart/concurrent request certification remain open (B06).
- Period/policy uniqueness and overlap protection, exact decimal money, blank-value/date rules and reporting completeness remain separate work (B07–B09).
- Migration target/history safeguards are implemented in PR #37; production journal adoption and least-privilege migration/runtime roles still need operational certification.
- Recovery, billing, provider delivery, restore evidence and GitHub-hosted assurance remain separate release gates. A successful build or this matrix does not certify full business readiness.
- No production financial fixtures, real customer records, charges or provider messages were created for these tests.
