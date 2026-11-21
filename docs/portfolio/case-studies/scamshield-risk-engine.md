# ScamShield — Threat reporting & risk engine prototype

A modular threat-reporting and risk-scoring prototype with a public search interface and documented SDK boundaries. Predictive accuracy, live intelligence coverage and production safeguards are unverified.

## Problem

Users need a way to inspect suspicious phone numbers and URLs and contribute reports. A useful risk signal must also explain uncertainty, avoid presenting unverified allegations as fact and allow false-positive review.

## Objectives

Validate report input; combine inspectable risk signals; separate engine from UI; support single and batch lookup; retain enough evidence for moderation. Establish measured accuracy and security before any claim of fraud prevention.

## Malawi context

Malawi is the stated operating context for this project. The design case prioritizes phone access, clear local service workflows, accountable human handoffs and a modest operating footprint. These are design requirements and engineering judgments, not a claim that every user lacks connectivity or that measured national impact has occurred.

## Features and business procedures

### Components and features

Threat search, report submission and feed endpoints; modular engine/SDK documentation; threat events and monitoring records; web search/report components; optional AI-analysis and alert-provider integration code.

### Why these technologies?

Separating the engine from the interface supports reuse and testable detectors. Explainable scoring is easier to inspect than an unexplained AI label, but it is vulnerable to poor reports and manipulation unless moderation and validation are added.

### Business procedure and financial handling

No prevented-loss figure, customer contract, subscription revenue or bank/telco integration is verified. Fraud reports and heuristic scores cannot be monetized as certified financial protection without validation and operational governance.

## Architecture, data and algorithms

