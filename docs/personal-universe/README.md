# One personal universe — 18 November 2026

The owner requested one coherent interface across the portfolio and its operating workspace: a design that expresses his journey, pride and connected interests. The home page now connects the operational background recorded in the public CV with software, networks, hardware and business systems. No family hardship, client endorsement, revenue, savings or professional certification was invented for the story.

## Shared visual system

| Element | Public surfaces | Private workspace |
| --- | --- | --- |
| Canvas | Warm paper `#f6f4ef` | Deep forest `#0e1713` |
| Navigation | Solid forest `#142b24` | Forest sidebar and controls |
| Type | Ink `#1e302c`, readable body `#53635e` | Warm foreground, stronger secondary text |
| Accents | Forest, clay and restrained gold | Gold action accents; functional status colours retained |
| Images | Contained interface captures and deliberate portrait crops | Existing evidence and record visibility preserved |
| Controls | Shared tokens, labelled fields, focus states, responsive navigation | Same family of tokens with authenticated management density |

Core contrast checks on declared colours: ink/paper 12.62:1; body/paper 5.76:1; gold/forest 8.15:1; white/forest 14.99:1. These are colour-pair checks, not a claim of a complete accessibility audit.

The global theme is imported after the base stylesheet. Public surfaces consume semantic light tokens; private surfaces consume forest tokens. Existing public components were moved from fixed dark backgrounds and white text to semantic colours. Class-template whitespace was checked against the base source so conditional class fragments remain separate. Reduced-motion settings are respected. Navigation has a labelled mobile trigger and dialog title.

## Coverage and honest states

- Home, Work, Writing, About, journal, article/case-study readers, service pages, contact, membership, resources, source hub and login use the shared public identity.
- The management shell, tables, form panels, analytics and external references share the private identity. Roles, permissions, handlers, financial calculations and backend controls were not changed.
- `/projects` uses the canonical Work component. Public and private visibility remain separate.
- Resources now links to the actual CV, casebooks, journal and writing instead of unavailable download listings.
- The source hub uses repository references from the approved public project records. Static contribution graphics and the unsupported LIVE badge were removed.
- Membership copy explains unavailable payment configuration. The configured payment flow remains unchanged; no production payment was attempted.
- Analytics uses an em dash for absent totals, an explicit load-error state, and a scope note that application observations do not establish device/network/cloud-wide monitoring.
- Contact retains its existing validation/submission path, with an embedded layout to avoid a duplicated heading. Login retains its authentication path and adds associated labels and autocomplete metadata.

## Verification boundary

`npm run verify:release` PASS: TypeScript, 98 tests / 10 files, frontend and server build, production import graph, zero production dependency vulnerabilities, and the existing owner-approved development-only audit policy. No manifest, lockfile, migration, API, workflow or audit-policy changes. The current build-only advisory acceptance still expires 25 November 2026 at 02:00 Africa/Blantyre.

Source verification is recorded in `release-verification.log`. Final live rendering, navigation, filters and protected-route checks must be recorded against the deployed commit. Production financial journeys and authenticated private-screen interaction are not certified by a stylesheet or a public screenshot. Automated network blocking, AI providers and external telemetry are not connected by this release.
