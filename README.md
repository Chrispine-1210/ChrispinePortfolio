# Chrispine Portfolio

Chrispine Mndala's engineering portfolio, public project case studies and private operating workspace. Project ownership and maintenance belong to Chrispine Mndala. The site connects professional evidence with Aöthothe Technologies and SUDERN while preserving each application's access and institutional responsibilities.

Canonical repository: https://github.com/Chrispine-1210/ChrispinePortfolio

Production address: https://chrispine-portfolio.vercel.app

A commit being present in GitHub does not mean that Vercel deployed it. Read [workspace synchronization](docs/workspace-sync/README.md) for source/deployment identities and current release limitations.

## Project structure

| Path | Purpose |
| --- | --- |
| `client/` | React/TypeScript portfolio, engineering journey and protected admin interfaces |
| `server/`, `api/` | Express application, Vercel entrypoint, authorization and operational APIs |
| `shared/` | Database schema and shared input/domain contracts |
| `migrations/` | Ordered PostgreSQL migrations |
| `client/public/project-evidence/` | Reviewed screenshots and labelled architecture diagrams |
| `docs/portfolio/` | Reviewed casebook source, narratives and asset provenance |
| `docs/engineering-workspace/` | Operating strategy, architecture, release procedure and verification captures |
| `network-ops-training-platform/` | Separately deployed network troubleshooting practice application |
| `scripts/qa/` | Isolated synthetic review fixture, outside production application imports |

## Local development

Use Node.js 22 or later and npm. Run `npm ci`, copy `.env.example` to `.env`, and configure the intended development database and private authentication settings. Do not commit environment files or credentials.

For a real development database, follow the [guarded migration procedure](docs/production-readiness/migrations-2026-11-22/README.md). Keep the separate migration credential in a private `.env.migrations` overlay used only by the runner; do not load that overlay into the application server. Review the read-only plan before explicitly applying it:

```sh
node --env-file=.env --env-file=.env.migrations --import tsx scripts/migrate.ts --plan
node --env-file=.env --env-file=.env.migrations --import tsx scripts/migrate.ts --apply
node --env-file=.env --import tsx scripts/bootstrap-admin.ts
node --env-file=.env --import tsx server/index.ts
```

Set the one-time bootstrap variables privately before running bootstrap. Remove them after use. The engineering workspace requires database authentication; its default private route is `/admin/workspace`. Set `APP_BASE_URL` to the exact browser origin used for writes. The public journal is `/journey`.

Production database migration requires the backup, restore and release procedure in [the runbook](docs/engineering-workspace/RELEASE.md).

## Verification and isolated visual review

```sh
npm run check
npm test
npm run build
npm run verify:release
```

`verify:release` includes both production-classified and full dependency audits. The audits remain enabled. A successful bundle does not override a failed audit.

For an entirely synthetic browser review, first run `npm run build`, then `npm run preview:engineering:qa`. This uses an isolated in-memory PGlite database, not the configured Neon database. The fixture is refused in Vercel and production environments, binds to loopback, disables provider credentials and is never imported by the production entrypoint. Open `http://127.0.0.1:4173/_qa/start` to issue the synthetic review session. See [fixture documentation](scripts/qa/README.md).

## Ownership and attribution

The application is maintained independently of a particular development IDE or hosting provider. No development-platform badge or ownership credit is required by this application. Existing Git history remains intact. Open-source packages, original dependency licence notices and editorial image credits retain their respective authorship. See [LICENSE](LICENSE) and [AUTHORS.md](AUTHORS.md).
