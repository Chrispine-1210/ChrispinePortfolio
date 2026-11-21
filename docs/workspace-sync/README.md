# Canonical workspace synchronization

Audit date: 18 November 2026, Africa/Blantyre.

The project source, reviewed content, images, migrations, tooling and verification records belong in `Chrispine-1210/ChrispinePortfolio`. Generated preview bundles and runtime state are reproducible outputs, not a second source of truth. GitHub source synchronization and Vercel production activation are separate operations.

## Difference observed at the start of this synchronization

| Surface | Observed source | Meaning |
| --- | --- | --- |
| GitHub main and READY Vercel production | `fef6a0cd893fd0ecd4efd5e3a70222414e7a1c46` | Older portfolio release |
| Engineering-workspace source | `625db9fbda258f68b70bc025d9f8321e2104f9a0` | Includes the casebooks and engineering-workspace expansion; initially on a separate branch |
| Automatic preview for that source | `dpl_98pohyH7Bu3uXSw4fY2VWcfvotZB`, ERROR | `verify:release` stopped at the production-classified audit: 10 high-severity findings |

The user's instruction to synchronize the whole project authorizes pushing and reconciling the complete source into the canonical repository. It does not disable the deployment audit or establish production database readiness. No existing workflow is modified, no failed workflow is manually rerun, and no authentication or financial control is bypassed by this synchronization.

## Source retained in GitHub

- The complete existing application, API, shared contracts, migrations and network-practice project.
- All reviewed case-study text, screenshot assets, architecture images, provenance and verification captures.
- The engineering journal and private operating workspace, including their operating strategy and release documentation.
- Root ownership, author, repository and licence metadata naming Chrispine Mndala; dependency and image attribution remains intact.
- The portable casebook authoring script and a source-review index containing approved path/hash/URL metadata rather than raw repository source documents. A dry run reproduced all 16 reviewed case studies exactly.
- The guarded synthetic QA source under `scripts/qa`, replacing machine-specific cloud-review glue. It does not depend on a scratch-folder path or a real database credential.

The casebook source revision is now `portfolio-casebooks-20261118-v2` for provider-neutral historical identity wording. The earlier published database revision is not silently overwritten. A new editorial import requires fresh expected versions and its own reviewed execution; this source synchronization does not perform one.

## Runtime material outside Git

`workspace-manifest.json` accounts for project files and the remaining authoring/review material. Raw private-repository review responses and database-before-state snapshots are not suitable for a public repository. Their already reviewed public outputs are included. Credentials, ignored environment files, session/browser state, generated bundles, caches, dependency installations and FIFO inputs are not published.

Rebuild the actual synthetic UI review with `npm run build` followed by `npm run preview:engineering:qa`. The earlier read-only casebook preview is superseded by the canonical catalogue and actual application fixture. Build output is regenerated from the source rather than committed as another independently edited website.

## Release status and verification

Current check results and logs are in `verification/`. Source checking does not grant production approval: dependency audits still fail, and the engineering migration has only been applied to the isolated review database. The production schema is unchanged by this synchronization.

The upstream picomatch advisory is [GHSA-fc5q-39xc-vjpf](https://github.com/advisories/GHSA-fc5q-39xc-vjpf). Registry latest was checked and remained 4.0.7, inside the reported affected range. The dependency graph was not forced onto an unrelated older toolchain and the audit was not removed to make the build appear successful.

Use the exact GitHub integration commit and the resulting Vercel deployment record to establish final source/live parity. A failed build leaves the prior production release serving its existing domain. The terminal provider result is reported with the repository integration result, not inferred from a successful Git push.
