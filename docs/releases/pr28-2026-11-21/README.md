# PR 28 — Public Web Analytics

PR 28 adds `@vercel/analytics` 2.0.1 to the existing Vite entry point. It is reconciled with main `e5a4b4bef7e19d262f2940d7d231ecbf4602aa92`, preserving the current portfolio styles and the PR 27 release controls.

The original Preview at `55f08aad920e1c64333c730aebbb95def966b0d1` failed its historical dependency-audit gate with ten high findings. Its GitHub verify job also failed without executable steps. These are distinct failures; neither is attributed to analytics without evidence.

## Behavior

- Initialize the SDK in production builds only, using its official `beforeSend` callback.
- Permit page views only for the explicit public route list and public blog, portfolio and journey slugs.
- Reject private, unknown, malformed and foreign-origin URLs, including login, dashboard, administrator pages and private aliases.
- Drop query strings, fragments, URL credentials and extra event properties. Custom events are not enabled by this integration.
- Keep the SDK's navigation tracking. Existing first-party acquisition attribution is unchanged; query parameters are not forwarded to Vercel Web Analytics.
- Preserve all visible components, styles, financial logic, authentication configuration and database migrations.

## Verification

`npm ci --no-audit --no-fund` and `npm run verify:release` pass on the reconciled code:

| Gate | Result |
| --- | --- |
| TypeScript and certification syntax | PASS |
| Tests | 152 passed in 13 files, including 44 public-analytics boundary cases |
| Production build and server imports | PASS |
| Production dependency audit | Zero vulnerabilities |
| Full dependency audit | Six moderate, zero high/critical; no exception used |

The existing production `/_vercel/insights/script.js` endpoint returns JavaScript. The SDK's collector intentionally excludes automated browser traffic; no synthetic traffic count or human-visitor dashboard result is claimed by these source checks.

The PR branch's Preview `APP_DATABASE_URL` is scoped to the existing isolated `br-restless-credit-bb387cat/neondb` database. No credentials were added to source or repository artifacts, and production configuration was not changed.

An exact-head READY Preview and deployment provenance must be checked after the push. Record the resulting deployment and current billing-limited GitHub status in the PR description. No production migration or financial test is part of PR 28.

## Official references

- https://vercel.com/docs/analytics/quickstart
- https://vercel.com/docs/analytics/package#beforesend
- https://vercel.com/docs/analytics/redacting-sensitive-data
