# BookingPro — Scheduling & professional workspace

A source-reviewed appointment and professional-assistant application with providers, services, time slots, appointments, tasks and memos. Live booking integrity remains unverified.

## Problem

Independent professionals need a consistent relationship between service availability, appointments and client follow-up. A calendar screen alone cannot prevent conflicting reservations or prove a booking was accepted.

## Objectives

Make providers/services discoverable; model availability and appointments; preserve client confirmation and history; combine professional tasks and memos; prove concurrent booking control and identity ownership before activation.

## Malawi context

Malawi is the stated operating context for this project. The design case prioritizes phone access, clear local service workflows, accountable human handoffs and a modest operating footprint. These are design requirements and engineering judgments, not a claim that every user lacks connectivity or that measured national impact has occurred.

## Features and business procedures

### Components and features

Provider search, booking form, bookings, provider settings, confirmation, reviews, notifications, messages, calendar, personal memos/tasks, profile management and PWA assets are represented in source and repository documentation.

### Why these technologies?

Relational provider-service-slot-appointment data offers a clearer booking record than disconnected notes. Reusable forms and PWA delivery can reduce the initial need for separate mobile applications. Concurrency correctness must be enforced server-side.

### Business procedure and financial handling

No active service-fee checkout, commission settlement or booking revenue was verified. A booking or displayed price is not a cleared payment. Cancellation/refund economics need a documented business policy.

## Architecture, data and algorithms

![Component architecture diagram; conceptual source model](https://raw.githubusercontent.com/Chrispine-1210/ChrispinePortfolio/agent/project-casebooks-20261118/client/public/project-evidence/2026-11-18/bookingpro-appointment-platform-architecture.svg)

React client → Express application → PostgreSQL/Drizzle entities for providers, services, time slots, appointments, reviews, analytics, memos, tasks, sessions and users.

### Algorithms and decision rules

The relational time-slot and appointment model can support availability checks, but no current concurrent double-booking exclusion test was run. Search/filter and confirmation views are implemented; no optimization or scheduling-AI algorithm is asserted.

Why this structure: the component boundaries keep user interaction, business decisions and persistent records distinct where the implementation has those layers. A diagram is not proof that every dependency is connected or operational.

Data categories: domain records and identity/communication data where described above. Public case studies contain no live customer, patient, employee, payment or private-account records. Retention periods, export/deletion handling and recovery objectives need project-specific operating approval; no blanket compliance certification is made.

## Communications

Messages, notifications and confirmation interfaces represent client coordination. Delivery to email/SMS and professional response times were not tested.

## Security

Verified scope is limited to the controls explicitly described in the source review above. An identity library, permission screen, audit table or secure-sounding landing page does not establish effective authorization in production. Production review must test ownership and role boundaries, session handling, validation, secrets, audit, backup restoration and error behaviour. No private dashboard screenshots or personal/payment records are disclosed.

## Development process

Development reconstruction from inspected source and project records; dates and durations for individual phases are not fully available.

1. Frame the operational problem and acceptance criteria.
2. Build the entities and public/role-specific interfaces described above.
3. Connect validation, state transitions and integrations represented in source.
4. Reconcile deployment, data durability, access and operational evidence.
5. This audit: review source/provider records and capture eligible public screens on 18 November 2026.

Project-specific challenge: The README describes completed pages and historical build results, but they are not fresh certification. No matching live deployment was verified in the audited provider list, and appointment conflict handling remains a key test requirement.

This sequence explains the implementation structure; it is not a fabricated historical sprint diary. Tests in this project were not rerun as part of the cross-project audit unless an explicit current result is recorded.

## Contribution

Chrispine Mndala: project ownership and development work, as identified by the user’s project history and the reviewed repository or saved deliverable. The study explains the implementation at project level; it does not claim every dependency, template, design asset or line of code was authored from scratch.

## Collaboration and attribution

Frameworks, open-source components, starter templates, AI-assisted development and external providers retain their own authorship. A complete contributor-by-commit audit, team timesheet and client acceptance record were not provided. No client endorsement or paid engagement is inferred from a public website.

## Evidence, financial handling and savings

Evidence as of 18 November 2026: Source and data model reviewed. No live booking, actual customer, payment or screenshot is certified.

Financial workflow: No active service-fee checkout, commission settlement or booking revenue was verified. A booking or displayed price is not a cleared payment. Cancellation/refund economics need a documented business policy.

Benefit mechanism: Potential savings are fewer scheduling calls, repeated profile entry and fragmented professional notes. No no-show reduction, utilization increase or paid-booking metric was measured.

Savings status: NOT MEASURED. The study has no verified before/after labour, error, conversion, hosting-spend or revenue dataset. Measure comparable transaction volumes and service quality before claiming a saving.

Measurement method: monthly net benefit = (baseline minutes − current minutes) × monthly transactions ÷ 60 × loaded hourly labour cost + verified avoided rework − incremental hosting, provider and support cost. Reduced staff time is capacity released unless payroll or another actual cash expense falls. Revenue uplift is separate and requires attributable collections and direct-cost evidence.

Project cost, development hours, collected fees, operating spend, gross profit and realized ROI: not supplied or not verified for public disclosure.

Screenshot gap: no eligible current product capture was obtained. The cover is a labelled source-based architecture diagram, not a simulated screenshot.

## Lessons

Relational provider-service-slot-appointment data offers a clearer booking record than disconnected notes. Reusable forms and PWA delivery can reduce the initial need for separate mobile applications. Concurrency correctness must be enforced server-side.

The broader lesson is to select the smallest maintainable system that protects the critical workflow. Source completeness, a READY hosting build, a successful human journey and measured business benefit are separate milestones. The historical reasons for every technology choice are not recoverable from source alone; rationales here are identified as engineering assessments.

## Next phase and open questions

Deploy an isolated preview, verify identity ownership and concurrent slot acceptance/rejection, test timezone/cancellation behaviour, connect confirmed communications and capture non-personal booking screens.

Unanswered with current evidence: actual development duration and cost; client sign-off; current active users; completed business transactions; recurring fees collected; before/after savings; support workload; production recovery time and current end-to-end test results. Those questions require records, not invented answers.

## Source review

{
  "date": "2026-11-18",
  "status": "internally_verified",
  "disclosure": "approved_public",
  "scope": "Source and data model reviewed. No live booking, actual customer, payment or screenshot is certified.",
  "sourceFiles": [
    {
      "path": "README.md",
      "blob_sha": "7fc3545a8da6bb991c1e18ed3dee5ff5d7f6d814",
      "url": "https://github.com/Chrispine-1210/Appointments-Booker/blob/main/README.md"
    },
    {
      "path": "package.json",
      "blob_sha": "984f31451b2f80693d405656a938fe2208a5d39b",
      "url": "https://github.com/Chrispine-1210/Appointments-Booker/blob/main/package.json"
    },
    {
      "path": "shared/schema.ts",
      "blob_sha": "77b2eac0dbeedb1409d1de13a018e009cf700187",
      "url": "https://github.com/Chrispine-1210/Appointments-Booker/blob/main/shared/schema.ts"
    }
  ],
  "screenshotStatus": "missing; architecture cover only",
  "claim": "Source or saved implementation and available public surface reviewed on 18 Nov 2026. Scope: Source and data model reviewed. No live booking, actual customer, payment or screenshot is certified."
}
