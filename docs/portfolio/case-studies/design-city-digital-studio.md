# Design City — Architecture studio & content platform

An architecture studio website with a separate administration application, shared API contracts and structured project, media and commerce records.

## Problem

A design studio must show its work, explain services and convert an enquiry into a qualified project request without making every content change a developer task. Project content, media, enquiries and commercial records need ownership and consistent structure.

## Objectives

Publish projects and disciplines clearly; provide an editable content workspace; preserve enquiry and quote records; separate public and administrator experiences; support commerce records without implying a live payment integration.

## Malawi context

Malawi is the stated operating context for this project. The design case prioritizes phone access, clear local service workflows, accountable human handoffs and a modest operating footprint. These are design requirements and engineering judgments, not a claim that every user lacks connectivity or that measured national impact has occurred.

## Features and business procedures

### Components and features

Public projects, services, studio profile, journal, magazine/podcast, marketplace, cart and contact routes. Admin source contains homepage, project, service, team, blog, media, partner, career, order, request, settings and user workspaces.

### Why these technologies?

Separating public and admin builds allows editorial tools to evolve without cluttering the client journey. Shared API contracts reduce duplicated definitions. Relational content records allow reuse across category, detail and navigation pages.

### Business procedure and financial handling

Marketplace and quote records support commercial administration. No evidence of a completed sale, project fee collection, provider settlement or studio revenue uplift was reviewed. Portfolio sample project labels are not independently verified architectural commissions.

## Architecture, data and algorithms

![Component architecture diagram; conceptual source model](https://raw.githubusercontent.com/Chrispine-1210/ChrispinePortfolio/agent/project-casebooks-20261118/client/public/project-evidence/2026-11-18/design-city-digital-studio-architecture.svg)

Separate website and admin applications → API server and generated/shared API clients → relational database schema. Entities include projects, categories, services, pages, media files, menus, products, orders, order items, project requests and project quotes.

### Algorithms and decision rules

Typed API schemas reduce client/server disagreement. Separate order lines preserve commercial detail per order; request and quote entities separate lead capture from a commercial offer. Commerce test files are present, but their existence does not establish a passing current deployment.

Why this structure: the component boundaries keep user interaction, business decisions and persistent records distinct where the implementation has those layers. A diagram is not proof that every dependency is connected or operational.

Data categories: domain records and identity/communication data where described above. Public case studies contain no live customer, patient, employee, payment or private-account records. Retention periods, export/deletion handling and recovery objectives need project-specific operating approval; no blanket compliance certification is made.

## Communications

Contact and project-request routes organize demand capture; journal and media pages support studio communication. Successful form delivery, email receipt and staff follow-up were not exercised.

## Security

Verified scope is limited to the controls explicitly described in the source review above. An identity library, permission screen, audit table or secure-sounding landing page does not establish effective authorization in production. Production review must test ownership and role boundaries, session handling, validation, secrets, audit, backup restoration and error behaviour. No private dashboard screenshots or personal/payment records are disclosed.

## Development process

Development reconstruction from inspected source and project records; dates and durations for individual phases are not fully available.

1. Frame the operational problem and acceptance criteria.
2. Build the entities and public/role-specific interfaces described above.
3. Connect validation, state transitions and integrations represented in source.
4. Reconcile deployment, data durability, access and operational evidence.
5. This audit: review source/provider records and capture eligible public screens on 18 November 2026.

Project-specific challenge: Multiple frontends, generated clients, API deployment and media publishing create synchronization risks. The inspected public homepage loaded, while backend writes and administrator permissions were outside the public capture.

This sequence explains the implementation structure; it is not a fabricated historical sprint diary. Tests in this project were not rerun as part of the cross-project audit unless an explicit current result is recorded.

## Contribution

Chrispine Mndala: project ownership and development work, as identified by the user’s project history and the reviewed repository or saved deliverable. The study explains the implementation at project level; it does not claim every dependency, template, design asset or line of code was authored from scratch.

## Collaboration and attribution

Frameworks, open-source components, starter templates, AI-assisted development and external providers retain their own authorship. A complete contributor-by-commit audit, team timesheet and client acceptance record were not provided. No client endorsement or paid engagement is inferred from a public website.

## Evidence, financial handling and savings

Evidence as of 18 November 2026: Public homepage and navigation observed. Admin source and database structures reviewed. Content persistence, private journeys and commerce operation remain unverified in this audit.

Financial workflow: Marketplace and quote records support commercial administration. No evidence of a completed sale, project fee collection, provider settlement or studio revenue uplift was reviewed. Portfolio sample project labels are not independently verified architectural commissions.

Benefit mechanism: Expected savings are reduced developer involvement in routine publishing and less repeated entry of project metadata. Publishing lead time, qualified enquiry rates and sales conversion have not been measured.

Savings status: NOT MEASURED. The study has no verified before/after labour, error, conversion, hosting-spend or revenue dataset. Measure comparable transaction volumes and service quality before claiming a saving.

Measurement method: monthly net benefit = (baseline minutes − current minutes) × monthly transactions ÷ 60 × loaded hourly labour cost + verified avoided rework − incremental hosting, provider and support cost. Reduced staff time is capacity released unless payroll or another actual cash expense falls. Revenue uplift is separate and requires attributable collections and direct-cost evidence.

Project cost, development hours, collected fees, operating spend, gross profit and realized ROI: not supplied or not verified for public disclosure.

## Lessons

Separating public and admin builds allows editorial tools to evolve without cluttering the client journey. Shared API contracts reduce duplicated definitions. Relational content records allow reuse across category, detail and navigation pages.

The broader lesson is to select the smallest maintainable system that protects the critical workflow. Source completeness, a READY hosting build, a successful human journey and measured business benefit are separate milestones. The historical reasons for every technology choice are not recoverable from source alone; rationales here are identified as engineering assessments.

## Next phase and open questions

Capture an authorized content-edit/publish journey; prove API persistence; validate media rights; replace sample projects with client-approved content; verify enquiry delivery and any payment flow separately.

Unanswered with current evidence: actual development duration and cost; client sign-off; current active users; completed business transactions; recurring fees collected; before/after savings; support workload; production recovery time and current end-to-end test results. Those questions require records, not invented answers.

## Source review

{
  "date": "2026-11-18",
  "status": "internally_verified",
  "disclosure": "approved_public",
  "scope": "Public homepage and navigation observed. Admin source and database structures reviewed. Content persistence, private journeys and commerce operation remain unverified in this audit.",
  "sourceFiles": [
    {
      "path": "package.json",
      "blob_sha": "69ae56e6f25efdf70c8dff09cda7059724b561b3",
      "url": null
    },
    {
      "path": "artifacts/api-server/package.json",
      "blob_sha": "3ad257d556376685e9d1a58d7931b893711fb9ae",
      "url": null
    }
  ],
  "screenshotStatus": "current public browser captures",
  "claim": "Source or saved implementation and available public surface reviewed on 18 Nov 2026. Scope: Public homepage and navigation observed. Admin source and database structures reviewed. Content persistence, private journeys and commerce operation remain unverified in this audit."
}
