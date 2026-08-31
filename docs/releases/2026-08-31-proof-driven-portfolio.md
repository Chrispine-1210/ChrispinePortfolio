# Proof-Driven Portfolio Release - 31 August 2026

## Release purpose

Publish a public CV and two case studies without inflating technical delivery into customer, revenue, adoption, security-certification, or performance claims.

## Published material

| Item | Public status | Evidence boundary |
| --- | --- | --- |
| `Chrispine-Mndala-CV-2026.pdf` | Published through `/attached_assets/Chrispine-Mndala-CV-2026.pdf` | Public edition removes national-ID information, date of birth, and referee contact information. It retains professional background, education, and selected technical work. |
| Mtendere Education Consult - Full-Stack Platform Delivery | Published case study | References the public MEC repository and the project’s application/migration/test artefacts. It does not publish client operational metrics, service availability, usage, revenue, acceptance, or partner claims. |
| Aöthothe Enterprise OS - Governed Commercial Foundation | Published case study | Summarises the private draft PR #4 verification record: 37/37 service/integration tests, 18/18 browser journeys, clean migration evidence, production build, scans, and a documented HOLD decision. It is explicitly not represented as merged, deployed, used by customers, or operationally activated. |

## Claim-control changes

- Replaced legacy portfolio cards containing unverified LoRaWAN, 5G, MEL, adoption, engagement, uptime, and revenue-style statements.
- Made the public portfolio routes and advanced search serve only the two evidence-approved studies, rather than legacy database content.
- Replaced fabricated client quotations with a transparent evidence-standard section.
- Removed numerical impact language and production-state assertions from landing, services, About, discovery, education-technology, transformation, resource, and SEO surfaces where supporting evidence was absent.
- Removed fixed KPI blocks from the case-study detail page.
- Removed the previously published, sensitive CV asset; its retired URL now returns 404 while the redacted CV asset returns 200.

## Fresh verification

Run from the portfolio release branch on 31 August 2026:

| Check | Result |
| --- | --- |
| `npm ci` | Passed with the corrected lockfile. |
| `npm test` | Passed: 4 files, 49 tests. |
| `npm run check` | Passed: TypeScript. |
| `npm run build` | Passed: Vite client and server bundle. |
| `npm audit --omit=dev --audit-level=high` | Passed: 0 production vulnerabilities. |
| Runtime smoke | Passed locally for `/portfolio`, the public CV asset, and both case-study API endpoints. |

## Known release notes

- The client JavaScript bundle remains above the build tool’s recommended size. This is recorded as a performance optimisation item; no performance claim is made by this release.
- The dependency audit reports moderate vulnerabilities only in development tooling reachable through a breaking dependency upgrade. The production dependency audit is clean.
- Aöthothe Enterprise OS remains a controlled, non-production draft pending its own CI/manual-exception and release-governance gates.
