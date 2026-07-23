# Administration Platform Gap Analysis

Status labels: **Existing**, **Partial**, **Missing**, **Blocked**.

| Capability | Current state | Required state | Status | Priority |
|---|---|---|---|---|
| Public portfolio | Broad React site with database-backed blog/projects and static sections | Managed, evidence-backed content with preview and publication controls | Partial | P1 |
| Admin separation | `/admin` route in the same SPA | Independently deployable admin origin/app with shared secured API | Partial | P0 |
| Authentication | Single environment credential and custom HMAC bearer | Invites, Argon2id, MFA-ready identity, secure cookies, revocable sessions | Blocked by redesign | P0 |
| Authorization | Existing protected content, portfolio, analytics, template, and seed routes use server-side capability checks in database-auth mode; temporary-auth compatibility remains | Deny-by-default RBAC/permissions on every protected server action | Partial | P0 |
| Audit accountability | Request logger only | Immutable security and business audit events | Missing | P0 |
| Database lifecycle | Drizzle schema and `db:push` | Versioned migrations, constraints, indexes, retention and recovery tests | Partial | P0 |
| Content workflow | Blog/project booleans and direct writes | Draft-review-approve-schedule-publish-archive with versions | Missing | P1 |
| Project/case studies | One public project record | Separate internal projects and safe public case studies | Partial | P1 |
| Media management | Files committed under `attached_assets` | Object storage, metadata, signed access, usage references and scanning | Missing | P1 |
| Professional profile/CV | Static pages and a committed CV | Structured verified profile and reviewed CV variants | Missing | P1 |
| CRM/opportunities | Contact request table | Leads, contacts, organizations, pipeline, activities, tasks and value | Missing | P2 |
| Consultation booking | Frontend enquiry form | Availability, timezone, conflict control, reminders and conversion | Missing | P2 |
| Analytics/BI | Process-local request buffer | Consent-aware durable events, funnel and revenue attribution | Missing | P2 |
| GitHub integration | Mock contribution UI | GitHub App/API sync, repository approval, caching and history | Missing | P3 |
| Search/knowledge graph | Per-page filters | Authorized global search and typed relationships | Missing | P3 |
| Notifications | Ad hoc UI messages | In-app/email templates, preferences, retries and delivery logs | Missing | P3 |
| AI assistance | None | Reviewed generations with provenance, cost and safety controls | Missing | P3 |
| API governance | Unversioned route-specific response shapes | `/api/v1`, Zod contracts, envelopes, OpenAPI, pagination and idempotency | Partial | P0 |
| Testing | Build command only | Unit, integration, contract, E2E, authz, accessibility and security suites | Missing | P0 |
| Operations | Vercel build/rewrite | CI gates, staging, health, structured telemetry, backups and runbooks | Partial | P0 |
| Accessibility | Accessible component primitives in use | WCAG 2.2 AA verification and regression tests | Partial/unverified | P2 |
| SEO governance | Page-level helpers | CMS-managed metadata, schema, sitemap, redirects and validation | Partial | P2 |

## Scope discipline

The requested platform is a multi-phase product, not a single dashboard page. The minimum commercially useful sequence is secure foundation, authoritative content, opportunity management, then intelligence/integrations. AI, social distribution and partner portals should not enter the critical path until identity, provenance, consent and audit controls are reliable.
