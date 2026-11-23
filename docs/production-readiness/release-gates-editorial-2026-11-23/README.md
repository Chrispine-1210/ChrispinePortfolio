# Local release-gate and editorial implementation

Date: 23 November 2026. Source baseline:
`d116fcfa9c44cf66c0cc3dbb619c367b22c94243`.
Local branch: `agent/release-gates-editorial-20261123`.
Full business release remains HOLD. No branch push, PR, deployment, hosted
publication, database restore, provider configuration, message, payment or
production write was performed.

## Implemented

- Replaced unsupported full-readiness claims, corrected production-pending and
  obsolete 0011-apply instructions, and linked the authoritative gate register.
- Added planning/Headway, network/Yuriy Vertikov and writing/Alexander Mass
  captions directly below the three homepage story photographs.
- Changed the shared software photograph to the existing neutral workspace
  photograph by Slava Keyzman. The previous code asset remains emitted and
  retains Bernd Dittrich attribution for existing saved cover URLs.
- Prepared a genuine note in `docs/editorial/drafts/` as human-readable source
  and a draft-creation payload. It is not automatically seeded or published.
- Added a loopback-only QA acceptance command using the existing isolated
  application fixture and its normal session/permission middleware.

## Fresh verification

`npm run verify:release`: PASS. Twenty-one test files and 284 tests passed;
one native-only suite/four checks were skipped. No native financial or database
role certification was repeated for these UI/documentation changes. TypeScript,
certification-script syntax, production build, runtime imports and audit policy
passed. Production audit: zero findings; full tree: six moderate, no high/critical,
no exceptions. See `verification.log`.

The isolated QA command passed 19 checks in `local-acceptance.json`. It used the
genuine draft through application APIs to prove anonymous denial, draft privacy,
rejected premature publication, review/approval/publication, public projection,
withdrawal and return to draft. The real rich-content parser/server renderer
preserved full-width centred placement, alt text, caption and linked credit.
New and legacy photograph credits both passed. The planning cover and inline
network asset were available in the compiled application.

The public test publication was withdrawn, restored to draft, and its entire
in-memory database discarded when the QA process stopped. No real account,
financial fixtures, provider credentials or production records were used.

## Verification boundary

Browser/layout acceptance remains UNVERIFIED. The executable was initially
missing; system Chromium could not start under the workspace's Unix-socket
restriction. The separate cloud browser could not reach the loopback server.
Neither condition is classified as a source defect or a passing visual check.
The retained evidence certifies API behaviour and rendered markup, not desktop/
mobile layout, real owner password sign-in or hosted Preview/production journeys.

`production-baseline.json` freshly rechecks the existing READY deployment/alias
at the unchanged main SHA. It does not claim that the local candidate is deployed.

## Recovery preflight

`restore-preflight.json` records account branch limit 10 and 10 retained branches,
an empty production snapshot schedule, six-hour history retention and the sole
listed 18 November snapshot. No free restore slot exists under the reported cap.
Existing backups were preserved. See `RESTORE_PLAN.md` for exact proposed backup
and dependent restore operations, isolation requirements and missing decisions.

Precision/distinct-key concurrency, recovery, delivery, billing sandbox, owner
acceptance and GitHub-hosted assurance remain open as recorded in the gate register.

## Reproduce locally

```sh
npm ci
npm run verify:release
npm run preview:engineering:qa
```

In a second terminal, while that disposable fixture runs:

```sh
node scripts/qa/editorial-draft-acceptance.mjs http://127.0.0.1:4173 /tmp/editorial-acceptance.json
```

When commands run in separate network namespaces, launch the QA server and
acceptance command inside the same local process environment. Stop the fixture
after acceptance. Do not substitute a production origin or database.
