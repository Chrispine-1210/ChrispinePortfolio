# Durable commercial intake

Depends on the API failure boundary in PR #35 (`19e986bc4aa29dc85b2050c004426f06cb055178`). Addresses the orphaned-contact and notification-persistence findings in B11. It does not close request idempotency or external delivery acceptance.

Contact capture now commits the contact, lead, creation activity and configured acknowledgement/operator outbox and inbox records in one transaction. Consultation capture also queues its configured notifications within its existing transaction. A lead/activity/outbox/inbox failure returns a safe failure and rolls back the whole intake; a clean retry then records one complete enquiry. No provider call occurs during intake.

The shared contact contract validates email, names, service references, message length and allowed preferences against the actual CRM column limits. It rejects unknown fields. The contact UI uses the same contract, adds field limits/autocomplete, retains entered values after failure, displays an accessible inline error, and confirms recorded receipt without claiming external message delivery or an unsupported response deadline.

## Verification

The initial twelve new HTTP tests failed against the previous behavior. The corrected release passes `npm run verify:release`: 146 tests in 14 files, TypeScript, certification syntax, frontend/server build and production import checks. Dependency audit: zero production findings; six moderate full-audit findings, zero high/critical; no exception applied.

The tests use isolated PGlite migrations, synthetic `.invalid` addresses and inserted PostgreSQL failure triggers. They prove rollback and retry after rejected transactions for contact/lead/activity/email/inbox and consultation/email failures; accepted intakes have the expected linked records. No external message is sent.

The existing isolated QA adapter also now exports its local query adapter, repairing a missing `pool` export exposed by the release-identity endpoint. The guarded QA launcher builds and starts without a configured external database. The cloud browser could not connect to this loopback server, so visual/browser acceptance is NOT claimed. This is separate from the passing HTTP tests and compiled frontend.

## Remaining boundaries

- Lost-response or simultaneous duplicate submissions still require persisted idempotency keys and the migration safeguards package; transaction rollback alone does not deduplicate an already-committed request.
- Provider credentials, verified senders and controlled-recipient delivery remain separate acceptance gates. When sender configuration is absent, intake still persists for manual operator follow-up and does not claim an email was sent.
- The existing unlinked production contact is not automatically classified or backfilled.
- New financial correctness, account recovery, billing and operational readiness remain in the production completion backlog.
- Vercel's Git-backed Preview provisioning for PR #35 failed before build; local verification is not live Preview proof. Production has not been changed by this branch.
