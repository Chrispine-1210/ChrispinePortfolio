# Fatima Agro — Digital operations demonstration

A farm-input catalogue and multi-role operating demonstration with procurement, stock, invoices, receipts, finance and communications. The public environment is explicitly labelled as sample data with no live payments.

## Problem

An agro-dealer needs traceability from a farmer’s request to stock allocation, procurement, goods receipt, invoicing and settlement. Disconnected sales, depot and finance records make availability and outstanding balances difficult to reconcile.

## Objectives

Demonstrate a coherent customer-to-depot-to-finance workflow; separate role and unit permissions; make invoice, receipt and stock consequences inspectable; allow management review before any commercial activation.

## Malawi context

Malawi is the stated operating context for this project. The design case prioritizes phone access, clear local service workflows, accountable human handoffs and a modest operating footprint. These are design requirements and engineering judgments, not a claim that every user lacks connectivity or that measured national impact has occurred.

## Features and business procedures

### Components and features

Catalogue, cart, customer accounts, order requests, news and reviews; executive and role workspaces; procurement requests/orders and goods receipts; stock adjustments and transfers; supplier bills; invoices, payments, receipts, credit notes and journals; campaign capture and support requests.

### Why these technologies?

A coherent domain model makes the commercial demonstration reviewable before integrating a real bank or email provider. Explicit journal lines explain financial consequences. Role/unit scoping models depot responsibility without treating all staff as administrators.

### Business procedure and financial handling

Invoices create demonstration receivables and sales/tax journal lines; supplier bills create demonstration payables. Reports aggregate debit and credit balances. Sample cash, sample invoices and unverified tax treatment are not real collections or approved accounting policy. The proposal price and support fees are deliberately excluded from public financial-result claims.

## Architecture, data and algorithms

