# Thandizo Healthcare — Pharmacy & fulfilment systems

A pharmacy platform covering prescriptions, inventory, ordering and delivery roles. The deployed public frontend loads; backend connectivity and clinical operation are not certified by the landing page.

## Problem

Pharmacy ordering crosses clinical review, stock availability, fulfilment and delivery. Treating those as one generic shopping-cart flow loses the pharmacist decision, branch and batch context, and accountable fulfilment history.

## Objectives

Separate customer, pharmacist, staff, driver and administrator workspaces; retain prescriptions and review decisions; track stock batches and expiry; connect orders to fulfilment; prove access controls and reversal behaviour before operational use.

## Malawi context

Malawi is the stated operating context for this project. The design case prioritizes phone access, clear local service workflows, accountable human handoffs and a modest operating footprint. These are design requirements and engineering judgments, not a claim that every user lacks connectivity or that measured national impact has occurred.

## Features and business procedures

### Components and features

Medication catalogue; prescriptions; stock batches and branches; orders and items; delivery tracking; appointments; health content; audit records; authentication and email routes. Repository documents include PWA/Electron packaging directions; published app-store binaries were not verified.

### Why these technologies?

A shared web application can serve phone and desktop users without separate initial native builds. Relational batch and prescription data fit traceable workflows. API separation allows frontend hosting to be independent, but introduces an explicit connectivity and deployment dependency.

### Business procedure and financial handling

The source documents orders and payment-gateway integrations, including mobile-money options. No active merchant credential, live transaction, refund settlement or healthcare business revenue was verified. Provider support in code must be reconciled with actual operational accounts.

## Architecture, data and algorithms

