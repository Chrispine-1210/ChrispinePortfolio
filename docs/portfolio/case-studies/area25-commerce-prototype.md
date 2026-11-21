# Area 25 / Mede-Mede — Commerce workflow prototype

A technical commerce prototype covering catalogue, carts, orders, driver roles and delivery records. This case does not promote a regulated storefront or verify its marketing, licensing or sales claims.

## Problem

Local fulfilment needs a reliable relationship between product availability, customer requests, order lines and delivery responsibility. A promotional storefront alone does not prove stock correctness, payment settlement or lawful operating readiness.

## Objectives

Model customer, manager and driver workflows; retain order-line prices and quantities; relate delivery events to orders; verify ownership, stock consistency and payment reconciliation before real commercial use.

## Malawi context

Malawi is the stated operating context for this project. The design case prioritizes phone access, clear local service workflows, accountable human handoffs and a modest operating footprint. These are design requirements and engineering judgments, not a claim that every user lacks connectivity or that measured national impact has occurred.

## Features and business procedures

### Components and features

Product catalogue, cart, checkout/order records, role-based navigation, manager inventory/order screens, driver assignment, messages, delivery tracking and event/community entities are represented in source.

### Why these technologies?

Relational order lines and role-specific workspaces make responsibilities inspectable. Shared web delivery lowers the initial number of applications to maintain. Regulated-product, merchant and operational requirements remain independent of software functionality.

### Business procedure and financial handling

Price and order totals are data fields, not settlement proof. Card/mobile-money packages in source and landing-page claims do not establish live merchant integration. No sales, deliveries, customer totals, earnings, licensing or legal-operation claim is endorsed.

## Architecture, data and algorithms

