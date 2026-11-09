# Portfolio administration implementation review

Date: 9 November 2026
Repository: `Chrispine-1210/ChrispinePortfolio`
Production-line source: `main` at `2a1584d`
Draft implementation baseline: PR #17 at `153bbd4`

## Repository audit and gap analysis

The existing stack is React, Vite, Wouter and TanStack Query on the client, Express 4 on the server, and Drizzle with Neon PostgreSQL for persistence. The Vercel configuration deploys one client bundle and routes API requests to Express. This review preserves the stack, existing portfolio URLs and response formats, and the separate internal project and public case-study models in PR #17.

| Area | Source evidence | Status |
|---|---|---|
| Identity | `server/security/`, `scripts/bootstrap-admin.ts` and migration `0000` implement Argon2id, revocable database sessions, throttling, roles and audit tables. | Implemented in source. Production activation, MFA, invitation ceremony and fresh re-authentication evidence are pending. |
| Public/admin separation | `client/src/App.tsx` and `vercel.json` share a client build and origin. Server middleware restricts privileged API calls. | Separate builds and origin policy pending. |
| Content | Migration `0004` and `server/admin/routes.ts` implement blog versioning and workflow. PR #17 adds project and case-study separation. | Profile/CV records, media storage and scanning, case-study version history and end-to-end scheduling verification pending. |
| CRM | Migration `0003`, `server/crm/` and the lead pipeline support database-backed capture and lead management. | Booking conflicts, organization/contact workflows and qualified pipeline attribution require verification or implementation. |
| Analytics and integrations | Request analytics are process-local. GitHub and external-post presentations contain simulated data. Email and notification adapters are present. | Durable consent-aware analytics, selected-repository sync and provider acceptance evidence pending. |
| API and SEO | Existing APIs serve public portfolio and blog views. Page-level SEO helpers and metadata exist. | Versioned API contracts, OpenAPI, managed metadata, accessibility and SEO smoke coverage pending. |
| Recovery and deployment | Versioned SQL and the repository release script exist. The reviewed Vercel config invokes `vite build`. PR #17 records a hosted runner startup incident. | Preview database migration, provider-backed smoke checks, backup restoration and current-head CI evidence pending. |

## Prioritized risks and execution order

| Priority | Risk | Required control or exit evidence |
|---|---|---|
| P0 | Concurrent editorial or evidence writes can race a case-study approval, publication or archive. Express 4 async errors in these routes can escape request error handling. | Lock the case-study row before workflow and evidence writes. Return safe HTTP errors. Verify normal Express routes against isolated migrated data. |
| P0 | Temporary authentication lacks a database actor and granular permissions. A public seed fallback and cached responses weaken the database's control over withdrawal. | Require revocable database sessions for the governed routes, verify the permission boundary and remove the case-study fallback. Revalidate publication with each public read. |
| P0 | Migration replay can attach preapproved seed evidence to an existing case study that happens to use a reserved slug. | Create seed evidence only alongside the matching seed study, with a regression check for existing records. |
| P0 | A failed database migration could interrupt public reads. The deployed database and identity setup are outside local verification. | Apply migrations to an isolated Neon branch, smoke-test public and admin routes there, and require recovery and credential-rotation evidence before production activation. |
| P1 | Public asset mounts, incomplete admin deployment separation and incomplete production MFA leave identity and disclosure work. | Review static asset allowlists and use independent builds with an explicit admin origin, host-only cookies, origin enforcement and verified MFA/step-up. |
| P1 | Lead value, source quality and booking outcomes cannot yet be tied reliably to portfolio activity. | Complete the enquiry-to-qualified-opportunity journey and consent-aware source attribution before expanding dashboard KPIs. |
| P2 | External integration, media and AI features increase disclosure and operational cost. | Add authorized GitHub sync, classified asset handling and reviewed AI drafts only after the underlying permissions, evidence and job controls are verified. |

The current increment completes the repository audit and hardens the case-study release boundary on top of PR #17. The next increments cover Preview migration and identity verification, separately deployable admin and public builds, then qualified lead and booking journeys. Intelligence, provider-backed operations, and growth features follow those verified workflows.

## Increment evidence

| Check | Result |
|---|---|
| TypeScript and production build | Passed using `npm run verify:release`. The Vite entry remains about 590 kB gzipped. |
| Automated tests | 61 passed. HTTP coverage includes database permissions, temporary-auth rejection, public projection, evidence invalidation after edits, publication, archive and restore, contact-to-qualified-lead, and newsletter submission. |
| Migration replay and concurrent update | The migration chain ran twice on isolated PostgreSQL 18.6. An HTTP edit blocked on the case-study row and returned `409` after a concurrent transaction changed it to published. The public read returned the reviewed copy. |
| Dependencies | The production audit moved from five high findings and one moderate finding to zero. The full audit reports six moderate development-tool findings and zero high or critical findings. |
| Provider-backed acceptance | Pending. Local PostgreSQL and Express tests cover application behavior. The Neon driver, Vercel routing, deployed identity and browser journeys require separate evidence. |

The project and case-study administration APIs now require `ADMIN_AUTH_MODE=database`. Apply the SQL migrations and verify an authorized session in Preview before routing public case-study traffic to this revision. Public list, featured, search, category and detail reads use the database. If the database or case-study schema is unavailable, the API returns an error. Unlisted studies remain accessible by direct URL and are omitted from discovery.

## Release rule

Keep this follow-up in draft review. Before merge or production activation, require target-head CI or an accountable documented exception, isolated Neon migration and public/admin HTTP checks, a review of the evidence and permission boundary, and database credential-rotation and recovery evidence. Production privileged use additionally requires verified MFA and an approved public/admin deployment boundary.
