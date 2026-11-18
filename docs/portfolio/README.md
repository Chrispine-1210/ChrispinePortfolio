# Portfolio development casebooks — 18 November 2026

This collection documents 16 distinct implementations across 25 audited GitHub repositories and 15 Vercel projects. Related versions and infrastructure projects are mapped below rather than counted as additional client deliveries.

The catalogue contains 12 image assets (11 public-browser captures and one archived MEC training screenshot) and 16 labelled component architecture diagrams. Six source-reviewed projects lack a current product screenshot. Architecture covers are diagrams, never simulated product captures. The SUDERN capture shows its canary; Thoko’s ordering capture explicitly shows checkout paused. MEC’s archived screenshot is not proof of current login success.

Each case covers objectives, problem selection, Malawi context, features, components, technology rationale, architecture, data, algorithms, financial handling, business procedures, communications, development reconstruction, challenges, contribution, attribution, benefit mechanisms, measurement methods, lessons and unanswered questions. Missing costs, savings, adoption, revenue and operational evidence are stated explicitly. Rationales reconstructed from code are engineering assessments, not invented historical decision records.

## Coverage register

| Repository / hosted project | Portfolio treatment |
| --- | --- |
| MEC | Mtendere Education Consult case study |
| Mtendere-Education-Consult- | Earlier MEC version; consolidated |
| Web-Sync-Project---Mtendere-Education- | Earlier MEC synchronization work; consolidated |
| CHL-INVESTMENTS / thoko-restaurant | Thoko Restaurant case study |
| aothothe-enterprise-os | Aöthothe Enterprise OS case study, including institutional homepage |
| design-city | Design City case study |
| Health-Care-Management-System | Thandizo Healthcare case study |
| fatima-agro-digital-operations-demo | Fatima Agro case study |
| fatima-agro-digital-operations-demo-staging-private-20260911 | Related staging version; consolidated |
| fatima-agro / operations-demo-deploy | Related hosting surfaces; one case, no additional delivery count |
| Sudern-ORG | SUDERN case study; public alias is a canary |
| validus-circle-staging | Validus Circle case; saved HTML and public interface, no matching repository established |
| ChrispinePortfolio | Portfolio platform case plus separately deployed NetOps workspace |
| Portfolio / digitalarchtectportfolio | Earlier portfolio versions; consolidated |
| chrispine-portfolio-pr19-preview | Preview infrastructure for the same platform; consolidated |
| ThriveBridge-Malawi- | ThriveBridge source-reviewed case; live deployment unverified |
| Appointments-Booker | BookingPro source-reviewed case; live deployment unverified |
| ScamShield | Source-reviewed prototype; operational protection/accuracy not certified |
| LeadersSpark-Blogs | Source-reviewed publishing case; deployment unverified |
| BrandGenius | Source-reviewed AI workbench; provider execution/security boundary unverified |
| Mede-mede / AreaTwentyFive | One technical commerce-prototype case; unsupported customer/licensing claims excluded |
| Crosfade-company-website | Archived earlier company-brand work; not claimed as another current delivered system |
| erp-ios | README attributes incwo’s MIT-licensed ERP; excluded from original-work claims |
| duwa | README points to the upstream Chewa-language project; individual contribution not established, excluded from original-work claims |
| vite-react / vercel-with-neon-postgres | Template/infrastructure repositories; no separate client-delivery claim |
| Chrispine-1210 | Profile repository; no software-delivery case |
| 6f97fc4c6c87 | Hosting record with no deployment; no implementation inferred |
| Revenue execution / operating control / release control workspaces | Prior requests/artifact history are not enough to certify a current hosted implementation; canonical source/deployment evidence remains a gap |

## Publication and maintenance

`casebooks-2026-11-18.json` is the reviewed editorial source. Individual Markdown files provide portable narratives. `asset-manifest.json` records image provenance and SHA-256 checksums. The primary JSON contains 18 explicit question mappings. Internal evidence source references remain excluded from the public API.

The existing public renderer reads the complete long-form narrative through `solution`. The richer reader separates already-approved editorial fields into navigation sections and shows the screenshot gallery, architecture and print action. Its server projection remains behind the existing workflow, visibility and evidence gate. It introduces no database schema migration, authentication change or financial permission change.

For a future reviewed import:

1. Review every claim and screenshot; remove private/personal/payment material and unsupported outcomes.
2. Snapshot existing case studies, evidence and exact `updated_at` versions. Retain an independently recoverable database state.
3. Prepare an expected-version JSON mapping of slug to timestamp.
4. Run `node --import tsx scripts/prepare-portfolio-casebooks.ts CATALOGUE.json EXPECTED.json OUTPUT.sql`.
5. Test the SQL against an isolated database branch first. The anonymous block is atomic, rejects concurrent edits, preserves old states in audit, withdraws superseded evidence, checks the gate and publishes the reviewed records.
6. Execute only the reviewed batch under the authorized database account. Check public readback and screenshot delivery. A reused revision with different content is rejected.
7. Future editorial changes use the normal admin workflow and renewed evidence approval; do not publish by changing raw workflow flags manually.

The importer records an authorized workspace editorial action. It does not fabricate an in-app user, independent reviewer, client approval or production certification.

## Business value evidence

No project is assigned invented savings or return on investment. Each case identifies its expected benefit mechanism and the missing baseline. Suggested measurement:

`monthly net benefit = time released × loaded labour cost + verified avoided rework − incremental hosting/provider/support cost`

Time released is capacity unless it reduces an actual expense. Revenue requires attributable collected cash and direct-cost evidence. A price, invoice, target, sample ledger or pipeline amount is not a collection.
