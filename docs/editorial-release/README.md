# Writing, Work and About — 18 November 2026

This release replaces terminal-style labels and low-contrast public layouts with a shared, scoped editorial design. The project library shows contained interface captures or labelled architecture diagrams, validated search and sector controls, a featured toggle and pagination without repeating the section header. Existing case-study descriptions and evidence limitations remain intact.

Writing distinguishes published articles from project casebooks. The production article API returned an empty published collection at review; the UI now explains that state, offers useful project reading, and links to the engineering journal. It does not manufacture articles, subscriber totals or readership. Article reading uses a constrained measure, readable prose, semantic Markdown code blocks and sharing with visible failure handling. About uses the existing full-colour portrait with a deliberate portrait crop; roles, dates and education follow the existing public CV. Unsupported expertise claims and stale hard-coded case-study counts were removed.

## Live compatibility repair

Vercel's deployment fetch attaches `_vercel_share`. Strict read-query parsing rejected that metadata with HTTP 400. Read schemas now strip unknown query metadata while validating known filters. Write bodies stay strict. The new regression test reproduced the failure before the repair and then passed, including invalid filter bounds, unauthenticated rejection and strict mutation-body checks.

## Source verification

`npm run verify:release` passed: TypeScript, 98 tests across 10 files, frontend/server build, both production entrypoint import graphs, zero production dependency vulnerabilities, and the existing owner-approved development-only audit policy. See `verification.log`.

No database migration, permissions, workflow, package manifest, lockfile or audit exception was changed in this release. The existing build-only advisory acceptance still expires on 25 November 2026 at 02:00 Africa/Blantyre. Production authentication and public disclosure gates remain in place.

The local visual-review browser could not reach the isolated QA server in this environment. Synthetic QA data and temporary review launchers are excluded from Git and production.

Production commit `c2471a70806c3c724969d8fd609c72c708755708` reached READY. Live API verification returned HTTP 200 for the journal (zero published notes), HTTP 200 for the project collection (16 case studies), HTTP 200 for the empty published blog collection, and HTTP 401 for unauthenticated private engineering records. The browser rendered the new Writing and About content. Its first screenshot exposed white navigation links over the light page surface; the follow-up makes the existing solid green journal header apply to Writing, Work and About as well. Final visual and interaction checks remain to be recorded against that follow-up deployment.
