# PR #27 cleanup hardening after review

21 November 2026. This supersedes the original independent result for the subsequent reviewed source; see the PR body for final commit-addressed deployment and live runtime evidence.

## Changes

- Request JSON and session-cookie headers use files inside the existing private request directory, with mode 0600. Curl receives file references instead of credentials in process arguments. Response files are also created with mode 0600, and the directory is removed on success and failure.
- Budget closure and all treasury-evidence void updates commit with their audit events in the same database transaction. Audit persistence failure rolls back the cleanup update. Errors flow to the application's safe HTTP error handler.
- Budget closure takes the same row lock as approval before reading status. A matching Preview certification fixture can therefore be closed from the committed draft or approved state without a stale approval/close race. Reference validation, approval permission and the conditional status predicate are retained.

## Verification

`npm run verify:release` exits 0: 108 tests in 12 files, TypeScript, certification syntax, production build, production runtime import checks and release audits. Production audit: zero vulnerabilities. Full audit: six moderate findings and zero high/critical findings; no exception used.

The integration regression injects a PostgreSQL trigger that rejects cleanup audit inserts. Both handlers return HTTP 500, retain the original budget/balance state, and leave no cleanup audit rows. Once the failing trigger is removed, the same requests succeed and exactly two cleanup audit rows persist. Harness tests check private-file permissions, absence of password/session values from argv, and file removal on success and response-loss failures.

The earlier exact-head live run at `f59b574d284d1f41578d36ed7dd5fdd6850be7e0` passed HTTP 201/409, readback and cleanup; independent Neon readback confirmed both cleanup audit events. Its temporary branch variables and its credential-bearing certification deployment were removed. That historical run is not claimed as proof of the source changes above; the final live run is recorded in PR #27.

No client, lockfile, audit-policy or migration changes are included. Production main still has 2/10 inspected treasury tables and no allocation guard; the isolated Preview has 10/10 and an enabled guard. No production migration or financial test is part of this PR work.
