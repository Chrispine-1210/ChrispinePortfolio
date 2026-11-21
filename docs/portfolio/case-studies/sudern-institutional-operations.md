# SUDERN — Institutional operations platform

An institutional operations platform with protected access, audit and PostgreSQL work. Its public alias currently serves an infrastructure canary, not the operating application.

## Problem

A development organization needs accountable intake, staff access and operational records without confusing a public website with a functioning internal system. Premature public intake would create obligations before the organization can reliably process them.

## Objectives

Establish protected institutional workflows, replay-resistant privileged authentication, accountable status changes and recoverable data. Keep public intake closed until the actual operational application and its database are certified.

## Malawi context

Malawi is the stated operating context for this project. The design case prioritizes phone access, clear local service workflows, accountable human handoffs and a modest operating footprint. These are design requirements and engineering judgments, not a claim that every user lacks connectivity or that measured national impact has occurred.

## Features and business procedures

### Components and features

Public institutional pages, application intake assets, portal pages, PostgreSQL and synthetic SQLite implementations, MFA, audit functions, migrations, secure backup/restore scripts and guarded preview smoke tests are represented in source.

### Why these technologies?

A small server and static assets make operational behaviour easier to inspect. PostgreSQL supports locking and durable multi-user records. Separate canary and operating builds isolate infrastructure checks from unapproved service activation.

### Business procedure and financial handling

The platform’s institutional operating context does not establish donor receipts, programme expenditure, reconciled bank statements or organization revenue. Hosting-canary success must not be used as evidence of operational or financial activity.

## Architecture, data and algorithms

![Component architecture diagram; conceptual source model](https://raw.githubusercontent.com/Chrispine-1210/ChrispinePortfolio/agent/project-casebooks-20261118/client/public/project-evidence/2026-11-18/sudern-institutional-operations-architecture.svg)

Static public/portal assets → Node server or Vercel API entry → PostgreSQL adapter. A legacy SQLite sandbox supports development verification. PostgreSQL migrations establish the live target schema and privileged TOTP replay-control state.

### Algorithms and decision rules

Privileged TOTP validation tracks the last-used time step; release notes document a fix to select the replay-control field in the locked account query. Sensitive status changes use database locking. Precision-safe BIGINT handling and fail-closed production-hold checks are documented.

Why this structure: the component boundaries keep user interaction, business decisions and persistent records distinct where the implementation has those layers. A diagram is not proof that every dependency is connected or operational.

Data categories: domain records and identity/communication data where described above. Public case studies contain no live customer, patient, employee, payment or private-account records. Retention periods, export/deletion handling and recovery objectives need project-specific operating approval; no blanket compliance certification is made.

## Communications

Application pages and intake assets exist, but public intake is explicitly disabled. No outreach, applicant notification or organization message was sent during this audit.

## Security

Verified scope is limited to the controls explicitly described in the source review above. An identity library, permission screen, audit table or secure-sounding landing page does not establish effective authorization in production. Production review must test ownership and role boundaries, session handling, validation, secrets, audit, backup restoration and error behaviour. No private dashboard screenshots or personal/payment records are disclosed.

## Development process

Development reconstruction from inspected source and project records; dates and durations for individual phases are not fully available.

1. Frame the operational problem and acceptance criteria.
2. Build the entities and public/role-specific interfaces described above.
3. Connect validation, state transitions and integrations represented in source.
4. Reconcile deployment, data durability, access and operational evidence.
5. This audit: review source/provider records and capture eligible public screens on 18 November 2026.

Project-specific challenge: Historical documents mix earlier canaries, protected operational previews and PostgreSQL certification gaps. The current public alias explicitly states “synthetic hosting-verification build” and “Production release: NOT AUTHORISED.” That visible state governs this public case study.

This sequence explains the implementation structure; it is not a fabricated historical sprint diary. Tests in this project were not rerun as part of the cross-project audit unless an explicit current result is recorded.

## Contribution

Chrispine Mndala: project ownership and development work, as identified by the user’s project history and the reviewed repository or saved deliverable. The study explains the implementation at project level; it does not claim every dependency, template, design asset or line of code was authored from scratch.

## Collaboration and attribution

Frameworks, open-source components, starter templates, AI-assisted development and external providers retain their own authorship. A complete contributor-by-commit audit, team timesheet and client acceptance record were not provided. No client endorsement or paid engagement is inferred from a public website.

## Evidence, financial handling and savings

Evidence as of 18 November 2026: Public infrastructure canary observed. Protected operational-preview evidence exists in source history but was not reproduced here. Production release and public intake remain unauthorized in the observed page.

Financial workflow: The platform’s institutional operating context does not establish donor receipts, programme expenditure, reconciled bank statements or organization revenue. Hosting-canary success must not be used as evidence of operational or financial activity.

Benefit mechanism: Potential value is accountable intake and auditable delegated work. No beneficiary outcomes, programme efficiencies, donor funds or financial savings are attributed to this software.

Savings status: NOT MEASURED. The study has no verified before/after labour, error, conversion, hosting-spend or revenue dataset. Measure comparable transaction volumes and service quality before claiming a saving.

Measurement method: monthly net benefit = (baseline minutes − current minutes) × monthly transactions ÷ 60 × loaded hourly labour cost + verified avoided rework − incremental hosting, provider and support cost. Reduced staff time is capacity released unless payroll or another actual cash expense falls. Revenue uplift is separate and requires attributable collections and direct-cost evidence.

Project cost, development hours, collected fees, operating spend, gross profit and realized ROI: not supplied or not verified for public disclosure.

Image note: the captured page is the infrastructure canary. It is intentionally not presented as a screenshot of the operational platform.

## Lessons

A small server and static assets make operational behaviour easier to inspect. PostgreSQL supports locking and durable multi-user records. Separate canary and operating builds isolate infrastructure checks from unapproved service activation.

The broader lesson is to select the smallest maintainable system that protects the critical workflow. Source completeness, a READY hosting build, a successful human journey and measured business benefit are separate milestones. The historical reasons for every technology choice are not recoverable from source alone; rationales here are identified as engineering assessments.

## Next phase and open questions

Verify the actual protected application against the exact mainline commit, exercise PostgreSQL authority and restore tests, reconcile release records and obtain accountable activation before opening intake.

Unanswered with current evidence: actual development duration and cost; client sign-off; current active users; completed business transactions; recurring fees collected; before/after savings; support workload; production recovery time and current end-to-end test results. Those questions require records, not invented answers.

## Source review

{
  "date": "2026-11-18",
  "status": "internally_verified",
  "disclosure": "approved_public",
  "scope": "Public infrastructure canary observed. Protected operational-preview evidence exists in source history but was not reproduced here. Production release and public intake remain unauthorized in the observed page.",
  "sourceFiles": [
    {
      "path": "README.md",
      "blob_sha": "481a117561fc88c23d43d78de51516eeabbf1585",
      "url": "https://github.com/Chrispine-1210/Sudern-ORG/blob/main/README.md"
    },
    {
      "path": "package.json",
      "blob_sha": "7315cb00482598514e44bdaf3f19de0fdb1fa485",
      "url": "https://github.com/Chrispine-1210/Sudern-ORG/blob/main/package.json"
    }
  ],
  "screenshotStatus": "current public browser captures",
  "claim": "Source or saved implementation and available public surface reviewed on 18 Nov 2026. Scope: Public infrastructure canary observed. Protected operational-preview evidence exists in source history but was not reproduced here. Production release and public intake remain unauthorized in the observed page."
}
