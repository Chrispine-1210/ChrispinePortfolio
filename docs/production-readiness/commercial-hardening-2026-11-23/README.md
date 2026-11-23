# Commercial hardening candidate — 23 November 2026

Decision: HOLD production activation. This is an isolated implementation candidate based on `52b135e4b373dcd024769a8a3d66724a59858550`. The production release remains `d116fcfa9c44cf66c0cc3dbb619c367b22c94243` in the evidence reviewed. Branch: `agent/commercial-hardening-20261123`. No branch was pushed, workflow rerun, deployment triggered, production migration executed, real payment requested or real email sent by this work.

## Gate register

| Gate | Current result | Evidence still needed |
| --- | --- | --- |
| Production migration adoption and runtime roles through 0012 | Prior production proof retained; read-only history count is 13 | Forward 0013 and grants need separately reviewed isolated adoption, then approved production execution |
| Current production backup | BLOCKED — create_snapshot returned HTTP 422, `snapshots limit exceeded` | Owner capacity/retention decision; a new current snapshot must succeed |
| Restore certification | NOT EXECUTED — 10 retained branches fill current allowance | New private restored target; schema/history/grant/business/receipt/audit comparisons; measured recovery time and approved recovery objectives |
| Member identity and premium boundaries | Implemented; isolated HTTP tests pass | Exact-head hosted Preview, real member/owner browser journeys |
| Recurring payment lifecycle | Sandbox implementation and synthetic signed-event tests pass; disabled by default | Actual configured provider sandbox checkout, invoice/cancel/expiry/reordering tests; price/currency/tax/refund policy and activation decision |
| Monetary correctness | Bounded decimal validation, minor-unit arithmetic, explicit apportionment, report snapshot/completeness guards implemented | Exact-head isolated hosted certification and owner financial acceptance |
| Financial concurrency/idempotency | Native independent-session checks pass, including distinct-key collection/hurdle contention and prior receipt restart/disconnect proofs | Preview certification and unchanged exact head before merge |
| Delivery uncertainty and lease recovery | Implemented; native SQL/HTTP checks pass | Real controlled mailbox/provider acceptance, bounce/complaint callback and operator reconciliation acceptance |
| Newsletter/campaign execution | Explicit unsubscribe confirmation and consented email queue batches implemented | Provider delivery proof and approved scheduler; SMS/push remain unsupported by campaign creation |
| Account recovery | OPEN | End-to-end recovery/token/session-revocation/delivery acceptance; no recovery guarantee inferred from email repairs |
| Owner admin-browser acceptance | OPEN | Owner sign-in on exact candidate, role/navigation/content/financial/reconciliation journeys and recorded owner decision |
| GitHub-hosted assurance | BLOCKED/UNVERIFIED | Account owner resolves established billing restriction; fresh exact-head Quality/CodeQL results after an approved trigger |
| Production activation | HOLD | All required gates above and explicit owner activation approval |

## Implementation

Membership now resolves a database-backed session through `/api/auth/user`; legacy `users.is_admin` and `users.is_premium` flags do not grant access. Administrative navigation derives from live permissions. Public article lists/search use an explicit projection; premium bodies remain behind permission or a current recorded entitlement. The historical `/api/login` route redirects to `/login`.

Billing replaces the unauthenticated one-time payment-intent path with server-priced Stripe hosted subscription checkout. Live mode is unsupported. `BILLING_MODE=disabled` is the default. A durable per-user request and a unique unresolved-checkout boundary prevent automatic replacement after an uncertain outcome. Provider requests use a stable idempotency key; the browser saves its reference before submission and inspects an existing reference without creating another checkout. Webhooks verify the actual raw Buffer, retain immutable event receipts, serialize subscription reconciliation and read current provider state rather than trusting event order. Paid entitlement requires matching user, checkout, configured price, customer, invoice subscription and unexpired period. A checkout return URL never grants access.

Money accepts at most two fractional digits within numeric(14,2). Exact minor-unit arithmetic replaces financial accumulation and enforcement decisions. Prorated currency rounds half away from zero. Percentage/time estimates remain estimates. Reports read a repeatable-read, read-only database snapshot. Capped queries fetch one sentinel row and reject an incomplete report instead of publishing partial totals. Distinct-key hurdle approvals share a transaction-scoped currency lock. Existing financial request receipts remain intact.

Delivery separates definitive provider rejection from uncertain acceptance. An expired processing lease is quarantined, never blindly retried. Worker ownership is checked before state changes. If a provider accepted a message but persistence failed, its identifier is retained when possible and the message remains uncertain. Authenticated callbacks can correlate metadata plus recipient to recover lost acceptance; stronger suppression states survive a late delivery callback. Operator reconciliation requires a dedicated super-administrator permission, provider reference and justification. A known accepted message cannot be marked safe to resend. Postmark calls have a five-second timeout and the HTTP worker claims at most three messages per invocation.

