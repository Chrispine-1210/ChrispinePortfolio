# Verification record — 18 November 2026

Source: additive engineering-workspace implementation on parent `31e415f1f7547de1ffb42a3cf19501d1ce3701b3`. Check the PR's exact current head before applying this record to a release. No production certification is granted by this document.

| Check | Result | Evidence and boundary |
| --- | --- | --- |
| TypeScript | PASS | `npm run check`; verification/typecheck.log |
| Full integration suite | PASS: 86 tests, 8 files | `npm test`; verification/tests.log. Includes the prior suite and 12 engineering-workspace tests |
| Production bundle | PASS | `npm run build`; verification/build.log |
| Diff whitespace | PASS | `git diff --check` |
| Migration replay | PASS in isolated PGlite | Full migration chain plus repeat execution of 0011; no duplicate engineering permissions |
| Native Neon schema | PASS on review branch only | Project twilight-meadow-16888716, review branch br-steep-dew-bboxeusj, neondb: 4 engineering tables, 3 permissions, 4 immutable-history/identity triggers |
| Production schema | NOT APPLIED | Main branch br-misty-wave-bb79bj7l remains outside this migration execution |
| Browser UI | PASS for selected flows | Actual application routes, isolated in-memory PGlite, dedicated synthetic account/session fixture outside the repository; not production login certification |
| Dependency audit | FAIL / release blocker | Unchanged dependency chain: full baseline audit 13 high, 6 moderate; previous production-classified audit 10 high. Inspected picomatch registry latest 4.0.7 remains within the advisory. No forced fix or bypass |
| Production preview/deployment | NOT CERTIFIED | Source build and isolated UI do not prove a deployed exact-source Vercel runtime |
| Physical/network/cloud telemetry | NOT CONNECTED | No collector, traffic feed, firewall actuator, AI provider, calendar synchronization or automatic messaging connected by this slice |

## API and domain cases executed

- Require a database-authenticated principal and permissions. A read-only role cannot mutate. Reject missing/foreign write origins.
- Isolate owners and contexts. Another administrator receives 404 for private detail/history/write access.
- Replay successful request keys without duplicate effects; reject changed payloads and stale revision leases.
- Preserve revision history and immutable publication snapshots; deny raw history changes/deletes and record identity changes.
- Require explicit disclosure review, a reviewed eligible record, supported media, and a separate allowlisted public snapshot. Later private edits do not mutate it. Withdrawal removes it from public API serving.
- Validate task dependencies, context, prerequisite completion, cycles and safe reopening order for completed dependents.
- Prevent more than 24 hours of actual work-log minutes per owner/day across contexts.
- Deny security observations for unauthorized assets or another owner's assets. Reject invented connected-telemetry states.
- Enforce the shared database-backed mutation rate limit and safe Retry-After/correlation responses.
- Keep raw driver failures, malformed input and oversized-body content out of API errors; reject credential-shaped input and unreviewed completed AI records.
- Canonicalize supported video/social URLs and reject lookalike hosts, embedded credentials, scripts and insecure URLs.

## Browser flows observed

1. Public journal landing: editorial layout, actual NetOps capture in its container, discipline filters, honest empty state, Aöthothe and SUDERN case-study bridge links.
2. Anonymous `/admin/workspace` redirects to the existing sign-in screen. Private UI checks then used a dedicated synthetic session fixture; no user credentials were requested or entered and no canonical authentication check was disabled.
3. Save a `[QA]` diary entry, revise it, and inspect both revisions in the history sheet.
4. Review an independent public copy, publish it, and read the rendered note with its evidence/limitations section. No private summary was exposed in that edited public copy.
5. Create a synthetic 35-minute work-log entry, read it back, verify the daily summary reflects it, and trigger the JSON page export download. This is test data, not actual founder effort or measured savings.
6. Create a presentation outline; open rehearsal, advance sections, show/hide notes and close with Escape.
7. Inspect the private connections map: owner-restricted links and five explicit "Not connected" integration states.
8. Withdraw the synthetic public note, observe it disappear from the private active-publications list and confirm the public journal returns to its empty state. API tests separately assert the withdrawn detail returns 404.

Browser captures are in verification/ with checksums and provenance in screenshots.json. They show the isolated review environment. Test records were not imported to production. Password sign-in, MFA, a live Neon-backed browser transaction, external video playback, third-party posting/calendar delivery, hardware monitoring and a narrow-device browser run were not certified here.

A client-side navigation briefly referenced a stale chunk while an independent local build replaced assets. Reloading the current build resolved the preview condition. No claim is made about a production rolling-deployment asset-retention policy.

## Remaining release evidence

Resolve the dependency audit, reconcile the stacked PR, verify restore and least-privilege runtime access, apply an authorized production migration, deploy the exact reviewed commit and exercise authenticated flows on that deployment. Provider service health and production infrastructure controls require current provider evidence, not this test record.
