# Portfolio evolution — 23 November 2026

Decision: LOCAL CANDIDATE COMPLETE; PRODUCTION ACTIVATION HOLD.
Branch: `agent/portfolio-evolution-20261123`.
Base: `5bc74fec4e6212aeafd39d7ffd9df87624b0545b`, the isolated commercial-hardening candidate. No branch push, remote workflow trigger, deployment, production schema/data change, real payment or real email was performed by this work.

## Product direction

One connected practice: a public professional portfolio that earns a qualified conversation, a clear account experience, and an operating workspace that distinguishes observed evidence from configuration and approval. Forest, paper and brass connect the public and private interfaces. Existing portrait, attributed editorial photography, published project evidence and personal history remain the factual basis; no clients, testimonials, revenue, uptime or adoption results were invented.

| Surface | Implemented change | Intended commercial or operating effect |
| --- | --- | --- |
| Public homepage | New portrait-led composition, selected casebooks, interactive four-area practice, operating story, delivery method and clear enquiry route | Explain the work and guide a visitor to relevant evidence and a project brief; conversion uplift is not yet measured |
| Navigation | Simplified desktop navigation, mobile navigation, searchable destination dialog, Ctrl/Command-K shortcut and route preloading | Reduce effort finding projects, services, research and account routes |
| Services and intake | Three defined engagement paths; selected service populates the existing governed consultation form; changing paths retains other entered fields; labelled controls | Collect a more useful problem statement and service context without pretending that an enquiry confirms a contract |
| Member account | Honest availability, signed-out state, sandbox membership management, public-reading routes and sign-out | Remove unsupported benefit promises and make account state understandable |
| Account recovery | Request/reset pages, expiring single-use tokens, verified-address requirement, encrypted recovery email body, Argon2id password update and session/link invalidation | Provide an implementable recovery path while keeping activation and delivery acceptance separate |
| Operating workspace | New `/admin/readiness` screen, runtime identity, uncertain/expired delivery queues and explicit external/owner gates | Give the operator a clear evidence view without treating configured providers as certified |
| Editorial studio | Required expected version, locked revision updates, stale-save/transition 409s and preserved/downloadable entered draft on error | Prevent an old browser form from silently overwriting a newer revision |
| Intake protection | Shared database limits with HMAC identifiers; private no-store before authentication | Bound repeated intake and recovery requests without a process-local-only limiter or plaintext network/email counter keys |
| Discovery and browser policy | Real robots.txt and a core public-route sitemap; proposed static-document security headers | Repair malformed crawler resources and bring the hosting document policy in line with API policy |
| Analytics | Explicit process-local coverage metadata and interface description | Avoid presenting one instance's last 1,000 observations as durable visitors or commercial conversion totals |
| NetOps training import | Complete bounded schema validation on imported and stored state, numeric ranges, domain allowlist, duplicate-ID/version rejection | Prevent imported strings/prototype keys from reaching numeric HTML/statistics handling |

These are implementation outcomes and intended benefits. New sales, collections, client adoption or conversion gains have not been demonstrated.

## Local verification

- `npm run verify:release`: PASS. TypeScript, certification-script syntax, production build, runtime imports and dependency policy passed.
- Ordinary automated suite: **314 passed, 8 native-only skipped** across 26 files (25 passed, 1 native-only skipped).
- Separate native PostgreSQL 19 run: **39 passed, no skips**; covers all eight native-only cases plus overlapping HTTP regressions. Do not add these counts as 353 distinct tests.
- Native cases include competing password resets, competing editorial saves, distinct-reference collection/hurdle contention, persisted receipts, actual HTTP disconnection and a fresh application process.
- Recovery checks cover generic unknown/unverified/known responses and their minimum interval measured over a persistent HTTP connection, no token in cleartext mail storage, recipient-bound decryption, open-request reuse, invalid/expired/replayed tokens, session invalidation, actual Argon2id login after reset, and rollback of password/token/session/confirmation-mail changes when audit persistence fails.
- Dependency audit: zero production findings; six moderate findings in the full development tree; zero high/critical; policy passed. The pre-existing rich-text editor chunk still produces the greater-than-500-KB build warning.
- Desktop browser review used the managed local, disposable PGlite fixture at 1363px. Homepage rendering/imagery, no horizontal overflow, practice selection, navigation search, service-to-form propagation, preservation of an entered synthetic name when changing service, signed-out account and disabled-recovery states were observed. Release/operations rendered under the synthetic QA principal with integrations disabled and external/owner gates visible. No real form was submitted or owner credentials entered.
- Responsive breakpoints and keyboard/label support are implemented. A mobile device/viewport acceptance pass was not obtained; it remains an explicit acceptance item.
- This is synthetic/local acceptance, not owner acceptance, provider transport proof, GitHub-hosted execution, Neon restore proof or production authorization.

Artifacts: `verification.log`, `native-proof.json`, `verification-summary.json`, fresh prefix/reference catalogs and checksums, and guarded unexecuted `preview/` and `production/` batches.

