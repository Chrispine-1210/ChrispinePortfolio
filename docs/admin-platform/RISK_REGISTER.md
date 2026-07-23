# Prioritized Risk Register

| ID | Risk | Likelihood | Impact | Priority | Required treatment |
|---|---|---:|---:|---:|---|
| R-001 | Anonymous callers can mutate or delete authoritative public content | High | High | P0 | Protect all mutations with centralized server authorization; test every route; add versioning/audit recovery |
| R-002 | Database credentials were disclosed in conversation history | High | High | P0 | Rotate Neon credentials, replace Vercel values, verify old credential rejection, review access logs |
| R-003 | Custom admin bearer tokens do not expire or revoke | Medium | High | P0 | Replace with hashed, server-side revocable sessions in secure cookies; add idle/absolute expiry |
| R-004 | No login throttling, lockout, MFA or durable security events | Medium | High | P0 | Shared rate limiter, progressive lockout, MFA-ready flow, alerts and audit trail |
| R-005 | Public API leaks full commenter user rows | High | Medium | P0 | Public DTO projection and response-contract tests |
| R-006 | Public slug lookup can expose unpublished articles | Medium | Medium | P0 | Split public and preview queries; enforce published state in data access |
| R-007 | 13 dependency vulnerabilities, including direct Drizzle/Express ecosystem issues | Medium | High | P0 | Upgrade with compatibility tests; add Dependabot and CI audit policy |
| R-008 | TypeScript baseline has 45 errors | High | Medium | P0 | Repair target/config/model typing and enforce `tsc --noEmit` in CI |
| R-009 | No automated tests protect authentication, data or deployment flows | High | High | P0 | Establish unit/integration/E2E test pyramid before feature expansion |
| R-010 | Public and admin experiences share one SPA and backend policy surface | Medium | High | P1 | Separate admin build/origin and enforce CORS/session policies while keeping shared API/services |
| R-011 | In-memory analytics lose data and expose raw telemetry publicly | High | Medium | P1 | Make reads admin-only; replace with consent-aware durable analytics events |
| R-012 | Database changes have no committed migration history or recovery validation | Medium | High | P1 | Adopt migrations, backup policy and tested restoration runbook |
| R-013 | Static/seed/mock content can be mistaken for authoritative production data | High | Medium | P1 | Inventory content provenance, migrate approved records, clearly label drafts, remove runtime fallbacks |
| R-014 | Stripe webhook body handling appears incompatible with handler expectations | Medium | Medium | P1 | Correct raw-body adapter and verify signed webhook integration in a non-production environment |
| R-015 | Large frontend bundle and images degrade performance | High | Medium | P2 | Route-level code splitting, image formats/sizes, performance budgets |
| R-016 | No consent, retention or access model for future lead/analytics PII | Medium | High | P1 | Classify data, record consent, enforce retention and field permissions before CRM rollout |

## Release rule

No new privileged module may ship while R-001 through R-009 remain open. Later modules may be designed in parallel, but their mutations cannot be exposed until the secure-foundation controls and tests are complete.
