# NetOps Command — Troubleshooting practice workspace

A deployed local-first network troubleshooting workspace connecting incidents, command evidence, runbooks, weak-area review and progressive practice. Training scores are heuristics, not professional certification.

## Problem

Reading a troubleshooting answer is different from proving which network layer failed. Without a repeatable record of hypotheses, commands, mistakes and retesting, practice can reinforce guesswork rather than operational competence.

## Objectives

Record a falsifiable diagnosis before changes; preserve command-level evidence and the fix; review mistakes; prioritize weak skills; increase difficulty only when evidence quality is stable. Start from TCP/IP, routing, DNS and Packet Tracer practice.

## Malawi context

Designed around Chrispine’s TCP/IP, routing, DNS and Cisco Packet Tracer background and the practical needs of IT support work in Malawi. A static personal workspace keeps server cost low. Local browser storage is convenient for individual use but is not a managed backup or team training system.

## Features and business procedures

### Components and features

Command centre, active incident, lab workspace, editable challenge library, runbooks, skills matrix, weekly review, evidence history and data/settings. Incident screens include diagnostic answers, required evidence, a hands-on exercise and an optional step-by-step solution.

### Why these technologies?

A static local-first design keeps personal practice usable without a hosted database or login. JSON export supports portability. The trade-offs are single-browser persistence, user-managed backups and lack of shared instructor authority.

### Business procedure and financial handling

No paid subscription, employer contract or training revenue is implemented in the inspected static workspace. It can avoid an always-on server for personal practice, but device loss and manual backup create their own operational costs.

## Architecture, data and algorithms

![Component architecture diagram; conceptual source model](https://raw.githubusercontent.com/Chrispine-1210/ChrispinePortfolio/agent/project-casebooks-20261118/client/public/project-evidence/2026-11-18/network-operations-training-architecture.svg)

One static HTML/CSS/JavaScript application → browser local storage → user-controlled JSON import/export. Challenge records hold domains, difficulty, questions, solutions, lab evidence and result/self-assessment fields. There is no remote multi-user account or central training database.

### Algorithms and decision rules

The source computes readiness from 0.32×confidence + 0.38×diagnostic quality + 6×average difficulty + min(18,2.5×completed incidents) − 4×average mistake count, clamped to 0–100. An empty workspace starts at 18. Weakness ranking combines confidence/quality gaps, repeat mistakes and low exposure. These are authored training heuristics; the starting score is not measured skill.

Why this structure: the component boundaries keep user interaction, business decisions and persistent records distinct where the implementation has those layers. A diagram is not proof that every dependency is connected or operational.

Data categories: domain records and identity/communication data where described above. Public case studies contain no live customer, patient, employee, payment or private-account records. Retention periods, export/deletion handling and recovery objectives need project-specific operating approval; no blanket compliance certification is made.

## Communications

The workspace communicates practice priorities internally and offers exportable evidence. No email reminders or central instructor delivery are built into this static application. A separately scheduled challenge is not automatically synchronized to local records.

## Security

Verified scope is limited to the controls explicitly described in the source review above. An identity library, permission screen, audit table or secure-sounding landing page does not establish effective authorization in production. Production review must test ownership and role boundaries, session handling, validation, secrets, audit, backup restoration and error behaviour. No private dashboard screenshots or personal/payment records are disclosed.

## Development process

Development reconstruction from inspected source and project records; dates and durations for individual phases are not fully available.

1. Frame the operational problem and acceptance criteria.
2. Build the entities and public/role-specific interfaces described above.
3. Connect validation, state transitions and integrations represented in source.
4. Reconcile deployment, data durability, access and operational evidence.
5. This audit: review source/provider records and capture eligible public screens on 18 November 2026.

Project-specific challenge: The source distinguishes exposure from proficiency and prevents difficulty increases based on confidence alone. The public capture showed zero completed incidents, default readiness 18 and a DNS/VLAN scenario. Those values are initial workspace state, not verified learning outcomes.

This sequence explains the implementation structure; it is not a fabricated historical sprint diary. Tests in this project were not rerun as part of the cross-project audit unless an explicit current result is recorded.

## Contribution

Chrispine Mndala: project ownership and development work, as identified by the user’s project history and the reviewed repository or saved deliverable. The study explains the implementation at project level; it does not claim every dependency, template, design asset or line of code was authored from scratch.

## Collaboration and attribution

Frameworks, open-source components, starter templates, AI-assisted development and external providers retain their own authorship. A complete contributor-by-commit audit, team timesheet and client acceptance record were not provided. No client endorsement or paid engagement is inferred from a public website.

## Evidence, financial handling and savings

Evidence as of 18 November 2026: Deployed workspace and active DNS incident observed. Static implementation inspected. No learner improvement, employer validation or network-lab execution result is claimed.

Financial workflow: No paid subscription, employer contract or training revenue is implemented in the inspected static workspace. It can avoid an always-on server for personal practice, but device loss and manual backup create their own operational costs.

Benefit mechanism: Potential savings are less fragmented note-taking and more targeted practice. No measured reduction in incident resolution time, assessment failures or training expenditure has been supplied.

Savings status: NOT MEASURED. The study has no verified before/after labour, error, conversion, hosting-spend or revenue dataset. Measure comparable transaction volumes and service quality before claiming a saving.

Measurement method: monthly net benefit = (baseline minutes − current minutes) × monthly transactions ÷ 60 × loaded hourly labour cost + verified avoided rework − incremental hosting, provider and support cost. Reduced staff time is capacity released unless payroll or another actual cash expense falls. Revenue uplift is separate and requires attributable collections and direct-cost evidence.

Project cost, development hours, collected fees, operating spend, gross profit and realized ROI: not supplied or not verified for public disclosure.

## Lessons

A static local-first design keeps personal practice usable without a hosted database or login. JSON export supports portability. The trade-offs are single-browser persistence, user-managed backups and lack of shared instructor authority.

The broader lesson is to select the smallest maintainable system that protects the critical workflow. Source completeness, a READY hosting build, a successful human journey and measured business benefit are separate milestones. The historical reasons for every technology choice are not recoverable from source alone; rationales here are identified as engineering assessments.

## Next phase and open questions

Complete real Packet Tracer exercises with exported command evidence, validate rubric weights against instructor review, test import/export recovery and record progression over several weeks.

Unanswered with current evidence: actual development duration and cost; client sign-off; current active users; completed business transactions; recurring fees collected; before/after savings; support workload; production recovery time and current end-to-end test results. Those questions require records, not invented answers.

## Source review

{
  "date": "2026-11-18",
  "status": "internally_verified",
  "disclosure": "approved_public",
  "scope": "Deployed workspace and active DNS incident observed. Static implementation inspected. No learner improvement, employer validation or network-lab execution result is claimed.",
  "sourceFiles": [
    {
      "path": "shared/schema.ts"
    },
    {
      "path": "server/portfolio/policy.ts"
    },
    {
      "path": "server/portfolio/public-case-study-service.ts"
    },
    {
      "path": "network-ops-training-platform/index.html"
    }
  ],
  "screenshotStatus": "current public browser captures",
  "claim": "Source or saved implementation and available public surface reviewed on 18 Nov 2026. Scope: Deployed workspace and active DNS incident observed. Static implementation inspected. No learner improvement, employer validation or network-lab execution result is claimed."
}