## Recovery security and activation contract

Recovery defaults to disabled. Activation requires `ACCOUNT_RECOVERY_MODE=email`, database authentication, configured Postmark delivery, an HTTPS `APP_BASE_URL`, and a separate random 32-byte `RECOVERY_EMAIL_ENCRYPTION_KEY` encoded as 64 hexadecimal characters. Do not reuse a test key or the authentication pepper. Provision secrets privately.

Only an active account with an established `email_verified_at` value is eligible. This is not public registration, an invitation service, MFA recovery or proof of a person's identity after suspected compromise. Existing owner bootstrap establishes its address; other account verification must be governed separately.

The recovery table stores token hashes; queued recovery bodies are encrypted using AES-256-GCM and bound to the outbox identifier and recipient. Only the delivery worker opens them in memory. Expired or undecryptable messages are rejected before contacting the provider. Retain the encryption key for queued messages; drain or explicitly retire them before rotation. Backup key custody and approved retention are operational requirements, not certified by this code. Mail providers and recipients necessarily receive the usable private link during actual delivery.

Requests use a generic response and a minimum response interval, per-address/network shared counters and a short-lived open-request boundary. No provider send happens in the recovery HTTP request. Completing a reset locks the account and token, updates the Argon2id hash/security version, consumes outstanding recovery tokens, revokes existing sessions and queues a confirmation atomically with audit. The user must sign in again. The raw reset token is transported in a fragment and request body; it is removed from the page URL on mount and is not included in the request-path logger.

Public counters store HMAC keys and time buckets. Their expiry index enables governed retention maintenance; automatic deletion has not been activated. NAT/proxy identity and production limits still need real hosting acceptance. Robots directives are crawler guidance, not access control. The sitemap includes core public routes only; it is not a dynamic per-article/project sitemap. The static CSP matches the existing integration policy and retains inline allowances; this is not a strict-CSP certificate.

Primary recovery design reference: https://cheatsheetseries.owasp.org/cheatsheets/Forgot_Password_Cheat_Sheet.html . Implementation tests are the evidence for the specific behavior above.

## Migration and controlled release

The deployed baseline last observed in this work remains production `d116fcfa9c44cf66c0cc3dbb619c367b22c94243`, READY deployment `dpl_JAxPkYZdHmBxsKJCdMJoW6VM4PD6`. Fresh provider reads still show ten retained Neon branches and only snapshot `snap-fragrant-dream-bbspabwq` from 18 November. The earlier new-snapshot attempt was rejected with HTTP 422 `snapshots limit exceeded`; no snapshot or branch has been deleted. Current backup/restore proof is not established.

This branch contains **15 migrations**. Production and the established isolated Preview baseline have 13 recorded files in the reviewed evidence. The new forward sequence is **0013 then 0014**. Do not replay 0000–0012 or reuse an old 13/14-file preparation script against this source. `prepare-portfolio-evolution.ts` verifies source/checksum identities and creates target/catalog/history-guarded batches for the two pending migrations. Both Preview and production batches are prepared, not executed.

A reviewed deployment must apply the additive schema and runtime grants before switching application traffic, because intake protection requires the new counter table. Check the actual target's 13-file history/catalog and email-state compatibility immediately before applying. Keep recovery/billing/delivery disabled initially. New schema presence alone does not activate integrations. A code rollback must preserve queued/uncertain outcomes, recovery-key custody and additive tables; no drop/reset rollback is proposed.

## Remaining gates and smallest safe continuation

| Gate | Current classification | Required next proof or decision |
| --- | --- | --- |
| Current backup and restore | Provider capacity-blocked; not certified | Owner approves capacity/retention/cost/target; create a current snapshot and restore privately with `finalize:false`; verify schema/history/grants/data/receipts/audit and measure recovery |
| Isolated candidate implementation | Locally verified | Review the final diff and exact commit, then approve its specific push/Preview/migration action; a push may trigger CI/deployment |
| Real delivery and recovery | Runtime proof missing; disabled | Controlled recipient, sender/worker/callback setup, delivered reset and confirmation, expiry/uncertainty/key-custody acceptance |
| Billing | Sandbox code retained; disabled | Actual provider sandbox lifecycle, merchant/settlement eligibility, product/currency/tax/refund decisions; no live billing design is certified |
| Owner browser acceptance | Open | Normal owner and member sessions on the exact hosted candidate; mobile layout, permissions, publication, financial recovery and delivery journeys |
| Hosted assurance | Not run for this candidate | Resolve the known account restriction; show/approve exact subsequent Quality/CodeQL trigger and collect results |
| Production activation | Owner approval required; HOLD | All applicable proofs, a fresh recovery boundary and explicit final activation scope |

The public redesign does not close financial or recovery gates. Local tests do not create a backup. A configured integration does not prove delivery, and a READY deployment does not approve activation.
