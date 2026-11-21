# ThriveBridge Malawi — Community information & intake

A source-reviewed community website with programme, coaching, story, resource, contact and newsletter components. Current deployment and real programme impact were not independently established.

## Problem

Community programmes need understandable information and a consistent way to receive interest. A static message scattered across social channels is difficult to organize into discoverable programmes, resources and follow-up records.

## Objectives

Explain programme pathways; provide contact and newsletter intake; validate submitted data; support maintainable responsive content. Confirm storage, access control and real delivery before treating submissions as an operating service.

## Malawi context

Malawi is the stated operating context for this project. The design case prioritizes phone access, clear local service workflows, accountable human handoffs and a modest operating footprint. These are design requirements and engineering judgments, not a claim that every user lacks connectivity or that measured national impact has occurred.

## Features and business procedures

### Components and features

Home, about, programmes, career coaching, resources, stories, involvement and contact pages; event carousel; news and hero components; contact and newsletter endpoints.

### Why these technologies?

Reusable programme and news components reduce repeated page construction. Shared schemas align forms with server data. A small API fits contact intake, but staff access to personal records needs explicit authorization before release.

### Business procedure and financial handling

No donations, subscriptions, paid coaching revenue, programme budget or settlement flow was verified. The published case is limited to the information and intake implementation.

## Architecture, data and algorithms

![Component architecture diagram; conceptual source model](https://raw.githubusercontent.com/Chrispine-1210/ChrispinePortfolio/agent/project-casebooks-20261118/client/public/project-evidence/2026-11-18/thrivebridge-malawi-community-platform-architecture.svg)

React client → Express endpoints → storage abstraction with shared PostgreSQL/Drizzle schema. The inspected schema defines users, contacts and newsletters. A schema alone does not prove which storage implementation is active in a deployment.

### Algorithms and decision rules

Zod validates contact/newsletter input and duplicate newsletter subscriptions return a conflict response. The reviewed contact/newsletter list routes do not show an authorization middleware in the inspected route file; this is a release-review concern, not a claim of secure production access.

Why this structure: the component boundaries keep user interaction, business decisions and persistent records distinct where the implementation has those layers. A diagram is not proof that every dependency is connected or operational.

Data categories: domain records and identity/communication data where described above. Public case studies contain no live customer, patient, employee, payment or private-account records. Retention periods, export/deletion handling and recovery objectives need project-specific operating approval; no blanket compliance certification is made.

## Communications

Contact and newsletter records provide intake; list endpoints allow records to be retrieved. A stored subscription is not evidence that a campaign was sent or an organization responded.

## Security

Verified scope is limited to the controls explicitly described in the source review above. An identity library, permission screen, audit table or secure-sounding landing page does not establish effective authorization in production. Production review must test ownership and role boundaries, session handling, validation, secrets, audit, backup restoration and error behaviour. Source review identified a specific contact-list access-control concern described in the development section. No private dashboard screenshots or personal/payment records are disclosed.

## Development process

Development reconstruction from inspected source and project records; dates and durations for individual phases are not fully available.

1. Frame the operational problem and acceptance criteria.
2. Build the entities and public/role-specific interfaces described above.
3. Connect validation, state transitions and integrations represented in source.
4. Reconcile deployment, data durability, access and operational evidence.
5. This audit: review source/provider records and capture eligible public screens on 18 November 2026.

Project-specific challenge: No current matching Vercel deployment was found in the audited account. Storage behaviour, contact-data authorization and actual newsletter delivery require verification. The user’s provided history identifies a volunteer development role; no employment or paid contract is asserted.

This sequence explains the implementation structure; it is not a fabricated historical sprint diary. Tests in this project were not rerun as part of the cross-project audit unless an explicit current result is recorded.

## Contribution

Chrispine Mndala: project ownership and development work, as identified by the user’s project history and the reviewed repository or saved deliverable. The study explains the implementation at project level; it does not claim every dependency, template, design asset or line of code was authored from scratch.

## Collaboration and attribution

Frameworks, open-source components, starter templates, AI-assisted development and external providers retain their own authorship. A complete contributor-by-commit audit, team timesheet and client acceptance record were not provided. No client endorsement or paid engagement is inferred from a public website.

## Evidence, financial handling and savings

Evidence as of 18 November 2026: Source implementation reviewed; live deployment and operational adoption not verified. No current product screenshot captured.

Financial workflow: No donations, subscriptions, paid coaching revenue, programme budget or settlement flow was verified. The published case is limited to the information and intake implementation.

Benefit mechanism: Potential reductions are repeated programme explanations and inconsistent intake records. No beneficiary counts, campaign results or measured staff-time savings are attributed to the code.

Savings status: NOT MEASURED. The study has no verified before/after labour, error, conversion, hosting-spend or revenue dataset. Measure comparable transaction volumes and service quality before claiming a saving.

Measurement method: monthly net benefit = (baseline minutes − current minutes) × monthly transactions ÷ 60 × loaded hourly labour cost + verified avoided rework − incremental hosting, provider and support cost. Reduced staff time is capacity released unless payroll or another actual cash expense falls. Revenue uplift is separate and requires attributable collections and direct-cost evidence.

Project cost, development hours, collected fees, operating spend, gross profit and realized ROI: not supplied or not verified for public disclosure.

Screenshot gap: no eligible current product capture was obtained. The cover is a labelled source-based architecture diagram, not a simulated screenshot.

## Lessons

Reusable programme and news components reduce repeated page construction. Shared schemas align forms with server data. A small API fits contact intake, but staff access to personal records needs explicit authorization before release.

The broader lesson is to select the smallest maintainable system that protects the critical workflow. Source completeness, a READY hosting build, a successful human journey and measured business benefit are separate milestones. The historical reasons for every technology choice are not recoverable from source alone; rationales here are identified as engineering assessments.

## Next phase and open questions

Verify current ownership and deployment; add or prove protected staff access; test persistence and duplicate handling; obtain content approval and capture a public, de-identified interface.

Unanswered with current evidence: actual development duration and cost; client sign-off; current active users; completed business transactions; recurring fees collected; before/after savings; support workload; production recovery time and current end-to-end test results. Those questions require records, not invented answers.

## Source review

{
  "date": "2026-11-18",
  "status": "internally_verified",
  "disclosure": "approved_public",
  "scope": "Source implementation reviewed; live deployment and operational adoption not verified. No current product screenshot captured.",
  "sourceFiles": [
    {
      "path": "package.json",
      "blob_sha": "f48b524995891d81a8984b2910dc5888a3691400",
      "url": "https://github.com/Chrispine-1210/ThriveBridge-Malawi-/blob/main/package.json"
    },
    {
      "path": "shared/schema.ts",
      "blob_sha": "98ab99e263a1f7418a6bea617f1a2d0e62bf8831",
      "url": "https://github.com/Chrispine-1210/ThriveBridge-Malawi-/blob/main/shared/schema.ts"
    }
  ],
  "screenshotStatus": "missing; architecture cover only",
  "claim": "Source or saved implementation and available public surface reviewed on 18 Nov 2026. Scope: Source implementation reviewed; live deployment and operational adoption not verified. No current product screenshot captured."
}
