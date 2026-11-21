# Mtendere Education Consult — Education services platform

An education consultancy platform connecting opportunity discovery, applications, administration and communications. Source implementation reviewed; current public-domain access could not be certified.

## Problem

Students and consultancy staff need a consistent path from finding a scholarship or job to an application, consultation and follow-up. Publishing opportunities without a managed application and communication trail leaves staff reconciling separate records.

## Objectives

Make opportunities discoverable; preserve application and review records; separate editorial and administrative permissions; connect verification, notifications and reporting. Acceptance requires a complete student-to-staff journey, not only a working landing page.

## Malawi context

Malawi is the stated operating context for this project. The design case prioritizes phone access, clear local service workflows, accountable human handoffs and a modest operating footprint. These are design requirements and engineering judgments, not a claim that every user lacks connectivity or that measured national impact has occurred.

## Features and business procedures

### Components and features

Scholarship and job listings; applications and supporting documents; application reviews; partner and event records; blog publishing; team management; saved items; consultation messages; referral and commission records; email queues, preferences and delivery events are represented in source.

### Why these technologies?

React supports shared interaction patterns across the public and administrative clients. TypeScript and shared schemas reduce contract drift. Express separates API rules from screens; relational storage fits application, review and finance relationships. Vite supports separate builds. These are engineering assessments; the original decision log is incomplete.

### Business procedure and financial handling

Payments, commission rules, commissions, wallet accounts, ledger entries and payout requests exist in the schema. A consultation request, application, wallet balance or invoice is not proof of collected cash. Provider credentials, settlement reconciliation and actual business receipts were not inspected for this study.

## Architecture, data and algorithms

