# PR #27 reconciliation and independent release verification

This initial record is supplemented by [review hardening](review-hardening.md). The PR body records the final commit-addressed verification and live certification.

PR #27 is reconciled with production/main `6948033ae66cb8138ac856f9fecca4c23b88be78`. The previous PR head was `60e5ffd7a7e6e7ec22a8de0bbd965d4e33d5d779`.

## Change

The two merge conflicts were resolved by retaining main's CommonJS/ESM import-extension coverage and combining main's runtime-import/audit gates with the Preview certification syntax gate. All client files, the lockfile, the existing audit policy and CodeQL workflow are byte-identical to main. The quality workflow now calls the same `npm run verify:release` command used by Vercel, and supports manual dispatch after GitHub clears the billing lock.

The PR retains its Preview-only recovery of ambiguous budget and deployment creation responses, marker-scoped cleanup, draft-budget closure controls, non-secret release provenance, and temporary-admin cleanup actor handling. Existing database-mode permission checks remain enforced.

## Independent CI workaround

The owner requested an independent execution route while the GitHub billing lock remains. A clean locked install and the canonical release suite ran in the Codex workspace on Node 24.22.3 / npm 11.19.1. The command exited 0: TypeScript, certification script syntax, 107 tests in 12 files, production client/server builds, production runtime import classification and dependency audits all passed. The production audit found zero vulnerabilities. The full audit reported six moderate findings, zero high/critical findings, and used no exception.

`independent-release.log` contains command output. `independent-release.json` records the executor, lock/log digests and result boundaries. These are independent executable results, not a GitHub-hosted CI pass. The unchanged Vercel build configuration runs the same command and supplies a second, commit-addressed execution route on Preview.

The existing owner-approved audit policy is unchanged, including its expiry of 25 November 2026 at 00:00 UTC. It does not exempt production vulnerabilities, new high/critical advisories, changed locks or failed audit transport.

## Runtime evidence boundary

The isolated authenticated Preview sequence previously passed on `4a1cf0d62eb8e4cb44d6dc4db9dfa7b889df1dad`; see PR #27 comment 6916501194. That evidence is historical. The current release suite exercises actual authenticated financial HTTP routes against an isolated PGlite PostgreSQL engine, including valid capital deployment HTTP 201, over-allocation HTTP 409 and database permissions. The certification-script tests additionally exercise lost-create reconciliation, marker-scoped cleanup and changed-release rejection with a mocked Vercel transport. Neither test mode is a new live Preview certification.

A current-head live certification requires an authenticated Vercel CLI and application admin, the immutable deployment hostname, exact Git SHA and isolated Neon branch `br-restless-credit-bb387cat`. Run `npm run certify:treasury-preview` with `CERT_BASE_URL`, `CERT_ADMIN_EMAIL`, `CERT_ADMIN_PASSWORD`, `CERT_EXPECTED_GIT_SHA` and `CERT_EXPECTED_DATABASE_BRANCH_ID`. The harness fails closed before financial writes on a provenance/isolation mismatch and reports cleanup uncertainty as a failure.

GitHub Actions/CodeQL remain separately unexecuted while the account lock persists. No runner success, CodeQL clearance, current-head live Preview certification or production financial activation is claimed by this record. No production database changes are part of this work.
