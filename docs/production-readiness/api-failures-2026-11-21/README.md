# Production reliability: request failures

Baseline: `e5a4b4bef7e19d262f2940d7d231ecbf4602aa92`. Implements completion-backlog B03 and starts B01/B02. This change does not certify the entire business platform.

## Result

Express 4 now receives rejected promises from 120 previously bare route/middleware callbacks through the existing `asyncHandler`. Existing guarded handlers remain guarded. The shared boundary classifies Zod input failures, known PostgreSQL integrity/conflict errors and temporary database failures without returning SQL, credentials, driver messages or stack traces. Responses include a request identifier, `no-store`, bounded validation fields and retry guidance for temporary unavailability. Unknown portfolio failures reach the shared boundary; existing portfolio-specific client responses remain compatible.

`server/api-reliability.test.ts` covers the actual app with real database-backed sessions and isolated PGlite migrations. It exercises invalid unsubscribe input, malformed JSON, public body limits, authorization, duplicate content and injected database failures across content, portfolio, revenue, capital, treasury, email, campaigns and engineering. Requests have a 1.5-second response / 3-second total test deadline. SQLSTATE fixtures additionally verify nested-driver classification and redacted output/logs. Engineering's existing missing-schema response remains 503.

The initial classification run reproduced 16 failing expectations. After correction, `npm run verify:release` passes: 134 tests / 13 files, TypeScript, certification syntax, frontend/server build, both production import graphs and dependency audit. Production audit: zero findings. Full audit: six moderate findings, zero high/critical; no exception applied. See `verification.log`.

No client file, style, migration, package/lockfile, production data, hosted workflow or provider configuration is changed. Database failure fixtures exist only inside local test databases. Test results establish local request behavior; Vercel Preview and production provenance are separate release gates.

## Remaining business completion gates

| Domain | Existing contract | Remaining acceptance |
| --- | --- | --- |
| Acquisition | Contact/consultation creates a durable contact and lead for operator follow-up | Contact path currently permits partial persistence; atomic failure/retry proof is pending |
| Commercial finance | Revenue/cost evidence, invoices/collections, treasury and authorized capital deployment | All financial mutations must share their audit transaction; idempotency, approval concurrency, exact amounts and complete reporting remain pending |
| Owner access | Database session, permissions, account status and session revocation | Secure recovery, delegated enrollment/MFA and owner browser acceptance remain pending |
| Content/portfolio/engineering | Authorized draft/review/publication, private-record ownership and approved public projection | Long-form payload contract and complete browser lifecycle certification remain pending |
| Communications | Outbox, worker, sender, delivery callbacks, suppression and unsubscribe | Lease recovery/fencing, configured provider, controlled-recipient proof and scheduling remain pending |
| Membership | Customer identity, billing lifecycle, verified customer entitlements | Missing customer auth, webhook/parser repair, recurring lifecycle and merchant settlement readiness remain pending |
| Operations | Exact-release verification and isolated Preview; safe migrations and recoverable releases | Migration history/target safeguards, executable security scan, alerts, restore/rollback objectives and final owner handover remain pending |

A READY deployment, source test count or empty finance table does not establish customer receipts, real revenue or full production acceptance. Do not use production financial writes, real charges or external messages as software test fixtures.