![Component architecture diagram; conceptual source model](https://raw.githubusercontent.com/Chrispine-1210/ChrispinePortfolio/agent/project-casebooks-20261118/client/public/project-evidence/2026-11-18/fatima-agro-digital-operations-architecture.svg)

React/Next-compatible application → server domain actions and permission checks → versioned PortalState storage adapter. State contains products, units, stock-by-unit, orders, invoices, suppliers, purchase records, journals, notifications and captured messages. The inspected public presentation does not establish production database durability.

### Algorithms and decision rules

Actions check unit scope and active-unit capabilities. Safe-integer ledger lines must balance before posting. Receipt documents reconcile invoice, payment and customer identifiers. Stock transfer and adjustment decisions use explicit states. Idempotency covers selected checkout, receipt, procurement and executive actions.

Why this structure: the component boundaries keep user interaction, business decisions and persistent records distinct where the implementation has those layers. A diagram is not proof that every dependency is connected or operational.

Data categories: domain records and identity/communication data where described above. Public case studies contain no live customer, patient, employee, payment or private-account records. Retention periods, export/deletion handling and recovery objectives need project-specific operating approval; no blanket compliance certification is made.

## Communications

Notifications and transactional/campaign messages are captured in the demonstration rather than sent. Marketing audience selection respects consent and unsubscribe state and de-duplicates addresses. The public page labels the environment “Presentation environment · Sample catalogue · No live payments.”

## Security

Verified scope is limited to the controls explicitly described in the source review above. An identity library, permission screen, audit table or secure-sounding landing page does not establish effective authorization in production. Production review must test ownership and role boundaries, session handling, validation, secrets, audit, backup restoration and error behaviour. No private dashboard screenshots or personal/payment records are disclosed.

## Development process

Development reconstruction from inspected source and project records; dates and durations for individual phases are not fully available.

1. Frame the operational problem and acceptance criteria.
2. Build the entities and public/role-specific interfaces described above.
3. Connect validation, state transitions and integrations represented in source.
4. Reconcile deployment, data durability, access and operational evidence.
5. This audit: review source/provider records and capture eligible public screens on 18 November 2026.

Project-specific challenge: The operations-demo alias returned 404 while the public Fatima alias loaded. Source rehearsal, public presentation, durable operational storage and approved client activation remain separate states. Authentication and live settlement were not exercised.

This sequence explains the implementation structure; it is not a fabricated historical sprint diary. Tests in this project were not rerun as part of the cross-project audit unless an explicit current result is recorded.

## Contribution

Chrispine Mndala: project ownership and development work, as identified by the user’s project history and the reviewed repository or saved deliverable. The study explains the implementation at project level; it does not claim every dependency, template, design asset or line of code was authored from scratch.

## Collaboration and attribution

Frameworks, open-source components, starter templates, AI-assisted development and external providers retain their own authorship. A complete contributor-by-commit audit, team timesheet and client acceptance record were not provided. No client endorsement or paid engagement is inferred from a public website.

## Evidence, financial handling and savings

Evidence as of 18 November 2026: Public presentation observed; no live payments stated by the interface. Domain implementation reviewed. Client acceptance, production durability, bank integration and revenue remain unverified.

Financial workflow: Invoices create demonstration receivables and sales/tax journal lines; supplier bills create demonstration payables. Reports aggregate debit and credit balances. Sample cash, sample invoices and unverified tax treatment are not real collections or approved accounting policy. The proposal price and support fees are deliberately excluded from public financial-result claims.

Benefit mechanism: Potential savings are fewer stock/balance reconciliations and fewer repeated sales, procurement and receipt entries. No measured deployment fee, collected support revenue, inventory-loss reduction or staff-time saving is asserted.

Savings status: NOT MEASURED. The study has no verified before/after labour, error, conversion, hosting-spend or revenue dataset. Measure comparable transaction volumes and service quality before claiming a saving.

Measurement method: monthly net benefit = (baseline minutes − current minutes) × monthly transactions ÷ 60 × loaded hourly labour cost + verified avoided rework − incremental hosting, provider and support cost. Reduced staff time is capacity released unless payroll or another actual cash expense falls. Revenue uplift is separate and requires attributable collections and direct-cost evidence.

Project cost, development hours, collected fees, operating spend, gross profit and realized ROI: not supplied or not verified for public disclosure.

## Lessons

A coherent domain model makes the commercial demonstration reviewable before integrating a real bank or email provider. Explicit journal lines explain financial consequences. Role/unit scoping models depot responsibility without treating all staff as administrators.

The broader lesson is to select the smallest maintainable system that protects the critical workflow. Source completeness, a READY hosting build, a successful human journey and measured business benefit are separate milestones. The historical reasons for every technology choice are not recoverable from source alone; rationales here are identified as engineering assessments.

## Next phase and open questions

Obtain client-approved operational scope and product data; verify durable storage and backups; run role/unit denial tests; reconcile a controlled end-to-end order; authorize each real payment and messaging integration separately.

Unanswered with current evidence: actual development duration and cost; client sign-off; current active users; completed business transactions; recurring fees collected; before/after savings; support workload; production recovery time and current end-to-end test results. Those questions require records, not invented answers.

## Source review

{
  "date": "2026-11-18",
  "status": "internally_verified",
  "disclosure": "approved_public",
  "scope": "Public presentation observed; no live payments stated by the interface. Domain implementation reviewed. Client acceptance, production durability, bank integration and revenue remain unverified.",
  "sourceFiles": [
    {
      "path": "README.md",
      "blob_sha": "6453ab4c45a6359087343c2c4df331fbde12ad7f",
      "url": "https://github.com/Chrispine-1210/fatima-agro-digital-operations-demo/blob/main/README.md"
    },
    {
      "path": "package.json",
      "blob_sha": "123cdd8a4b57b8eda77c0301efeb2285cbd75608",
      "url": "https://github.com/Chrispine-1210/fatima-agro-digital-operations-demo/blob/main/package.json"
    },
    {
      "path": "db/schema.ts",
      "blob_sha": "e4fb074bb14d28d2adb633e5ca7933ab1cfb4dd3",
      "url": "https://github.com/Chrispine-1210/fatima-agro-digital-operations-demo/blob/main/db/schema.ts"
    }
  ],
  "screenshotStatus": "current public browser captures",
  "claim": "Source or saved implementation and available public surface reviewed on 18 Nov 2026. Scope: Public presentation observed; no live payments stated by the interface. Domain implementation reviewed. Client acceptance, production durability, bank integration and revenue remain unverified."
}
