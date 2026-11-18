# Deployment audit recovery — proposed release decision

18 November 2026, Africa/Blantyre. Base production-source commit: `9c6251d92fd15eaf118ea2b18449798219442646`.

The supplied Vercel log shows TypeScript PASS, 86 tests PASS and bundle generation PASS. The failed command was the dependency audit in `verify:release`, reporting 10 high-severity metavulnerabilities stemming from one picomatch advisory. Expected 401/403/409 responses and validation errors inside passing tests were not the deployment failure.

## Changes prepared

1. Move `tailwindcss-animate` from runtime dependencies to development dependencies. It is used by the CSS build configuration. Package versions, resolutions and integrity values remain unchanged. The strict production audit now reports **zero vulnerabilities**.
2. Separate static serving and logging from Vite development setup. Preserve the existing logger API. Load development Vite only from the development-mode branch so the built standalone server and Vercel API no longer statically import development tooling.
3. Verify both production entrypoints through an independent esbuild import graph. Every external non-builtin package must have a non-development lockfile entry. The observed roots are Neon, Argon2, Drizzle, Express, Postmark, Stripe, Twilio, ws and Zod.
4. Keep both production and full audit queries. A proposed policy can accept only the exact advisory, through strictly development-only lockfile paths, after an explicit owner approval. New high/critical advisories, runtime exposure, altered lockfiles, inconsistent audit responses, failed audit transport, future-dated acceptance, expiry or an acceptance longer than seven days block release.
5. Extend the existing runtime-extension test to recognize valid native `.mjs` and `.cjs` extensions as well as `.js`. No GitHub workflow was changed or manually rerun.

## Verification

| Check | Result |
| --- | --- |
| TypeScript | PASS |
| Tests | PASS: 94 tests, 9 files |
| Frontend/server build | PASS |
| Production runtime import graph | PASS; no development-only external packages |
| Strict `npm audit --omit=dev --audit-level=high` | PASS; zero vulnerabilities |
| Full audit | 13 high and 6 moderate, all development-only after reclassification |
| Proposed policy with no approval | FAIL as intended; release remains blocked |
| In-memory approval simulation | PASS for the one advisory's 13 development-package paths; no active policy file changed |
| Isolated QA bundle | PASS |

The high findings all trace to [GHSA-fc5q-39xc-vjpf](https://github.com/advisories/GHSA-fc5q-39xc-vjpf). Registry latest remains 4.0.7; the upstream [release-guidance issue](https://github.com/micromatch/picomatch/issues/247) is open. No unreviewed fork, fabricated upstream version, forced toolchain downgrade or broad audit suppression has been applied.

Audit findings describe known dependency reports, not a penetration-test certification. Reclassifying a build tool does not patch the library. Build-time exposure remains: a malicious or untrusted glob processed by tooling could deny service to the build/test process. Keep repository write access controlled, run tests/builds from reviewed source, and do not process request-supplied glob patterns through development tooling.

## Concrete approval requested

The proposal is in `security/build-audit-exception.json`, currently **`status: proposed`**, with `approvedBy` and `approvedAt` unset. It applies only to the specific advisory and the exact SHA-256 of the reviewed lockfile. Its fixed expiry is **25 November 2026 at 02:00 Africa/Blantyre**. Runtime high/critical findings and every other high/critical advisory remain blocking. Moderate findings retain the prior high-threshold treatment and remain visible in the audit report.

Owner approval is required because this would accept a known residual build-time security risk; it is not a patched release or a clean full audit. Approval would authorize recording the owner's acceptance, integrating this bounded release-policy change and continuing the deployment-readiness work. It does not authorize deleting data, changing GitHub workflows, waiving database recovery requirements or activating unverified financial operations.

Until explicit approval, this branch must remain unmerged and the exception must remain inactive. The strict production-dependency classification fix is valid independently, but the full release gate cannot pass with the proposed exception unapproved. The real production domain remains on its previous READY deployment.

After approval, recheck the exact lock, repeat affected gates, confirm an independently recoverable production migration path for engineering schema 0011, deploy the exact reviewed source and verify public and authenticated journeys. An expired exception blocks the next build; it cannot recall a deployment already serving traffic. Remove the exception and return to an entirely clean audit as soon as an upstream patch or otherwise reviewed remediation is available.

Evidence is in `verification/`, including the provider-log excerpt, production import graph, tests, strict production audit, unchanged package-version evidence, full report and the explicitly synthetic approval simulation. Original logs remain the user's supplied attachment; no credentials or client financial records are copied into this evidence.

Primary command reference: [npm audit](https://docs.npmjs.com/cli/commands/npm-audit/).
