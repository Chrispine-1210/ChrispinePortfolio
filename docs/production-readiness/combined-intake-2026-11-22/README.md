# Combined API reliability and commercial intake verification

Evidence date: 22 November 2026, Africa/Blantyre. This record separates local source verification from hosted deployment evidence.

## Source and behavior

The commercial-intake branch combines PR #36's `18d4877fe986426c33a253eacbc6510d146ae766` with PR #35's latest `fb884f9abacd95b8d05bc3c0c216e861ea5014dd`, without rewriting either history. It retains the atomic contact/lead/activity/notification acceptance and the method-aware handling of uncertain writes. Contact and consultation failure regressions assert `WRITE_OUTCOME_UNKNOWN` without `Retry-After`, while confirming that injected downstream failures leave no partial intake.

The contact failure heading is now “Request not confirmed”, consistent with a lost response. Its fallback also avoids an instruction to resubmit. No visual layout, business data, migration, dependency lockfile, workflow or provider configuration changes are included.

## Local verification

`npm ci --no-fund --no-audit`, followed by `npm run verify:release`, passed under Node 24. The release command passed TypeScript, certification syntax, **157 tests in 15 files**, frontend/server builds, production import checks and dependency audits. Production dependency findings: **zero**. Full tree: **six moderate, zero high/critical**, with no exception applied. Full output: `verification.log`.

The tests use isolated PGlite databases and synthetic `.invalid` recipients. No external provider message or production financial fixture was created. The synthetic QA launcher built and reported its loopback URL, but the cloud browser returned `ERR_CONNECTION_REFUSED`; local visual or interaction acceptance is not claimed.

## Hosted evidence observed before publishing this reconciliation

| Deployment | Source | Observed result |
| --- | --- | --- |
| `dpl_9KCucK7yupRXB3d51tXTgwoHS8fo` | `fb884f9` / PR #35 | ERROR: `BUILD_FAILED`, “Resource provisioning failed”; zero build events returned |
| `dpl_HATgnTxmtceCQGEpgAHq9cUG91bd` | `18d4877` / PR #36 | ERROR: `BUILD_FAILED`, “Resource provisioning failed”; zero build events returned |
| `dpl_9MPPMGzM4wJ282bwpGoiMNBQMUzN` | `19e986b` / PR #35 | ERROR: “Resource provisioning failed” |
| `dpl_AAs6AEy2MuVsBwdQPji6QRKSTwZm` | `19e986b` / PR #35 | ERROR: “Resource provisioning failed” |
| `dpl_J3fUZxm3Sgnr7M1wmFCi4Xf2nBVu` | `e5a4b4bef7e19d262f2940d7d231ecbf4602aa92` / main | READY, assigned to the public production domain |

The production `/api/release` returned HTTP 200 with the same main SHA, environment `production`, and database branch `br-misty-wave-bb79bj7l`. It does not contain PR #35 or #36. The old PR #33 preview error remains historical and cannot certify or disqualify this new source.

GitHub Quality run `44981034457` failed in job `137081351002` with an empty steps list. CodeQL run `44981034466` likewise reported failed jobs without executable steps. Neither hosted assurance result is reported as passing. No workflow was manually rerun or modified.

The commercial branch has its existing branch-scoped `APP_DATABASE_URL` isolation override. Metadata was read without exposing or changing its secret value. Preview failure details do not identify a corrective application build change; disabling gates or changing the UI would not address the reported provisioning condition.

## Remaining acceptance

The reconciled exact head still requires a successful isolated Preview and runtime readback before production activation. Financial atomicity/idempotency, migration safeguards, privileged recovery, provider delivery, billing and final operating acceptance remain in the existing production completion backlog. This package makes no claim of full business readiness, collection of customer money, successful delivery, or production release.
