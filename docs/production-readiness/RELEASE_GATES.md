# Release gate register

Evidence cutoff: 23 November 2026. Full business release: HOLD.
This is the current decision register. Historical reports retain their original
scope and dates; a passing deployment never closes an unrelated runtime gate.

## Local candidate implementation

Branch `agent/release-gates-editorial-20261123` is based on the main SHA below.
The documentation correction, three story-photo captions and neutral shared
software photograph are implemented locally. A genuine unpublished note is
prepared under `docs/editorial/drafts/`; it is not seeded into live databases.

Fresh local verification passed `npm run verify:release`: 284 tests passed,
four native-only checks skipped, TypeScript/build/runtime imports/audit policy
passed. Nineteen checks against the disposable PGlite application prove draft
privacy, the normal publication workflow and the actual rich-content renderer.
See [local implementation evidence](release-gates-editorial-2026-11-23/README.md).
Browser/layout and hosted acceptance remain unverified: browser launch was
blocked by workspace restrictions and the cloud browser could not reach loopback.
No push, hosted publication, deployment or production write has been performed.

## Baseline and evidence provenance

- Main: `d116fcfa9c44cf66c0cc3dbb619c367b22c94243`.
- Production: `dpl_JAxPkYZdHmBxsKJCdMJoW6VM4PD6`, READY, main at that SHA,
  assigned to https://chrispine-portfolio.vercel.app. Provider deployment identity
  and current main were rechecked on 23 November 2026.
- Production database: project `twilight-meadow-16888716`, branch
  `br-misty-wave-bb79bj7l`, database `neondb`, runtime `portfolio_runtime`.
- The retained readiness review at approximately 08:00 Africa/Blantyre on
  23 November records 13 matching journal entries through 0012 and restricted
  runtime/migrator roles. Those SQL checks were not rerun for this reconciliation.
- PR #41 Preview: `dpl_AZ7hE77zUoGmXCASWmFZBK7V86ok`, source
  `c0e14c5207d56a3ead59959cc4ac9f9f6bf76bbf`, isolated branch
  `br-restless-credit-bb387cat`; retained evidence records 23 authenticated checks.
  This is historical Preview evidence, not a new owner-browser acceptance.

## Gates

| Gate | Status | Evidence boundary / required closure |
| --- | --- | --- |
| Readiness documentation | IMPLEMENTED LOCALLY | One gate register replaces stale universal claims and obsolete migration instructions. Changes are unpushed; historical evidence remains intact. |
| Merged source / deployed production | VERIFIED | Current main and provider READY identity agree; no redeploy needed for this gate. |
| Migration adoption / restricted roles | VERIFIED in retained production SQL evidence | All 13 journal entries through 0012; runtime identity and restricted grants. Do not replay 0011/0012. |
| Persistent request idempotency | VERIFIED within recorded scope | 14 native checks and 23 hosted Preview HTTP checks; production schema active. Owner browser acceptance remains separate. |
| Monetary precision / distinct-key conflicts | OPEN | Same-key receipts do not prove exact arithmetic or cross-key invariants. Require a reviewed patch, independent native PostgreSQL sessions and isolated Preview fixtures. |
| Current backup / restore | CAPACITY BLOCKED / UNVERIFIED | Account branch limit is 10, with 10 retained branches. Latest listed manual snapshot is from 18 November; schedule empty; history retention six hours. No certified restore. Preserve all existing backups. See the exact proposed operations in the local evidence directory. |
| Delivery | IMPLEMENTED FOUNDATION / UNVERIFIED RUNTIME | Require approved sender, recipient, consent, cost and callback/retry scope before controlled sends. |
| Account recovery | INCOMPLETE | Require reviewed expiring single-use recovery, enumeration controls, session invalidation and controlled delivery proof. |
| Billing | INCOMPLETE | Ownership/metadata and fixed-price source gap plus sandbox lifecycle acceptance remain. Product, currency and price decisions required. No live charges. |
| Owner admin-browser acceptance | UNVERIFIED | Real sign-in, roles, Financial requests reconciliation, core navigation, mobile and keyboard acceptance on the final candidate. |
| Local/provider release checks | FRESH LOCAL PASS; retained provider evidence separate | Local candidate: 284 tests / 21 files passed, four native-only checks skipped; TS/build/import/audit policy passed. Native proof remains historical. No hosted assurance was rerun. |
| GitHub Quality / CodeQL | ACCOUNT BLOCKED in retained evidence | Billing lock prevented executable job steps. Owner resolves restriction; exact-head reruns still require approval. Not reclassified as a code defect. |
| Automated reviews | UNAVAILABLE in retained evidence | Review limits prevented completed PR #41 assurance; recheck capacity or record an accountable scoped exception. |
| Homepage story attribution | IMPLEMENTED LOCALLY / visual acceptance open | All three captions use existing PhotoCredit metadata. Build passes. Browser/layout and hosted acceptance remain unverified. |
| Published writing / article imagery | DRAFT PREPARED; local API/renderer PASS; hosted gate OPEN | Genuine note in docs/editorial/drafts. Nineteen isolated checks passed, including draft privacy, review/approval/publication/withdrawal and caption rendering. Hosted environments were not changed; owner wording/layout acceptance remains. |
| Optional software photograph | IMPLEMENTED LOCALLY / visual acceptance open | Shared code entry reuses the existing licensed workspace asset and Slava Keyzman credit. Old asset preserved for saved cover URLs. |

## Operational recovery evidence rechecked on 23 November

- Ten branches listed. Current project-owner metadata reports subscription
  `free_v3` and `branches_limit: 10`; all ten branch slots are occupied. No restore
  target can be added within that reported allowance. No create probe was run.
- Snapshot `snap-fragrant-dream-bbspabwq`,
  `portfolio-before-engineering-0011-20261118`, created 18 November at 16:31:52
  Africa/Blantyre, source production branch. It predates the current migrations.
- Automatic snapshot schedule for production: empty. Project history retention:
  21,600 seconds. History retention is not a demonstrated restore or a backup SLA.

## Controlled completion order

1. Documentation is implemented locally; retain existing migration/role proofs. Review the exact local commit and provider automation consequences before any push.
2. Approve a current backup, isolated restore target, available capacity and cost
   scope; measure recovery and verify schema/roles/business/audit/receipt consistency.
3. Review financial precision/concurrency patch, then certify native PostgreSQL and
   isolated authenticated Preview; preserve receipts and existing guards.
4. Approve controlled delivery/recovery, then product/currency/pricing and sandbox
   billing operations. Recipient messages and charges need their own defined scope.
5. Complete owner acceptance and approved exact-head GitHub checks. Present final
   evidence, candidate SHA, remaining exceptions and deployment action for approval.

No code change, restore, provider configuration, send, payment, workflow rerun,
push, merge or deployment is authorized by this register. A documentation push
may trigger provider automation and must be reviewed before publication.

## Primary evidence

- [PR #40](https://github.com/Chrispine-1210/ChrispinePortfolio/pull/40)
- [PR #41](https://github.com/Chrispine-1210/ChrispinePortfolio/pull/41)
- [Receipt scope and native evidence](financial-idempotency-2026-11-22/README.md)
- [Migration/role adoption evidence](database-adoption-2026-11-22/README.md)
- [Production](https://vercel.com/chrispine-1210s-projects/chrispine-portfolio/JAxPkYZdHmBxsKJCdMJoW6VM4PD6)
- [Neon project](https://console.neon.tech/app/projects/twilight-meadow-16888716)
- [Retained 23 November review](https://chatgpt.com/library?file_id=libfile_ca70579b78288191ac9f57c1ea79551f&account_id=personal)
