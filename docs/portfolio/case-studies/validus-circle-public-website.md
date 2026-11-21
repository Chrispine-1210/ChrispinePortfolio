# Validus Circle — Evidence-conscious public website

A multipage nonprofit presentation website with programme stories, historical evidence notes and an editorial identity rooted in Malawi. This is a staging website, not proof of client adoption or fundraising results.

## Problem

A nonprofit needs to explain its work credibly without turning historical news reporting into current impact statistics or stock photography into evidence of real beneficiaries. Visitors also need clear routes to programmes, involvement and contact.

## Objectives

Create a coherent brand presentation; organize programmes and involvement routes; label illustrative images; distinguish reported historical milestones from current totals; preserve a sources-and-editorial-notes route.

## Malawi context

Malawi is the stated operating context for this project. The design case prioritizes phone access, clear local service workflows, accountable human handoffs and a modest operating footprint. These are design requirements and engineering judgments, not a claim that every user lacks connectivity or that measured national impact has occurred.

## Features and business procedures

### Components and features

Home, about, programmes, impact, involvement and contact navigation; responsive/mobile navigation; education, health, livelihood and talent themes; story cards; explicit illustrative-photo labels; historical reporting limitations and source links.

### Why these technologies?

A static multipage build suits a content-led brief without introducing unnecessary accounts or a database. Semantic HTML and accessible navigation support readability. A limited script surface reduces maintenance complexity, with the trade-off that editorial updates need a content workflow or code change.

### Business procedure and financial handling

No payment collection, donation processing, fundraising receipts or project fee collection was verified. The principal financial consideration is a maintainable communication asset with a small hosting footprint; its ongoing cost has not been measured.

## Architecture, data and algorithms

![Component architecture diagram; conceptual source model](https://raw.githubusercontent.com/Chrispine-1210/ChrispinePortfolio/agent/project-casebooks-20261118/client/public/project-evidence/2026-11-18/validus-circle-public-website-architecture.svg)

Static HTML pages, CSS design tokens, image assets and small browser scripts → Vercel static delivery. The reviewed HTML source includes semantic sections, navigation states, metadata and responsive CSS. No application database, donation ledger or beneficiary-management backend is evidenced.

### Algorithms and decision rules

The demonstrated logic is presentation and navigation, not machine learning or impact inference. Menu state and responsive breakpoints control access to content. Historical programme figures remain editorially qualified; they are not recomputed as current cumulative impact.

Why this structure: the component boundaries keep user interaction, business decisions and persistent records distinct where the implementation has those layers. A diagram is not proof that every dependency is connected or operational.

Data categories: domain records and identity/communication data where described above. Public case studies contain no live customer, patient, employee, payment or private-account records. Retention periods, export/deletion handling and recovery objectives need project-specific operating approval; no blanket compliance certification is made.

## Communications

Programme, involvement and contact routes organize public communication. The source and public screenshots preserve photo disclaimers and historical-source notes. Form delivery or a connected communications platform was not tested.

## Security

Verified scope is limited to the controls explicitly described in the source review above. An identity library, permission screen, audit table or secure-sounding landing page does not establish effective authorization in production. Production review must test ownership and role boundaries, session handling, validation, secrets, audit, backup restoration and error behaviour. No private dashboard screenshots or personal/payment records are disclosed.

## Development process

Development reconstruction from inspected source and project records; dates and durations for individual phases are not fully available.

1. Frame the operational problem and acceptance criteria.
2. Build the entities and public/role-specific interfaces described above.
3. Connect validation, state transitions and integrations represented in source.
4. Reconcile deployment, data durability, access and operational evidence.
5. This audit: review source/provider records and capture eligible public screens on 18 November 2026.

Project-specific challenge: The central challenge was evidence-sensitive presentation: real programme communication without invented testimonials, current impact totals or purported project photos. The saved HTML and observed staging page support the presentation scope; commissioning and client sign-off are not established.

This sequence explains the implementation structure; it is not a fabricated historical sprint diary. Tests in this project were not rerun as part of the cross-project audit unless an explicit current result is recorded.

## Contribution

Chrispine Mndala: project ownership and development work, as identified by the user’s project history and the reviewed repository or saved deliverable. The study explains the implementation at project level; it does not claim every dependency, template, design asset or line of code was authored from scratch.

## Collaboration and attribution

Frameworks, open-source components, starter templates, AI-assisted development and external providers retain their own authorship. A complete contributor-by-commit audit, team timesheet and client acceptance record were not provided. No client endorsement or paid engagement is inferred from a public website.

## Evidence, financial handling and savings

Evidence as of 18 November 2026: Staging public page and navigation observed. Saved HTML inspected. No client adoption, donations, beneficiary outcomes or production acceptance is claimed.

Financial workflow: No payment collection, donation processing, fundraising receipts or project fee collection was verified. The principal financial consideration is a maintainable communication asset with a small hosting footprint; its ongoing cost has not been measured.

Benefit mechanism: A coherent content structure can reduce repeated explanatory work and improve programme discovery. No measured enquiry conversion, fundraising uplift, design-hours saving or hosting-cost comparison is available.

Savings status: NOT MEASURED. The study has no verified before/after labour, error, conversion, hosting-spend or revenue dataset. Measure comparable transaction volumes and service quality before claiming a saving.

Measurement method: monthly net benefit = (baseline minutes − current minutes) × monthly transactions ÷ 60 × loaded hourly labour cost + verified avoided rework − incremental hosting, provider and support cost. Reduced staff time is capacity released unless payroll or another actual cash expense falls. Revenue uplift is separate and requires attributable collections and direct-cost evidence.

Project cost, development hours, collected fees, operating spend, gross profit and realized ROI: not supplied or not verified for public disclosure.

## Lessons

A static multipage build suits a content-led brief without introducing unnecessary accounts or a database. Semantic HTML and accessible navigation support readability. A limited script surface reduces maintenance complexity, with the trade-off that editorial updates need a content workflow or code change.

The broader lesson is to select the smallest maintainable system that protects the critical workflow. Source completeness, a READY hosting build, a successful human journey and measured business benefit are separate milestones. The historical reasons for every technology choice are not recoverable from source alone; rationales here are identified as engineering assessments.

## Next phase and open questions

Secure organizational content approval and image rights, verify contact handling, document an editorial owner, test mobile navigation and establish a measurable enquiry/conversion baseline.

Unanswered with current evidence: actual development duration and cost; client sign-off; current active users; completed business transactions; recurring fees collected; before/after savings; support workload; production recovery time and current end-to-end test results. Those questions require records, not invented answers.

## Source review

{
  "date": "2026-11-18",
  "status": "internally_verified",
  "disclosure": "approved_public",
  "scope": "Staging public page and navigation observed. Saved HTML inspected. No client adoption, donations, beneficiary outcomes or production acceptance is claimed.",
  "sourceFiles": [
    {
      "path": "saved Validus HTML and public staging interface",
      "url": "https://validus-circle-staging.vercel.app/"
    }
  ],
  "screenshotStatus": "current public browser captures",
  "claim": "Source or saved implementation and available public surface reviewed on 18 Nov 2026. Scope: Staging public page and navigation observed. Saved HTML inspected. No client adoption, donations, beneficiary outcomes or production acceptance is claimed."
}