![Component architecture diagram; conceptual source model](https://raw.githubusercontent.com/Chrispine-1210/ChrispinePortfolio/agent/project-casebooks-20261118/client/public/project-evidence/2026-11-18/thandizo-healthcare-platform-architecture.svg)

React/Vite frontend → Express/TypeScript API → PostgreSQL/Drizzle. The public deployment describes a separately hosted API base URL. Users and roles, branches, products, stock batches, prescriptions, orders, deliveries and audit events provide the core operational relationships.

### Algorithms and decision rules

Input schemas and role boundaries constrain workflow transitions. Batch and expiry records enable stock-aware decisions, but an inspected schema does not establish which dispensing strategy is active. No diagnostic model, dose recommendation or automated clinical-decision algorithm is claimed.

Why this structure: the component boundaries keep user interaction, business decisions and persistent records distinct where the implementation has those layers. A diagram is not proof that every dependency is connected or operational.

Data categories: domain records and identity/communication data where described above. Public case studies contain no live customer, patient, employee, payment or private-account records. Retention periods, export/deletion handling and recovery objectives need project-specific operating approval; no blanket compliance certification is made.

## Communications

Prescription review and order/delivery updates require role-specific notifications. Email routes and notification modules exist; message delivery and pharmacist response times were not measured. The public page displayed guidance to configure the API base URL.

## Security

Verified scope is limited to the controls explicitly described in the source review above. An identity library, permission screen, audit table or secure-sounding landing page does not establish effective authorization in production. This project includes unusually sensitive health workflows; operational approval and clinical authority are outside this software portfolio. Production review must test ownership and role boundaries, session handling, validation, secrets, audit, backup restoration and error behaviour. No private dashboard screenshots or personal/payment records are disclosed.

## Development process

Development reconstruction from inspected source and project records; dates and durations for individual phases are not fully available.

1. Frame the operational problem and acceptance criteria.
2. Build the entities and public/role-specific interfaces described above.
3. Connect validation, state transitions and integrations represented in source.
4. Reconcile deployment, data durability, access and operational evidence.
5. This audit: review source/provider records and capture eligible public screens on 18 November 2026.

Project-specific challenge: The public frontend uses strong production-oriented copy, yet its catalogue area reports the API configuration dependency. Packaging documentation, provider deployment status and genuine clinical readiness must be evaluated separately.

This sequence explains the implementation structure; it is not a fabricated historical sprint diary. Tests in this project were not rerun as part of the cross-project audit unless an explicit current result is recorded.

## Contribution

Chrispine Mndala: project ownership and development work, as identified by the user’s project history and the reviewed repository or saved deliverable. The study explains the implementation at project level; it does not claim every dependency, template, design asset or line of code was authored from scratch.

## Collaboration and attribution

Frameworks, open-source components, starter templates, AI-assisted development and external providers retain their own authorship. A complete contributor-by-commit audit, team timesheet and client acceptance record were not provided. No client endorsement or paid engagement is inferred from a public website.

## Evidence, financial handling and savings

Evidence as of 18 November 2026: Public frontend observed. API configuration dependency visible. Authenticated dispensing, multi-role authority, live payments and regulatory compliance are not certified here.

Financial workflow: The source documents orders and payment-gateway integrations, including mobile-money options. No active merchant credential, live transaction, refund settlement or healthcare business revenue was verified. Provider support in code must be reconciled with actual operational accounts.

Benefit mechanism: Potential reductions include repeated prescription handling, stock enquiries and delivery coordination. No patient-outcome improvement, error-rate reduction, uptime result or cost saving has been measured.

Savings status: NOT MEASURED. The study has no verified before/after labour, error, conversion, hosting-spend or revenue dataset. Measure comparable transaction volumes and service quality before claiming a saving.

Measurement method: monthly net benefit = (baseline minutes − current minutes) × monthly transactions ÷ 60 × loaded hourly labour cost + verified avoided rework − incremental hosting, provider and support cost. Reduced staff time is capacity released unless payroll or another actual cash expense falls. Revenue uplift is separate and requires attributable collections and direct-cost evidence.

Project cost, development hours, collected fees, operating spend, gross profit and realized ROI: not supplied or not verified for public disclosure.

## Lessons

A shared web application can serve phone and desktop users without separate initial native builds. Relational batch and prescription data fit traceable workflows. API separation allows frontend hosting to be independent, but introduces an explicit connectivity and deployment dependency.

The broader lesson is to select the smallest maintainable system that protects the critical workflow. Source completeness, a READY hosting build, a successful human journey and measured business benefit are separate milestones. The historical reasons for every technology choice are not recoverable from source alone; rationales here are identified as engineering assessments.

## Next phase and open questions

Verify the secure API and role matrix, de-identified prescription and reversal flows, batch/expiry behaviour, backup restore and operational incident process. Clinical and regulatory approval must come from accountable qualified operators.

Unanswered with current evidence: actual development duration and cost; client sign-off; current active users; completed business transactions; recurring fees collected; before/after savings; support workload; production recovery time and current end-to-end test results. Those questions require records, not invented answers.

## Source review

{
  "date": "2026-11-18",
  "status": "internally_verified",
  "disclosure": "approved_public",
  "scope": "Public frontend observed. API configuration dependency visible. Authenticated dispensing, multi-role authority, live payments and regulatory compliance are not certified here.",
  "sourceFiles": [
    {
      "path": "README.md",
      "blob_sha": "4b83bfa213eabad9abab023e77c70313cd061e27",
      "url": "https://github.com/Chrispine-1210/Health-Care-Management-System/blob/main/README.md"
    },
    {
      "path": "package.json",
      "blob_sha": "bad00871b40bbb0c2df6f4c33d4332a8913c5a4c",
      "url": "https://github.com/Chrispine-1210/Health-Care-Management-System/blob/main/package.json"
    },
    {
      "path": "shared/schema.ts",
      "blob_sha": "69b76d1996b88e87169badd4458d3cb6043b12f4",
      "url": "https://github.com/Chrispine-1210/Health-Care-Management-System/blob/main/shared/schema.ts"
    }
  ],
  "screenshotStatus": "current public browser captures",
  "claim": "Source or saved implementation and available public surface reviewed on 18 Nov 2026. Scope: Public frontend observed. API configuration dependency visible. Authenticated dispensing, multi-role authority, live payments and regulatory compliance are not certified here."
}
