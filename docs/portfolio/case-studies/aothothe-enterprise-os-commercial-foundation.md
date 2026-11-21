# Aöthothe Enterprise OS — Governed company operations

A governed operating platform for commercial intake, pricing, decisions, delivery and evidence. The institutional homepage is public; internal operational readiness remains a separate release decision.

## Problem

When leads, price decisions, policies, approvals and collection evidence live in separate documents, the founder becomes the reconciliation layer. That creates weak delegation, inconsistent commitments and poor visibility into what has actually been earned or collected.

## Objectives

Establish organization-scoped work, independent review, immutable commercial history, evidence-bound claims and accountable delivery. The business objective is repeatable operation with less founder dependency. Success requires demonstrated independent operator journeys and verified financial records.

## Malawi context

Malawi is the stated operating context for this project. The design case prioritizes phone access, clear local service workflows, accountable human handoffs and a modest operating footprint. These are design requirements and engineering judgments, not a claim that every user lacks connectivity or that measured national impact has occurred.

## Features and business procedures

### Components and features

Institutional audit-request intake; tenant membership; CRM and lead triage; catalogues and price books; proposals and quotation snapshots; contract/SOW and delivery records; governance decisions and policy versions; evidence storage and audit histories. Source also contains People/Discovery and delivery-control modules.

### Why these technologies?

Server-side domain rules keep authorization close to data mutations. PostgreSQL relationships and transactions support governance and accounting provenance. Better Auth supplies identity functions while application membership and permissions remain explicit. This design is intended to support delegation and auditability, at the cost of more release discipline.

### Business procedure and financial handling

Catalogues, pricing, quotations, contracts, milestones, invoices, receipt evidence and reconciliation are separate stages. A won opportunity is not an invoice; an invoice is not cash. The platform is not presented as a banking or payment-processing integration. No customer revenue or collections are asserted.

## Architecture, data and algorithms