![Component architecture diagram; conceptual source model](https://raw.githubusercontent.com/Chrispine-1210/ChrispinePortfolio/agent/project-casebooks-20261118/client/public/project-evidence/2026-11-18/area25-commerce-prototype-architecture.svg)

React/Vite client → Express/Passport application → PostgreSQL/Drizzle schema. Users relate to orders and cart items; order lines reference order and product; delivery tracking and messages reference the order and responsible users. AreaTwentyFive is a related repository version and is not counted as a second delivered customer project.

### Algorithms and decision rules

Order items preserve product, quantity and price components; status transitions model fulfilment progression. Session-based role handling is documented. Current atomic stock reservation, payment idempotency and GPS accuracy were not independently exercised.

Why this structure: the component boundaries keep user interaction, business decisions and persistent records distinct where the implementation has those layers. A diagram is not proof that every dependency is connected or operational.

Data categories: domain records and identity/communication data where described above. Public case studies contain no live customer, patient, employee, payment or private-account records. Retention periods, export/deletion handling and recovery objectives need project-specific operating approval; no blanket compliance certification is made.

## Communications

Order-linked messages and delivery-status records support coordination. Newsletter and payment claims visible on the older public presentation were not accepted as evidence of actual operation.

## Security

Verified scope is limited to the controls explicitly described in the source review above. An identity library, permission screen, audit table or secure-sounding landing page does not establish effective authorization in production. Production review must test ownership and role boundaries, session handling, validation, secrets, audit, backup restoration and error behaviour. No private dashboard screenshots or personal/payment records are disclosed.

## Development process

Development reconstruction from inspected source and project records; dates and durations for individual phases are not fully available.

1. Frame the operational problem and acceptance criteria.
2. Build the entities and public/role-specific interfaces described above.
3. Connect validation, state transitions and integrations represented in source.
4. Reconcile deployment, data durability, access and operational evidence.
5. This audit: review source/provider records and capture eligible public screens on 18 November 2026.

Project-specific challenge: The public older presentation contains customer counts, testimonials and licensing assertions without supporting evidence in this audit. Those claims and their screenshots are excluded. Related repository versions and OIDC/local-auth evolution need reconciliation before a current-head release claim.

This sequence explains the implementation structure; it is not a fabricated historical sprint diary. Tests in this project were not rerun as part of the cross-project audit unless an explicit current result is recorded.

## Contribution

Chrispine Mndala: project ownership and development work, as identified by the user’s project history and the reviewed repository or saved deliverable. The study explains the implementation at project level; it does not claim every dependency, template, design asset or line of code was authored from scratch.

## Collaboration and attribution

Frameworks, open-source components, starter templates, AI-assisted development and external providers retain their own authorship. A complete contributor-by-commit audit, team timesheet and client acceptance record were not provided. No client endorsement or paid engagement is inferred from a public website.

## Evidence, financial handling and savings

Evidence as of 18 November 2026: Source implementation and an older public landing surface were observed. No sales, operating licence, verified customer, live payment or fulfilment result is certified. No promotional storefront link is published in this study.

Financial workflow: Price and order totals are data fields, not settlement proof. Card/mobile-money packages in source and landing-page claims do not establish live merchant integration. No sales, deliveries, customer totals, earnings, licensing or legal-operation claim is endorsed.

Benefit mechanism: Potential reductions are repeated order entry and unclear delivery responsibility. No delivery volume, revenue, driver earnings, avoided loss or time-saving metric is verified.

Savings status: NOT MEASURED. The study has no verified before/after labour, error, conversion, hosting-spend or revenue dataset. Measure comparable transaction volumes and service quality before claiming a saving.

Measurement method: monthly net benefit = (baseline minutes − current minutes) × monthly transactions ÷ 60 × loaded hourly labour cost + verified avoided rework − incremental hosting, provider and support cost. Reduced staff time is capacity released unless payroll or another actual cash expense falls. Revenue uplift is separate and requires attributable collections and direct-cost evidence.

Project cost, development hours, collected fees, operating spend, gross profit and realized ROI: not supplied or not verified for public disclosure.

Screenshot gap: no eligible current product capture was obtained. The cover is a labelled source-based architecture diagram, not a simulated screenshot.

## Lessons

Relational order lines and role-specific workspaces make responsibilities inspectable. Shared web delivery lowers the initial number of applications to maintain. Regulated-product, merchant and operational requirements remain independent of software functionality.

The broader lesson is to select the smallest maintainable system that protects the critical workflow. Source completeness, a READY hosting build, a successful human journey and measured business benefit are separate milestones. The historical reasons for every technology choice are not recoverable from source alone; rationales here are identified as engineering assessments.

## Next phase and open questions

Reconcile the canonical repository, remove unsupported promotional claims, validate allowed operating scope with accountable owners, test stock/order concurrency and settlement using disposable non-regulated fixtures, and document secure role boundaries.

Unanswered with current evidence: actual development duration and cost; client sign-off; current active users; completed business transactions; recurring fees collected; before/after savings; support workload; production recovery time and current end-to-end test results. Those questions require records, not invented answers.

## Source review

{
  "date": "2026-11-18",
  "status": "internally_verified",
  "disclosure": "approved_public",
  "scope": "Source implementation and an older public landing surface were observed. No sales, operating licence, verified customer, live payment or fulfilment result is certified. No promotional storefront link is published in this study.",
  "sourceFiles": [
    {
      "path": "README.md",
      "blob_sha": "f0d03658e30e83f0621a71e1733b7c2dd9563598",
      "url": "https://github.com/Chrispine-1210/Mede-mede/blob/main/README.md"
    },
    {
      "path": "package.json",
      "blob_sha": "378573fe672a8f64ab6088450c349f229005e786",
      "url": "https://github.com/Chrispine-1210/Mede-mede/blob/main/package.json"
    },
    {
      "path": "shared/schema.ts",
      "blob_sha": "2f126597b348afd530b8d5e41a02c342b99810bb",
      "url": "https://github.com/Chrispine-1210/Mede-mede/blob/main/shared/schema.ts"
    }
  ],
  "screenshotStatus": "missing; architecture cover only",
  "claim": "Source or saved implementation and available public surface reviewed on 18 Nov 2026. Scope: Source implementation and an older public landing surface were observed. No sales, operating licence, verified customer, live payment or fulfilment result is certified. No promotional storefront link is published in this study."
}
