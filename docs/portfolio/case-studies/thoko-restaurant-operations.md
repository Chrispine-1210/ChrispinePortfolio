# Thoko Restaurant — Customer experience & operations

A family restaurant website, menu and ordering interface supported by staff, receipt and accounting workflows. The public menu is available; checkout was visibly paused during capture.

## Problem

A restaurant needs one clear account of what can be ordered, how the order is fulfilled, who takes responsibility and which payment has actually cleared. Attractive food imagery alone cannot resolve queue coordination or cash reconciliation.

## Objectives

Present a realistic local menu; support pickup and delivery requests; separate staff roles; prevent duplicate orders; reconcile receipts and refunds; maintain a balanced journal. Acceptance requires the restaurant to authorize ordering and demonstrate fulfilment and cash closeout.

## Malawi context

Malawi is the stated operating context for this project. The design case prioritizes phone access, clear local service workflows, accountable human handoffs and a modest operating footprint. These are design requirements and engineering judgments, not a claim that every user lacks connectivity or that measured national impact has occurred.

## Features and business procedures

### Components and features

Public menu, meal extras, pickup/delivery selection, story and team pages, journal, community/careers and staff portal. Source includes order status controls, staff permissions, payment recording, operational registers, journals, postings and audit events.

### Why these technologies?

A shared component system keeps menu, basket and customer information consistent. Relational receipts and postings make reconciliation inspectable. Integer kwacha values avoid binary floating-point currency calculations. Static public delivery keeps the menu accessible while order-taking is controlled.

### Business procedure and financial handling

The source distinguishes orders from cleared receipts and refunds, and journals from their debit/credit postings. Financial controls are implemented in code, but no live transaction, balance sheet, tax calculation or payment-provider settlement is certified here.

## Architecture, data and algorithms

