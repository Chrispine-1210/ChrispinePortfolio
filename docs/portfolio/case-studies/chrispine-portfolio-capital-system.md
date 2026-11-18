# Chrispine Portfolio — Evidence, revenue & capital control

The portfolio itself combines governed public case studies with private content, pipeline, revenue and capital-control workspaces. Public evidence publishing and internal financial operation are separate concerns.

## Problem

A portfolio that publishes unsupported claims creates reputation risk, while an unstructured contact inbox loses commercial context. The system needs to connect proof of work to qualified demand and retain a traceable distinction between pipeline, earned value and cash.

## Objectives

Publish only approved case studies and claims; keep private project/commercial records internal; capture qualified enquiries; connect acquisition and revenue records; preserve safe financial limits and audit history. The public case-study catalogue is the immediate delivery target.

## Malawi context

Malawi is the stated operating context for this project. The design case prioritizes phone access, clear local service workflows, accountable human handoffs and a modest operating footprint. These are design requirements and engineering judgments, not a claim that every user lacks connectivity or that measured national impact has occurred.

## Features and business procedures

### Components and features

Public portfolio search/detail, blog, services and contact routes; database-backed administrator permissions; editorial workflow and evidence approvals; acquisition attribution; lead pipeline; revenue intelligence; capital operating system; treasury/ROIC modules and audit records.

### Why these technologies?

An explicit publication projection supports safe public communication. Relational evidence and audit records support traceability. Typed inputs keep editorial and financial contracts consistent. The cost is stronger authorization, evidence review and deployment verification requirements.

### Business procedure and financial handling

Internal source covers revenue/cost evidence, invoices, cash realization, capital budgets and treasury/ROIC calculations. This study publishes no private financial balances and makes no revenue claim. Financial runtime certification from earlier work must be reconciled to the deployed commit before it supports an operating claim.

## Architecture, data and algorithms