Campaign creation accepts only supported email delivery to the newsletter-subscriber audience. One bounded transaction queues a recipient batch with a unique campaign/recipient key and unsubscribe token; enqueue completion is explicitly separate from provider delivery. No scheduler, SMS worker, push sender or real campaign has been activated. Unsubscribing preserves stronger bounce/complaint suppressions.

## Reproducible verification

```bash
npm run verify:release
node scripts/qa/commercial-hardening-native.mjs /absolute/external-qa/node_modules
```

The native runner uses external QA-only `@embedded-postgres/linux-x64` and `pg`, starts a private loopback cluster with UTC time, supplies only fixture variables to child test processes and removes the temporary cluster. It does not add production dependencies. Its native PostgreSQL 19 proof is not evidence of a Neon restore, production runtime acceptance, hosted GitHub execution or actual Stripe/Postmark transport.

Validation: `npm run verify:release` passed with 302 tests passing and six native-only checks skipped in that ordinary run. All six are covered in the separate 29-test native run, which passed without skips. TypeScript, certification-script syntax, production build and runtime imports passed. The dependency policy passed with zero production findings and six moderate findings in the full development dependency tree (no high/critical findings). See `native-proof.json` and `verification.log` for the completed run. Native checks include real independent database sessions, actual HTTP disconnection, restart in a fresh application process and signed webhook parsing with the actual Stripe SDK. Provider operations themselves are injected fixtures; no provider funds or real recipients are involved. Ordinary tests skip native-only cases, which are exercised by the separate native runner.

## Forward migration 0013

This candidate adds `0013_commercial_boundaries.sql` only. Never replay 0000–0012 or rerun historical seed scripts against an adopted database. Local migration-runner tests prove a 13-file history plans exactly 0013, applies it once and preserves an existing user and prior permission records. Fresh 13-file prefix and 14-file candidate catalogs/checksums have been generated. The prefix exactly matches the prior reviewed 0012 reference. Guarded Preview and production SQL/JSON batches are prepared in `preview/` and `production/`; none were executed. Hosted adoption still requires comparing the actual target against that prefix. Existing 0012 preparation scripts deliberately reject this 14-file source; they must not be reused unchanged.

Before applying on an approved isolated branch: compare actual branch/database/role, existing 13 checksums, catalog and current email status values against the new state constraint; capture a recovery boundary; use the migration role and the guarded runner; apply the reviewed runtime grant policy afterward. Runtime must not update/delete/truncate billing event receipts, financial receipts, content versions or audit records. Recheck all four immutability categories, role separation, absence of ownership/DDL authority and request behavior. Migration does not activate billing or outbound delivery. Never apply this file to production until restore certification and the exact action are approved.

The production alias was re-read after validation: deployment `dpl_JAxPkYZdHmBxsKJCdMJoW6VM4PD6` remains READY on `main` at `d116fcfa9c44cf66c0cc3dbb619c367b22c94243`. This is deployment/source evidence only.

## Smallest safe continuation

1. Resolve Neon snapshot and branch capacity without silently deleting retained backups or purchasing a plan. Approve the exact retention/cost/target. Create a current production snapshot, restore into a new private branch with `finalize:false`, disable all restored outbound/payment workers, and verify schema/history/grants/data/receipts/audit consistency. Record backup boundary, elapsed recovery and approved RPO/RTO.
2. Review this diff and publish only the frozen candidate to an isolated Preview after showing the exact push/deployment action. It must use an isolated database, sandbox billing and a controlled mailbox, with no production credentials or public exposure of restored data. Apply 0013 only after its catalog/checksum preflight. Complete real provider sandbox tests and failure/reconciliation checks.
3. Complete owner browser acceptance on that same commit. Resolve GitHub account billing separately; show the exact workflow trigger before execution and collect successful Quality/CodeQL evidence. Refresh current backup proof if it has aged outside the owner's recovery objective. Only then request a distinct production activation approval.

## Remaining limits

Live membership sales, refunds/disputes/taxes, account signup/recovery, real delivery, provider scheduling, restore certification and owner/browser/hosted acceptance are not certified. Checkout requests that become uncertain require provider-assisted reconciliation; this candidate intentionally offers no automatic reset/retry after an unknown provider outcome. Subscription-change callbacks without a message association are not a complete provider suppression synchronization service. Editorial stale-save conflicts, public abuse-control assurance, persistent aggregate analytics, SEO resources and the separate NetOps import issue from the full scan remain outside this repair candidate.

Primary integration references: https://docs.stripe.com/webhooks ; https://docs.stripe.com/billing/subscriptions/webhooks ; https://postmarkapp.com/developer/webhooks/webhooks-overview ; https://postmarkapp.com/developer/webhooks/subscription-change-webhook .