![Component architecture diagram; conceptual source model](https://raw.githubusercontent.com/Chrispine-1210/ChrispinePortfolio/agent/project-casebooks-20261118/client/public/project-evidence/2026-11-18/scamshield-risk-engine-architecture.svg)

React/Vite interface → Express API → modular detection and storage abstractions. The implementation-status document identifies in-memory persistence for the MVP; a PostgreSQL schema exists but does not prove production persistence.

### Algorithms and decision rules

The documented basic score adds min(2 × report count, 30), category factors and pattern analysis. Engine contracts describe 0–100 scores and risk bands. These are heuristic signals, not fraud probabilities; no evaluated false-positive/false-negative dataset or calibration evidence was reviewed.

Why this structure: the component boundaries keep user interaction, business decisions and persistent records distinct where the implementation has those layers. A diagram is not proof that every dependency is connected or operational.

Data categories: domain records and identity/communication data where described above. Public case studies contain no live customer, patient, employee, payment or private-account records. Retention periods, export/deletion handling and recovery objectives need project-specific operating approval; no blanket compliance certification is made.

## Communications

The status document lists Twilio capability as unactivated and no event-driven SMS connection. AI/API availability and delivery behaviour were not exercised. No alert was sent.

## Security

Verified scope is limited to the controls explicitly described in the source review above. An identity library, permission screen, audit table or secure-sounding landing page does not establish effective authorization in production. Production review must test ownership and role boundaries, session handling, validation, secrets, audit, backup restoration and error behaviour. No private dashboard screenshots or personal/payment records are disclosed.

## Development process

Development reconstruction from inspected source and project records; dates and durations for individual phases are not fully available.

1. Frame the operational problem and acceptance criteria.
2. Build the entities and public/role-specific interfaces described above.
3. Connect validation, state transitions and integrations represented in source.
4. Reconcile deployment, data durability, access and operational evidence.
5. This audit: review source/provider records and capture eligible public screens on 18 November 2026.

Project-specific challenge: The implementation-status document explicitly records missing rate limiting, moderation, API authentication and other production controls. Its response-time claim was not reproduced and is not accepted as measured evidence here.

This sequence explains the implementation structure; it is not a fabricated historical sprint diary. Tests in this project were not rerun as part of the cross-project audit unless an explicit current result is recorded.

## Contribution

Chrispine Mndala: project ownership and development work, as identified by the user’s project history and the reviewed repository or saved deliverable. The study explains the implementation at project level; it does not claim every dependency, template, design asset or line of code was authored from scratch.

## Collaboration and attribution

Frameworks, open-source components, starter templates, AI-assisted development and external providers retain their own authorship. A complete contributor-by-commit audit, team timesheet and client acceptance record were not provided. No client endorsement or paid engagement is inferred from a public website.

## Evidence, financial handling and savings

Evidence as of 18 November 2026: Source-reviewed prototype. Live deployment, durable persistence, detection accuracy, financial-loss prevention and production security are not verified.

Financial workflow: No prevented-loss figure, customer contract, subscription revenue or bank/telco integration is verified. Fraud reports and heuristic scores cannot be monetized as certified financial protection without validation and operational governance.

Benefit mechanism: Potential value is quicker structured investigation and reusable risk-check components. No money saved, scams prevented, accuracy percentage or latency guarantee is claimed.

Savings status: NOT MEASURED. The study has no verified before/after labour, error, conversion, hosting-spend or revenue dataset. Measure comparable transaction volumes and service quality before claiming a saving.

Measurement method: monthly net benefit = (baseline minutes − current minutes) × monthly transactions ÷ 60 × loaded hourly labour cost + verified avoided rework − incremental hosting, provider and support cost. Reduced staff time is capacity released unless payroll or another actual cash expense falls. Revenue uplift is separate and requires attributable collections and direct-cost evidence.

Project cost, development hours, collected fees, operating spend, gross profit and realized ROI: not supplied or not verified for public disclosure.

Screenshot gap: no eligible current product capture was obtained. The cover is a labelled source-based architecture diagram, not a simulated screenshot.

## Lessons

Separating the engine from the interface supports reuse and testable detectors. Explainable scoring is easier to inspect than an unexplained AI label, but it is vulnerable to poor reports and manipulation unless moderation and validation are added.

The broader lesson is to select the smallest maintainable system that protects the critical workflow. Source completeness, a READY hosting build, a successful human journey and measured business benefit are separate milestones. The historical reasons for every technology choice are not recoverable from source alone; rationales here are identified as engineering assessments.

## Next phase and open questions

Add accountable report moderation and abuse controls, test durable persistence, evaluate on a consented labelled dataset, publish precision/recall and false-positive limits, then certify a protected preview.

Unanswered with current evidence: actual development duration and cost; client sign-off; current active users; completed business transactions; recurring fees collected; before/after savings; support workload; production recovery time and current end-to-end test results. Those questions require records, not invented answers.

## Source review

{
  "date": "2026-11-18",
  "status": "internally_verified",
  "disclosure": "approved_public",
  "scope": "Source-reviewed prototype. Live deployment, durable persistence, detection accuracy, financial-loss prevention and production security are not verified.",
  "sourceFiles": [
    {
      "path": "README.md",
      "blob_sha": "fb436eceab6753d51bc392eaf6203cbe2a7ab4cf",
      "url": "https://github.com/Chrispine-1210/ScamShield/blob/main/README.md"
    },
    {
      "path": "package.json",
      "blob_sha": "1353e88db75015b78c7bd7eb524c335ea450ab27",
      "url": "https://github.com/Chrispine-1210/ScamShield/blob/main/package.json"
    },
    {
      "path": "shared/schema.ts",
      "blob_sha": "8a7d1431b09c65b5cf32526442a565ccc6803afa",
      "url": "https://github.com/Chrispine-1210/ScamShield/blob/main/shared/schema.ts"
    }
  ],
  "screenshotStatus": "missing; architecture cover only",
  "claim": "Source or saved implementation and available public surface reviewed on 18 Nov 2026. Scope: Source-reviewed prototype. Live deployment, durable persistence, detection accuracy, financial-loss prevention and production security are not verified."
}