![Component architecture diagram; conceptual source model](https://raw.githubusercontent.com/Chrispine-1210/ChrispinePortfolio/agent/project-casebooks-20261118/client/public/project-evidence/2026-11-18/mtendere-education-platform-architecture.svg)

React client and separate Admin application → Express API → Drizzle/PostgreSQL. Records include users, scholarships, jobs, applications, reviews, documents, events, partners and communication events. Applications reference the person and opportunity; review and document records extend the application workflow.

### Algorithms and decision rules

Schema validation constrains inputs. Unique token hashes and JWT identifiers support verification bookkeeping. The schema separates payment status events, commissions, wallet accounts and ledger entries; AI response-cache records and usage records are distinct. Those structures are inspectable, but an enabled payment processor or an effective AI cache is not proven by a table definition.

Why this structure: the component boundaries keep user interaction, business decisions and persistent records distinct where the implementation has those layers. A diagram is not proof that every dependency is connected or operational.

Data categories: domain records and identity/communication data where described above. Public case studies contain no live customer, patient, employee, payment or private-account records. Retention periods, export/deletion handling and recovery objectives need project-specific operating approval; no blanket compliance certification is made.

## Communications

The source contains email jobs, provider delivery events, preference and unsubscribe records, versioned templates, campaigns, communication documents and workflow tasks. Queue creation, provider acceptance, delivery and a human response must be measured separately.

## Security

Verified scope is limited to the controls explicitly described in the source review above. An identity library, permission screen, audit table or secure-sounding landing page does not establish effective authorization in production. Production review must test ownership and role boundaries, session handling, validation, secrets, audit, backup restoration and error behaviour. No private dashboard screenshots or personal/payment records are disclosed.

## Development process

Development reconstruction from inspected source and project records; dates and durations for individual phases are not fully available.

1. Frame the operational problem and acceptance criteria.
2. Build the entities and public/role-specific interfaces described above.
3. Connect validation, state transitions and integrations represented in source.
4. Reconcile deployment, data durability, access and operational evidence.
5. This audit: review source/provider records and capture eligible public screens on 18 November 2026.

Project-specific challenge: Source history contains dedicated Vercel build scripts, media-asset preparation, test-database isolation and email/DNS validation scripts. Current latest provider attempt is BLOCKED despite an earlier READY production build. The custom domain returned an HTTP/2 loading error in this browser; the inspected provider URL returned 403.

This sequence explains the implementation structure; it is not a fabricated historical sprint diary. Tests in this project were not rerun as part of the cross-project audit unless an explicit current result is recorded.

## Contribution

Chrispine Mndala: project ownership and development work, as identified by the user’s project history and the reviewed repository or saved deliverable. The study explains the implementation at project level; it does not claim every dependency, template, design asset or line of code was authored from scratch.

## Collaboration and attribution

Frameworks, open-source components, starter templates, AI-assisted development and external providers retain their own authorship. A complete contributor-by-commit audit, team timesheet and client acceptance record were not provided. No client endorsement or paid engagement is inferred from a public website.

## Evidence, financial handling and savings

Evidence as of 18 November 2026: Implemented source; earlier provider build READY; latest attempt BLOCKED. Public-domain availability, authenticated journeys, email delivery and client adoption remain unverified in this audit.

Financial workflow: Payments, commission rules, commissions, wallet accounts, ledger entries and payout requests exist in the schema. A consultation request, application, wallet balance or invoice is not proof of collected cash. Provider credentials, settlement reconciliation and actual business receipts were not inspected for this study.

Benefit mechanism: A connected application and communication model can reduce duplicate entry and missed follow-ups. No baseline for staff minutes, application completion or revenue conversion was supplied.

Savings status: NOT MEASURED. The study has no verified before/after labour, error, conversion, hosting-spend or revenue dataset. Measure comparable transaction volumes and service quality before claiming a saving.

Measurement method: monthly net benefit = (baseline minutes − current minutes) × monthly transactions ÷ 60 × loaded hourly labour cost + verified avoided rework − incremental hosting, provider and support cost. Reduced staff time is capacity released unless payroll or another actual cash expense falls. Revenue uplift is separate and requires attributable collections and direct-cost evidence.

Project cost, development hours, collected fees, operating spend, gross profit and realized ROI: not supplied or not verified for public disclosure.

Image note: the training login screenshot is an archived repository asset with a training account and masked password. Capture date is unknown; it is not evidence of current login success.

## Lessons

React supports shared interaction patterns across the public and administrative clients. TypeScript and shared schemas reduce contract drift. Express separates API rules from screens; relational storage fits application, review and finance relationships. Vite supports separate builds. These are engineering assessments; the original decision log is incomplete.

The broader lesson is to select the smallest maintainable system that protects the critical workflow. Source completeness, a READY hosting build, a successful human journey and measured business benefit are separate milestones. The historical reasons for every technology choice are not recoverable from source alone; rationales here are identified as engineering assessments.

## Next phase and open questions

Re-establish authorized public-domain access; capture de-identified application and admin journeys; verify email delivery; run isolated integration tests; establish an agreed acceptance checklist and measured application turnaround.

Unanswered with current evidence: actual development duration and cost; client sign-off; current active users; completed business transactions; recurring fees collected; before/after savings; support workload; production recovery time and current end-to-end test results. Those questions require records, not invented answers.

## Source review

{
  "date": "2026-11-18",
  "status": "internally_verified",
  "disclosure": "approved_public",
  "scope": "Implemented source; earlier provider build READY; latest attempt BLOCKED. Public-domain availability, authenticated journeys, email delivery and client adoption remain unverified in this audit.",
  "sourceFiles": [
    {
      "path": "README.md",
      "blob_sha": "202a13bd0fed7f95df6e108fe7c910ba45408982",
      "url": "https://github.com/Chrispine-1210/MEC/blob/main/README.md"
    },
    {
      "path": "package.json",
      "blob_sha": "9a6aca765ac51bbd800289665ea3c9dcfcfae476",
      "url": "https://github.com/Chrispine-1210/MEC/blob/main/package.json"
    },
    {
      "path": "shared/schema.ts",
      "blob_sha": "a53e2e2ed95afb0a877304696f95e7bc5ba5c4ec",
      "url": "https://github.com/Chrispine-1210/MEC/blob/main/shared/schema.ts"
    }
  ],
  "screenshotStatus": "archived training capture; date unknown",
  "claim": "Source or saved implementation and available public surface reviewed on 18 Nov 2026. Scope: Implemented source; earlier provider build READY; latest attempt BLOCKED. Public-domain availability, authenticated journeys, email delivery and client adoption remain unverified in this audit."
}