![Component architecture diagram; conceptual source model](https://raw.githubusercontent.com/Chrispine-1210/ChrispinePortfolio/agent/project-casebooks-20261118/client/public/project-evidence/2026-11-18/thoko-restaurant-operations-architecture.svg)

Public pages and React ordering components → server dispatch functions → D1/SQLite tables through Drizzle. Orders hold subtotal, delivery fee, status, user, request key and fingerprint. Receipts reference orders; postings reference journals; staff records determine roles.

### Algorithms and decision rules

Order request keys and fingerprints reject conflicting retry payloads. Delivery confirmation requires an accepted delivery quote. Delivery completion requires the appropriate preceding status; order completion requires verified receipts equal to subtotal plus fee. Refunds subtract from paid balance, and duplicate payment references are constrained. Ledger writes check balance before posting.

Why this structure: the component boundaries keep user interaction, business decisions and persistent records distinct where the implementation has those layers. A diagram is not proof that every dependency is connected or operational.

Data categories: domain records and identity/communication data where described above. Public case studies contain no live customer, patient, employee, payment or private-account records. Retention periods, export/deletion handling and recovery objectives need project-specific operating approval; no blanket compliance certification is made.

## Communications

Public phone and directions support human order coordination. Delivery fee acceptance must be recorded in an approval note. The captured ordering page displayed “Online ordering is paused. Call to order.” Vercel menu navigation redirected to the published Sites ordering page; this hosting split is documented rather than treated as one verified backend.

## Security

Verified scope is limited to the controls explicitly described in the source review above. An identity library, permission screen, audit table or secure-sounding landing page does not establish effective authorization in production. Production review must test ownership and role boundaries, session handling, validation, secrets, audit, backup restoration and error behaviour. No private dashboard screenshots or personal/payment records are disclosed.

## Development process

Development reconstruction from inspected source and project records; dates and durations for individual phases are not fully available.

1. Frame the operational problem and acceptance criteria.
2. Build the entities and public/role-specific interfaces described above.
3. Connect validation, state transitions and integrations represented in source.
4. Reconcile deployment, data durability, access and operational evidence.
5. This audit: review source/provider records and capture eligible public screens on 18 November 2026.

Project-specific challenge: The main delivery challenge is connecting public presentation, identity, operational storage and staff authorization across the hosted surfaces. A good-looking deployed homepage does not prove checkout or ledger persistence. The paused state correctly prevents the portfolio from claiming live online order-taking.

This sequence explains the implementation structure; it is not a fabricated historical sprint diary. Tests in this project were not rerun as part of the cross-project audit unless an explicit current result is recorded.

## Contribution

Chrispine Mndala: project ownership and development work, as identified by the user’s project history and the reviewed repository or saved deliverable. The study explains the implementation at project level; it does not claim every dependency, template, design asset or line of code was authored from scratch.

## Collaboration and attribution

Frameworks, open-source components, starter templates, AI-assisted development and external providers retain their own authorship. A complete contributor-by-commit audit, team timesheet and client acceptance record were not provided. No client endorsement or paid engagement is inferred from a public website.

## Evidence, financial handling and savings

Evidence as of 18 November 2026: Public website and menu observed on 18 November 2026. Online checkout paused. Source controls reviewed; staff operations, financial closeout and paid orders were not exercised.

Financial workflow: The source distinguishes orders from cleared receipts and refunds, and journals from their debit/credit postings. Financial controls are implemented in code, but no live transaction, balance sheet, tax calculation or payment-provider settlement is certified here.

Benefit mechanism: Potential reductions: menu enquiries, repeated order entry, unmatched receipt references and reconciliation effort. No measured order volumes, labour savings, margin improvement or customer conversion is available.

Savings status: NOT MEASURED. The study has no verified before/after labour, error, conversion, hosting-spend or revenue dataset. Measure comparable transaction volumes and service quality before claiming a saving.

Measurement method: monthly net benefit = (baseline minutes − current minutes) × monthly transactions ÷ 60 × loaded hourly labour cost + verified avoided rework − incremental hosting, provider and support cost. Reduced staff time is capacity released unless payroll or another actual cash expense falls. Revenue uplift is separate and requires attributable collections and direct-cost evidence.

Project cost, development hours, collected fees, operating spend, gross profit and realized ROI: not supplied or not verified for public disclosure.

## Lessons

A shared component system keeps menu, basket and customer information consistent. Relational receipts and postings make reconciliation inspectable. Integer kwacha values avoid binary floating-point currency calculations. Static public delivery keeps the menu accessible while order-taking is controlled.

The broader lesson is to select the smallest maintainable system that protects the critical workflow. Source completeness, a READY hosting build, a successful human journey and measured business benefit are separate milestones. The historical reasons for every technology choice are not recoverable from source alone; rationales here are identified as engineering assessments.

## Next phase and open questions

Confirm operator readiness; authorize and test ordering with disposable records; exercise payment, refund and completion rejection paths; verify backups and daily cash closeout; capture approved staff screens without employee or customer data.

Unanswered with current evidence: actual development duration and cost; client sign-off; current active users; completed business transactions; recurring fees collected; before/after savings; support workload; production recovery time and current end-to-end test results. Those questions require records, not invented answers.

## Source review

{
  "date": "2026-11-18",
  "status": "internally_verified",
  "disclosure": "approved_public",
  "scope": "Public website and menu observed on 18 November 2026. Online checkout paused. Source controls reviewed; staff operations, financial closeout and paid orders were not exercised.",
  "sourceFiles": [
    {
      "path": "README.md",
      "blob_sha": "004db658e289ebd41753cb4bbc10e97af633788b",
      "url": "https://github.com/Chrispine-1210/CHL-INVESTMENTS/blob/main/README.md"
    },
    {
      "path": "package.json",
      "blob_sha": "170db67a0667359eae3ea4433a51b25760357b7c",
      "url": "https://github.com/Chrispine-1210/CHL-INVESTMENTS/blob/main/package.json"
    },
    {
      "path": "db/schema.ts",
      "blob_sha": "692a9a6ef87fbe3f98de795a7e4629a44aa167da",
      "url": "https://github.com/Chrispine-1210/CHL-INVESTMENTS/blob/main/db/schema.ts"
    }
  ],
  "screenshotStatus": "current public browser captures",
  "claim": "Source or saved implementation and available public surface reviewed on 18 Nov 2026. Scope: Public website and menu observed on 18 November 2026. Online checkout paused. Source controls reviewed; staff operations, financial closeout and paid orders were not exercised."
}
