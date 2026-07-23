# Target Architecture

## Decision

Evolve the current codebase into a modular monolith with three deployment surfaces:

```text
Public Web (React/Vite) ----\
                            >---- Versioned Express API ---- PostgreSQL/Neon
Admin Web (React/Vite) -----/              |                 Object storage
                                          |                 Queue/Redis
                                          +---- integrations (GitHub, email, calendar, AI)
```

The public web and admin web must be independently buildable and deployable. They share typed contracts and backend domain services, not browser authentication state or unrestricted routes. The API remains one deployable service initially; background jobs may be a separate worker deployment while sharing the same domain packages.

## Backend domains

- identity: users, invitations, credentials, MFA, sessions and recovery
- access: roles, permissions and policy evaluation
- audit: append-only audit and security events
- content: entries, versions, workflow, scheduling, tags and SEO
- profile: experience, education, certifications, skills and CV views
- portfolio: internal projects, public case studies, evidence and relationships
- ventures: Aöthothe Technologies profile, products, roadmaps and enquiries
- media: object metadata, usage, classification and safe lifecycle
- crm: contacts, organizations, leads, opportunities, activities and tasks
- booking: availability, consultations, reminders and outcomes
- analytics: consent, first-party events, sessions, attribution and funnel aggregates
- integrations: GitHub, email, calendar and delivery/sync history
- notifications: templates, preferences, outbox, retry and delivery logs
- ai: prompt templates, runs, provenance, cost, safety and approval queue
- operations: settings, health, jobs and backup evidence

Each domain owns its validation schemas, service rules, repository queries, authorization requirements and audit events. HTTP handlers remain thin adapters.

## Identity and access design

- Bootstrap the first administrator through a one-time CLI or controlled deployment task, never default credentials or a public seed endpoint.
- Hash passwords with Argon2id and encrypt MFA secrets with a managed application key.
- Use opaque session tokens in `Secure`, `HttpOnly`, `SameSite` cookies. Store only token hashes server-side.
- Enforce idle and absolute expiry, rotation, revocation and device/session visibility.
- Protect unsafe cookie-authenticated methods with origin checks and CSRF tokens.
- Implement permissions as stable capabilities such as `content.publish`, `leads.view_sensitive` and `security.manage`, with server-side policy checks.
- Require recent re-authentication, justification and an audit event for high-risk operations.

## API conventions

- Namespace new endpoints under `/api/v1`.
- Use Zod request and response schemas and generated OpenAPI 3.1 documentation.
- Return a consistent `{ data, meta, error }` envelope and stable error codes.
- Use cursor pagination for growing collections; allowlisted filtering and sorting only.
- Attach a correlation ID to requests, logs, errors and audit events.
- Require idempotency keys for important create/publish/payment/integration actions.
- Apply route-class rate limits and explicit request/body/file limits.
- Keep public read models separate from administrator and internal database models.

## Data principles

- Use UUID identifiers, UTC timestamps, foreign keys, unique constraints and deliberate indexes.
- Store content as validated structured blocks plus typed metadata; never uncontrolled site-wide HTML.
- Separate internal project records from publishable case studies.
- Version publishable records and keep immutable publication/audit history.
- Use soft deletion where recovery or accountability matters; hard deletion runs through retention policy.
- Classify PII and confidential assets and enforce field-level permissions.
- Add an outbox/job pattern for email, scheduled publishing, GitHub sync and integrations.

## Deployment environments

- Production: public web, admin web and API with production database/storage.
- Staging: isolated database/storage and integration credentials; required promotion gate.
- Preview: ephemeral frontend/API where possible, never connected to production PII.
- CI: typecheck, lint, unit, integration, contract, migration, dependency and secret checks.

Vercel remains appropriate for the web and serverless API at the current scale. Queue workers, durable rate limiting and scheduled jobs require external managed services or a compatible worker host; select those during Phase 1 based on operational cost and regional availability.
