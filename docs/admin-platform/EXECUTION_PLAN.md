# Phased Execution Plan

## Current progress

| Phase | Status | Exit evidence |
|---|---|---|
| Phase 0 — repository audit | Completed | Audit, gap analysis, risk register, architecture and verified baseline |
| Phase 1 — secure foundation | Active | Phase 1A containment and engineering gates complete; identity/RBAC/session/audit schema and migrations remain |
| Phase 2 — portfolio content engine | Pending | Structured content, profile, projects/case studies, media, preview and publishing |
| Phase 3 — revenue and opportunity engine | Pending | Leads, organizations, opportunities, consultation and attribution workflows |
| Phase 4 — intelligence and integrations | Pending | Durable analytics, GitHub sync, search, notifications and reviewed AI assistance |
| Phase 5 — operational hardening | Pending | Complete test gates, monitoring, backups/restoration, accessibility and runbooks |
| Phase 6 — growth infrastructure | Pending | Campaigns, proposal intelligence, partner experiences and Aöthothe integration |

## Phase 1 increments

### 1A — stop exposure and restore engineering gates

- Rotate the disclosed database credential and update deployment environments.
- Put every existing mutation and sensitive read behind a deny-by-default authorization boundary.
- Remove bearer tokens from `localStorage`; temporarily fail closed while the replacement session system is built.
- Restrict analytics and seed-status reads; remove production seed/fallback behavior.
- Return public response DTOs and enforce publication state on public detail reads.
- Upgrade vulnerable dependencies with regression checks.
- Resolve all 45 TypeScript errors and add CI for build, typecheck, dependency and secret checks.
- Add focused HTTP integration tests for the confirmed security findings.

### 1B — production identity and permissions

- Add versioned migrations for users, credentials, invitations, sessions, MFA factors, roles, permissions and memberships.
- Implement one-time administrator bootstrap, Argon2id credentials, opaque cookie sessions, expiry, rotation and revocation.
- Add CSRF/origin protection, durable login throttling, progressive lockout and security-event logging.
- Implement the permission evaluator and seed the reviewed permission matrix.
- Add authentication, session and authorization-matrix tests.

### 1C — accountability and API platform

- Add append-only audit events, correlation IDs, structured logging and safe error envelopes.
- Establish `/api/v1`, OpenAPI generation, cursor pagination and idempotency support.
- Add environment validation, staging configuration and migration promotion workflow.
- Implement health/readiness checks without leaking operational details.
- Document administrator provisioning, session response and incident procedures.

## Phase 1 release gates

- No anonymous authoritative mutation succeeds.
- Every protected action has an explicit permission and negative authorization tests.
- Logout and administrative revocation invalidate sessions immediately.
- Login throttling works across serverless instances.
- Typecheck, production build, tests, migration checks, dependency policy and secret scan pass in CI.
- No production seed credentials, copied secrets or mock operational data exist.
- Audit records are created for identity, permission and content mutations.
- Staging deployment and rollback are reproducible.

## Later-phase sequencing

Phase 2 should first deliver the authoritative profile and content model, then internal projects/public case studies, then media and SEO. Phase 3 builds the commercial funnel on those trusted records. Phase 4 adds integrations only after permission, consent, provenance and job controls exist. Phase 5 validates the whole system under recovery, accessibility, security and performance tests. Phase 6 extends growth capabilities without weakening the core boundaries.

## Product decisions required before their implementation increment

- Final production/admin domain names and DNS ownership.
- Transactional email, object storage, queue/rate-limit and monitoring providers.
- MFA policy and initial administrator provisioning ceremony.
- CRM data-retention periods and consent language for target markets.
- Which GitHub repositories may be synchronized and publicly displayed.
- Evidence approval for project results, testimonials and professional claims.

These decisions do not block Phase 1A.