![Component architecture diagram; conceptual source model](https://raw.githubusercontent.com/Chrispine-1210/ChrispinePortfolio/agent/project-casebooks-20261118/client/public/project-evidence/2026-11-18/aothothe-enterprise-os-commercial-foundation-architecture.svg)

Next.js/React application → authenticated server actions and domain modules → PostgreSQL. Organization membership scopes CRM, commercial and governance records. Evidence links connect policies, contracts, delivery, invoices and collection histories without turning every uploaded file into an approved claim.

### Algorithms and decision rules

Release eligibility for commercial claims is derived from approval, evidence, validity and permission. Maker-checker controls separate preparation and review; price-book revisions produce quotation snapshots. Source includes idempotency, append-only histories and TOTP replay-protection migrations. Code presence and historic verification records do not certify the current production head.

Why this structure: the component boundaries keep user interaction, business decisions and persistent records distinct where the implementation has those layers. A diagram is not proof that every dependency is connected or operational.

Data categories: domain records and identity/communication data where described above. Public case studies contain no live customer, patient, employee, payment or private-account records. Retention periods, export/deletion handling and recovery objectives need project-specific operating approval; no blanket compliance certification is made.

## Communications

The public audit form includes explicit consent. Internal proposal delivery/response records are evidence-backed; the reviewed README states that no commercial sender is connected. Operational outbox records are a control mechanism, not delivery receipts.

## Security

Verified scope is limited to the controls explicitly described in the source review above. An identity library, permission screen, audit table or secure-sounding landing page does not establish effective authorization in production. Production review must test ownership and role boundaries, session handling, validation, secrets, audit, backup restoration and error behaviour. No private dashboard screenshots or personal/payment records are disclosed.

## Development process

Development reconstruction from inspected source and project records; dates and durations for individual phases are not fully available.

1. Frame the operational problem and acceptance criteria.
2. Build the entities and public/role-specific interfaces described above.
3. Connect validation, state transitions and integrations represented in source.
4. Reconcile deployment, data durability, access and operational evidence.
5. This audit: review source/provider records and capture eligible public screens on 18 November 2026.

Project-specific challenge: Historic release records describe runner-start failures, staging configuration, backup/restore verification and runtime certification gaps. A public homepage is currently visible, but it does not demonstrate authenticated governance, commercial or delivery journeys for the deployed head.

This sequence explains the implementation structure; it is not a fabricated historical sprint diary. Tests in this project were not rerun as part of the cross-project audit unless an explicit current result is recorded.

## Contribution

Chrispine Mndala: project ownership and development work, as identified by the user’s project history and the reviewed repository or saved deliverable. The study explains the implementation at project level; it does not claim every dependency, template, design asset or line of code was authored from scratch.

## Collaboration and attribution

Frameworks, open-source components, starter templates, AI-assisted development and external providers retain their own authorship. A complete contributor-by-commit audit, team timesheet and client acceptance record were not provided. No client endorsement or paid engagement is inferred from a public website.

## Evidence, financial handling and savings

Evidence as of 18 November 2026: Public institutional homepage observed. Source and historical release evidence reviewed. Internal end-to-end runtime certification and production operating authorization are not established by this case study.

Financial workflow: Catalogues, pricing, quotations, contracts, milestones, invoices, receipt evidence and reconciliation are separate stages. A won opportunity is not an invoice; an invoice is not cash. The platform is not presented as a banking or payment-processing integration. No customer revenue or collections are asserted.

Benefit mechanism: Potential value: fewer inconsistent quotations, less founder-led chasing, better approval provenance and better distinction between pipeline and collections. Founder hours, quote turnaround, rejection rates and cash-conversion improvements have not been measured.

Savings status: NOT MEASURED. The study has no verified before/after labour, error, conversion, hosting-spend or revenue dataset. Measure comparable transaction volumes and service quality before claiming a saving.

Measurement method: monthly net benefit = (baseline minutes − current minutes) × monthly transactions ÷ 60 × loaded hourly labour cost + verified avoided rework − incremental hosting, provider and support cost. Reduced staff time is capacity released unless payroll or another actual cash expense falls. Revenue uplift is separate and requires attributable collections and direct-cost evidence.

Project cost, development hours, collected fees, operating spend, gross profit and realized ROI: not supplied or not verified for public disclosure.

## Lessons

Server-side domain rules keep authorization close to data mutations. PostgreSQL relationships and transactions support governance and accounting provenance. Better Auth supplies identity functions while application membership and permissions remain explicit. This design is intended to support delegation and auditability, at the cost of more release discipline.

The broader lesson is to select the smallest maintainable system that protects the critical workflow. Source completeness, a READY hosting build, a successful human journey and measured business benefit are separate milestones. The historical reasons for every technology choice are not recoverable from source alone; rationales here are identified as engineering assessments.

## Next phase and open questions

Certify the exact deployed head with organization-bound denial tests, migrations, backup restore and authenticated operator journeys. Record actual operator ownership and first verified revenue evidence before asserting independent business operation.

Unanswered with current evidence: actual development duration and cost; client sign-off; current active users; completed business transactions; recurring fees collected; before/after savings; support workload; production recovery time and current end-to-end test results. Those questions require records, not invented answers.

## Source review

{
  "date": "2026-11-18",
  "status": "internally_verified",
  "disclosure": "approved_public",
  "scope": "Public institutional homepage observed. Source and historical release evidence reviewed. Internal end-to-end runtime certification and production operating authorization are not established by this case study.",
  "sourceFiles": [
    {
      "path": "README.md",
      "blob_sha": "5f8384da3d2cf5749f1a7463d1391c655d3aae3c",
      "url": null
    },
    {
      "path": "apps/web/package.json",
      "blob_sha": "a230e5db76c2c82f898b45fa6103cbc6e3eb24fc",
      "url": null
    }
  ],
  "screenshotStatus": "current public browser captures",
  "claim": "Source or saved implementation and available public surface reviewed on 18 Nov 2026. Scope: Public institutional homepage observed. Source and historical release evidence reviewed. Internal end-to-end runtime certification and production operating authorization are not established by this case study."
}
