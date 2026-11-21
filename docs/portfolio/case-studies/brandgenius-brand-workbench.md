# BrandGenius — AI brand asset workbench

A source-reviewed React application for generating and analysing brand assets through a Gemini service adapter. It is a prototype; output quality, API costs and safe credential deployment are unverified.

## Problem

A small business may need multiple coherent brand formats without rebuilding every prompt manually. The workflow must still preserve design judgement, usage rights, cost control and clarity about machine-generated imagery.

## Objectives

Reuse a supplied brand image across defined output types; separate prompts and service calls from UI; return an inspectable result; establish safe credential handling and cost limits before shared deployment.

## Malawi context

Malawi is the stated operating context for this project. The design case prioritizes phone access, clear local service workflows, accountable human handoffs and a modest operating footprint. These are design requirements and engineering judgments, not a claim that every user lacks connectivity or that measured national impact has occurred.

## Features and business procedures

### Components and features

Generation types include app icons, logo variations, business cards, social banners, letterheads, platform images, website mockups, email signatures and merchandise mockups. The service defines structured brand-analysis outputs and a custom-prompt option.

### Why these technologies?

A shared service adapter centralizes prompt definitions and output contracts. Reusing a source image can improve brief continuity, but does not guarantee brand consistency or editable design layers. Generated raster outputs are not automatically layered Photoshop deliverables.

### Business procedure and financial handling

Provider requests may incur usage costs. No billed usage, design fee, sale, gross-margin result or cost saving was verified. A practical operating model needs per-request budgets, retry limits and attributable usage records.

## Architecture, data and algorithms

![Component architecture diagram; conceptual source model](https://raw.githubusercontent.com/Chrispine-1210/ChrispinePortfolio/agent/project-casebooks-20261118/client/public/project-evidence/2026-11-18/brandgenius-brand-workbench-architecture.svg)

React UI → Gemini service adapter using the Google GenAI SDK → generated result and analysis contracts. A supplied image is encoded for provider input. No durable customer asset database or billing ledger was identified in the inspected files.

### Algorithms and decision rules

A typed generation mode selects a reusable prompt, combines it with the supplied image and calls the provider model. The repository includes a named preview image model; availability was not tested. This is prompt orchestration, not a model trained by the project owner.

Why this structure: the component boundaries keep user interaction, business decisions and persistent records distinct where the implementation has those layers. A diagram is not proof that every dependency is connected or operational.

Data categories: domain records and identity/communication data where described above. Public case studies contain no live customer, patient, employee, payment or private-account records. Retention periods, export/deletion handling and recovery objectives need project-specific operating approval; no blanket compliance certification is made.

## Communications

The service exchanges image/prompt data with an external AI provider. Users need a clear image-rights and data-use decision before uploading client work. No email campaign or customer asset delivery was performed in this audit.

## Security

Verified scope is limited to the controls explicitly described in the source review above. An identity library, permission screen, audit table or secure-sounding landing page does not establish effective authorization in production. Production review must test ownership and role boundaries, session handling, validation, secrets, audit, backup restoration and error behaviour. No private dashboard screenshots or personal/payment records are disclosed.

## Development process

Development reconstruction from inspected source and project records; dates and durations for individual phases are not fully available.

1. Frame the operational problem and acceptance criteria.
2. Build the entities and public/role-specific interfaces described above.
3. Connect validation, state transitions and integrations represented in source.
4. Reconcile deployment, data durability, access and operational evidence.
5. This audit: review source/provider records and capture eligible public screens on 18 November 2026.

Project-specific challenge: The inspected adapter reads API-key environment names in application source; a secure server-side boundary must be verified before deployment. Provider model access, pricing, error handling and rights clearance were not tested.

This sequence explains the implementation structure; it is not a fabricated historical sprint diary. Tests in this project were not rerun as part of the cross-project audit unless an explicit current result is recorded.

## Contribution

Chrispine Mndala: project ownership and development work, as identified by the user’s project history and the reviewed repository or saved deliverable. The study explains the implementation at project level; it does not claim every dependency, template, design asset or line of code was authored from scratch.

## Collaboration and attribution

Frameworks, open-source components, starter templates, AI-assisted development and external providers retain their own authorship. A complete contributor-by-commit audit, team timesheet and client acceptance record were not provided. No client endorsement or paid engagement is inferred from a public website.

## Evidence, financial handling and savings

Evidence as of 18 November 2026: Source-reviewed prototype. Current deployment, safe credential boundary, provider execution and commercial adoption are not verified. No product screenshot is available from this audit.

Financial workflow: Provider requests may incur usage costs. No billed usage, design fee, sale, gross-margin result or cost saving was verified. A practical operating model needs per-request budgets, retry limits and attributable usage records.

Benefit mechanism: Potential savings are less repeated prompt writing and faster exploration of variations. Design quality, iteration time, provider spend and customer acceptance have no measured baseline.

Savings status: NOT MEASURED. The study has no verified before/after labour, error, conversion, hosting-spend or revenue dataset. Measure comparable transaction volumes and service quality before claiming a saving.

Measurement method: monthly net benefit = (baseline minutes − current minutes) × monthly transactions ÷ 60 × loaded hourly labour cost + verified avoided rework − incremental hosting, provider and support cost. Reduced staff time is capacity released unless payroll or another actual cash expense falls. Revenue uplift is separate and requires attributable collections and direct-cost evidence.

Project cost, development hours, collected fees, operating spend, gross profit and realized ROI: not supplied or not verified for public disclosure.

Screenshot gap: no eligible current product capture was obtained. The cover is a labelled source-based architecture diagram, not a simulated screenshot.

## Lessons

A shared service adapter centralizes prompt definitions and output contracts. Reusing a source image can improve brief continuity, but does not guarantee brand consistency or editable design layers. Generated raster outputs are not automatically layered Photoshop deliverables.

The broader lesson is to select the smallest maintainable system that protects the critical workflow. Source completeness, a READY hosting build, a successful human journey and measured business benefit are separate milestones. The historical reasons for every technology choice are not recoverable from source alone; rationales here are identified as engineering assessments.

## Next phase and open questions

Implement or verify a server-side credential boundary, authenticated usage quotas and cost logs; test error/retry limits; preserve source-file requirements; review output rights and measure human-approved iteration time.

Unanswered with current evidence: actual development duration and cost; client sign-off; current active users; completed business transactions; recurring fees collected; before/after savings; support workload; production recovery time and current end-to-end test results. Those questions require records, not invented answers.

## Source review

{
  "date": "2026-11-18",
  "status": "internally_verified",
  "disclosure": "approved_public",
  "scope": "Source-reviewed prototype. Current deployment, safe credential boundary, provider execution and commercial adoption are not verified. No product screenshot is available from this audit.",
  "sourceFiles": [
    {
      "path": "README.md",
      "blob_sha": "9ff240e71f530ebbe44eb6a76b3e034214546609",
      "url": "https://github.com/Chrispine-1210/BrandGenius/blob/main/README.md"
    },
    {
      "path": "package.json",
      "blob_sha": "3c7b1408b97cb6100e3438bcb94bea6580475935",
      "url": "https://github.com/Chrispine-1210/BrandGenius/blob/main/package.json"
    }
  ],
  "screenshotStatus": "missing; architecture cover only",
  "claim": "Source or saved implementation and available public surface reviewed on 18 Nov 2026. Scope: Source-reviewed prototype. Current deployment, safe credential boundary, provider execution and commercial adoption are not verified. No product screenshot is available from this audit."
}