![Component architecture diagram; conceptual source model](https://raw.githubusercontent.com/Chrispine-1210/ChrispinePortfolio/agent/project-casebooks-20261118/client/public/project-evidence/2026-11-18/chrispine-portfolio-capital-system-architecture.svg)

React/Vite frontend → Express services and governance routes → Neon PostgreSQL through Drizzle. Private projects and public case studies are separate entities. Evidence records carry verification and disclosure states; the public API returns an explicit editorial projection rather than private project values or source references.

### Algorithms and decision rules

Publication requires published workflow state, public/unlisted visibility and an approved evidence gate. Unverified or unresolved active evidence blocks publication; withdrawals remain auditable. Changes invalidate previous disclosure approvals. Financial modules distinguish invoices, collections, operating costs and capital budgets rather than equating pipeline with cash.

Why this structure: the component boundaries keep user interaction, business decisions and persistent records distinct where the implementation has those layers. A diagram is not proof that every dependency is connected or operational.

Data categories: domain records and identity/communication data where described above. Public case studies contain no live customer, patient, employee, payment or private-account records. Retention periods, export/deletion handling and recovery objectives need project-specific operating approval; no blanket compliance certification is made.

## Communications

Contact, subscriber, email-delivery and notification modules organize business communication. Acquisition records connect source context to pipeline. No commercial or newsletter message was sent as part of this documentation audit.

## Security

Verified scope is limited to the controls explicitly described in the source review above. An identity library, permission screen, audit table or secure-sounding landing page does not establish effective authorization in production. Production review must test ownership and role boundaries, session handling, validation, secrets, audit, backup restoration and error behaviour. No private dashboard screenshots or personal/payment records are disclosed.

## Development process

Development reconstruction from inspected source and project records; dates and durations for individual phases are not fully available.

1. Frame the operational problem and acceptance criteria.
2. Build the entities and public/role-specific interfaces described above.
3. Connect validation, state transitions and integrations represented in source.
4. Reconcile deployment, data durability, access and operational evidence.
5. This audit: review source/provider records and capture eligible public screens on 18 November 2026.

Project-specific challenge: The current public site contained only two case studies. The latest analytics preview failed its audit gate after build verification. This documentation work expands case coverage and exposes previously stored dossier fields without changing financial permissions or weakening publication rules.

This sequence explains the implementation structure; it is not a fabricated historical sprint diary. Tests in this project were not rerun as part of the cross-project audit unless an explicit current result is recorded.

## Contribution

Chrispine Mndala: project ownership and development work, as identified by the user’s project history and the reviewed repository or saved deliverable. The study explains the implementation at project level; it does not claim every dependency, template, design asset or line of code was authored from scratch.

## Collaboration and attribution

Frameworks, open-source components, starter templates, AI-assisted development and external providers retain their own authorship. A complete contributor-by-commit audit, team timesheet and client acceptance record were not provided. No client endorsement or paid engagement is inferred from a public website.

## Evidence, financial handling and savings

Evidence as of 18 November 2026: Public portfolio observed. Documentation records are the deliverable of this audit. New renderer deployment remains subject to the repository’s dependency/security and release checks.

Financial workflow: Internal source covers revenue/cost evidence, invoices, cash realization, capital budgets and treasury/ROIC calculations. This study publishes no private financial balances and makes no revenue claim. Financial runtime certification from earlier work must be reconciled to the deployed commit before it supports an operating claim.

Benefit mechanism: Potential savings are less manual proposal explanation and fewer repeated evidence requests. Portfolio conversion, customer acquisition cost, collected fees and capital return have not been established by this case study.

Savings status: NOT MEASURED. The study has no verified before/after labour, error, conversion, hosting-spend or revenue dataset. Measure comparable transaction volumes and service quality before claiming a saving.

Measurement method: monthly net benefit = (baseline minutes − current minutes) × monthly transactions ÷ 60 × loaded hourly labour cost + verified avoided rework − incremental hosting, provider and support cost. Reduced staff time is capacity released unless payroll or another actual cash expense falls. Revenue uplift is separate and requires attributable collections and direct-cost evidence.

Project cost, development hours, collected fees, operating spend, gross profit and realized ROI: not supplied or not verified for public disclosure.

## Lessons

An explicit publication projection supports safe public communication. Relational evidence and audit records support traceability. Typed inputs keep editorial and financial contracts consistent. The cost is stronger authorization, evidence review and deployment verification requirements.

The broader lesson is to select the smallest maintainable system that protects the critical workflow. Source completeness, a READY hosting build, a successful human journey and measured business benefit are separate milestones. The historical reasons for every technology choice are not recoverable from source alone; rationales here are identified as engineering assessments.

## Next phase and open questions

Resolve the release audit condition; deploy the reviewed case-study renderer; verify mobile and public routes; add de-identified authenticated product screens only where authorized; measure enquiry-to-qualified-lead and proposal-to-collection conversion.

Unanswered with current evidence: actual development duration and cost; client sign-off; current active users; completed business transactions; recurring fees collected; before/after savings; support workload; production recovery time and current end-to-end test results. Those questions require records, not invented answers.

## Source review

{
  "date": "2026-11-18",
  "status": "internally_verified",
  "disclosure": "approved_public",
  "scope": "Public portfolio observed. Documentation records are the deliverable of this audit. New renderer deployment remains subject to the repository’s dependency/security and release checks.",
  "sourceFiles": [
    {
      "path": "shared/schema.ts"
    },
    {
      "path": "server/portfolio/policy.ts"
    },
    {
      "path": "server/portfolio/public-case-study-service.ts"
    },
    {
      "path": "network-ops-training-platform/index.html"
    }
  ],
  "screenshotStatus": "current public browser captures",
  "claim": "Source or saved implementation and available public surface reviewed on 18 Nov 2026. Scope: Public portfolio observed. Documentation records are the deliverable of this audit. New renderer deployment remains subject to the repository’s dependency/security and release checks."
}
