# Admin Command Platform - Progress Record

Last updated: 2026-07-25

## Current architecture

- React, Vite, TanStack Query, Tailwind, and the existing accessible UI components power the administration client.
- Express provides the shared API, with Drizzle and PostgreSQL/Neon as the system of record.
- Database-backed administrator sessions, granular permissions, Argon2id credentials, throttling, revocation, and audit tables form the security foundation.
- Email and notification delivery use durable outboxes and environment-selected providers.
- The public site and administration surface currently share one deployment, but admin routes use a distinct shell and server-side authorization. A dedicated admin origin remains a later deployment-hardening step.

## Verified gap analysis

| Domain | Current state | Priority gap |
| --- | --- | --- |
| Authentication | Database sessions and permission middleware implemented | MFA, invitations, recovery, session UI |
| Admin UX | Shared command shell and operational overview implemented | Command palette, global search, saved views |
| Content | Governed draft, review, approval, scheduling, publishing, archiving, SEO, visibility, and immutable version history implemented | Preview links and portable structured blocks |
| Portfolio | Project CRUD and feature controls implemented | Separate confidential project records and public case studies |
| Leads | Contact intake, automatic CRM conversion, pipeline stages, qualification, value, follow-up, and activity notes implemented | Organizations, tasks, attachments, bookings, detailed communication history |
| Audience | Subscriber search and consent-state controls implemented | Preference center, segments, consent history, exports |
| Communications | Email outbox, campaigns, suppression, provider events implemented | Audience expansion workers, channel worker operations, template editor |
| Analytics | Basic application events exist | First-party conversion funnel, attribution, revenue intelligence |
| Audit | Authentication and selected admin actions are recorded; searchable audit/security/session workspace implemented | Export and complete mutation coverage |
| Media | Static repository assets only | Object storage, metadata, signed URLs, safe deletion |
| GitHub | Public profile integration exists | Controlled repository synchronization and failure history |
| Operations | Vercel deployment and environment validation exist | Health dashboard, backups, restoration test, observability |

## Completed in this milestone

- Executive admin shell with responsive navigation and permission-aware module visibility.
- Public navigation and footer removed from private admin surfaces.
- Operational overview API with content, audience, delivery, session, provider, and recent-activity signals.
- Governed content workspace with draft-only editing, review and approval gates, scheduling, publication, justified archiving, SEO controls, visibility policy, and immutable database-enforced version history.
- Vercel-cron-compatible content scheduler authentication, overlap-safe due-item publication, safe unpublished defaults, and public-query workflow enforcement.
- Deterministic migration runner that applies every numbered idempotent SQL migration instead of silently skipping unjournaled platform migrations.
- Portfolio workspace with project CRUD, evidence fields, links, technology tags, and featured state.
- Contact workspace with protected search, unread filtering, reply action, and audited read-state changes.
- Audience workspace with protected search, active filtering, and audited subscription-state changes.
- Communications workspace integrated into the admin shell.
- CRM opportunity pipeline with automatic contact backfill and ingestion, commercial stages, priorities, qualification scores, weighted forecasts, next actions, follow-up dates, lost reasons, and activity notes.
- Security workspace with session visibility, justified revocation, security events, and searchable audit history.
- User and role workspace with justified account-state changes, session invalidation, granular role assignment, and final-super-administrator protection.

## Active next phase

1. Separate confidential project records from public case studies.
2. Add organizations, CRM tasks, consultation bookings, and communication history.
3. Implement signed administrator invitations and password enrollment before enabling UI-based provisioning.
4. Add media storage and structured case-study records before expanding AI or external integrations.
5. Add expiring content previews and portable structured content blocks.

## Known limitations

- Current article content remains Markdown text rather than portable structured blocks.
- Project records are still also public case-study records; confidential/internal projects must not be stored until those domains are separated.
- The admin and public client are independently routed but not yet independently deployed.
- Database migrations must be applied explicitly before newly introduced tables are used in an environment.
- Provider readiness indicates configuration presence, not an external provider health check.
