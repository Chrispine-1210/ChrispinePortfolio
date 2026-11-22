# Editorial imagery and publishing studio

Baseline: production main `c983423e8a97983a265a8af6e94fccbfa6f9c2c8`. This package improves the public presentation and governed publishing tools. It does not close the outstanding financial, migration-adoption, recovery, billing, delivery, restore or GitHub assurance gates.

## Public experience

- Homepage practice cards retain their icons and gain relevant photographs for software, networks, hardware repair and business operations. Story and journal/writing/source sections also use photography. About gains image-backed capability cards.
- Project cards use an editorial photograph where the previous cover was a diagram or empty. Actual architecture diagrams and project evidence remain in detail views. Photograph labels and source credits distinguish illustration from documentary project evidence.
- Writing supports Articles, Research, Tutorials, Notes and Publications, independently of topic. Format and topic filters share their URL state. Counts and empty states reflect published records; no publications, customer results or research findings have been invented.
- The owner's ORCID iD is `0009-0004-8345-2949`, confirmed from the account registration record. The site links to that exact record. Zenodo and Google Scholar are clearly labelled research resources, not asserted personal profiles. There is no new external OAuth flow or automatic publication/DOI submission.
- Research/publication metadata supports authors, status, source/venue, DOI, original URL and citation. These fields follow the existing approval workflow. ORCID identifies an author; it does not establish peer review or verify the content of a work.

See `attached_assets/portfolio-editorial/README.md` for checked image sources and licenses. The two new local WebP photographs depict a network rack and a circuit board/repair tool. They do not depict the owner's premises or completed customer work.

## Authoring and persistence

The content manager, case-study narratives and engineering field-note publisher share a visual editor with headings, fonts, text sizes, bold/italic/underline/strike, lists, blockquotes, code, links, tables, undo/redo and preview. Inline images support descriptions, captions, attribution, left/center/right placement and bounded widths. Existing Markdown remains readable and can retain its source format.

Cover/image selectors provide a visible empty state, preview, broken-image state, curated photo library and source URL input. Content and case-study uploads accept JPEG/PNG/WebP, optimize in the browser, remove source metadata and cap each saved raster at 160 KB. The input file is limited to 8 MB/32 megapixels. An image is durable only after the containing revision saves successfully. Field notes use library or hosted images and keep their smaller request budget.

New documents use a versioned envelope inside the existing text fields. Formatting, images and citation metadata therefore commit with the same existing immutable revision and audit transaction. No database migration or new storage provider is required. This bounded approach suits small editorial assets; a dedicated object store remains appropriate for a large media library. There is no server filesystem upload pretending to be durable on Vercel.

Public writing collections omit full bodies and expose safe editorial metadata. Uploaded cover/inline images in writing are served through a published-record media endpoint, so list payloads do not inline base64 documents. Draft/archived records cannot expose their images. Premium inline assets require the same existing reader identity check as the detail route and use private, no-store caching; anonymous lookup remains denied and a public cover remains visible. Existing private/publication/evidence permissions are retained.

## Validation boundaries

- Rich documents permit a bounded tree of known nodes, marks, fonts, sizes and image attributes. React renders the tree directly; no arbitrary HTML is executed. Legacy Markdown skips embedded HTML. Unsafe links, SVG data, arbitrary attributes, invalid metadata and oversized images/documents are refused.
- Larger JSON limits apply only after the same existing permission checks: 1250 KB for content/case-study creation and revision; 128 KB for field-note publication. Public intake and financial APIs retain 10 KB.
- Tests cover the actual editor schema/default image geometry, formatting/metadata round trips, partial DOI editing, unsafe sources, malformed documents, legacy Markdown, authenticated long documents, authorization before parsing, publication/archive image availability, premium image boundaries and immutable revision storage.
- Test concurrency is bounded to two PostgreSQL-WASM suites. An earlier parallel verification lost a worker without an assertion finding; no test was removed or skipped. Final check results are recorded in `verification.log`.

## Release verification

`npm run verify:release`: PASS, **250 tests in 18 files**, including 24 new editorial/media cases; TypeScript, client/server build, production import checks and dependency policy pass. Production audit: zero findings. Full tree: six moderate, zero high/critical; no exception. The final run uses two database-test workers and skips no tests.

## Preview build timing correction

The initial Vercel Preview ran all 244 checks: 242 passed and two existing migration-fixture cases exceeded the default 5-second test timeout. They reported no assertion finding. The two migration fixture suites now allow 15 seconds for PostgreSQL-WASM cold startup and catalog work on shared build CPUs; their assertions, database guards, and financial HTTP deadlines remain unchanged. The failed deployment is retained as historical evidence and a subsequent source commit must obtain its own passing build.

## Live certification

Live Preview browser/API evidence will be recorded against the exact PR head in the pull request. A managed local preview could not launch because its TypeScript CLI IPC socket was denied; the working application launch command was preserved. Local test/build evidence and live Preview evidence must be reported separately. No production financial fixtures or external provider messages are used.

## Review corrections and component proof

CodeRabbit's 15 inline findings were checked against the source. Corrected link-title defaults, document-relative legacy references, root-text validation, unreadable/oversized draft metadata preservation, visible reference errors, safe Markdown conversion, stale image-panel edits, photo-credit replacement, asynchronous upload ownership, case-study draft remounting and deferred editors, complete request byte budgets, independent role/team rendering and authorized premium-image delivery. No approval, financial or evidence gate was removed.

A static, API-disconnected component fixture loaded the actual editor, metadata and image-picker components through the supported preview daemon. Browser readback confirms Georgia 24px, bold, a real link command, attributed library-image insertion and right-aligned 50% image rendering. Changing a Research draft with an invalid HTTP source URL to Article keeps that field visible with its error. This is component evidence, not a signed-in admin browser certification.

The first successful Preview (`5fd3f59a8a62882df9a0004bd83fbce39fc719e2`, deployment `dpl_36szMWUuVJCguSv1J9tH46bVwH83`) returned READY and `/api/release` verified isolated branch `br-restless-credit-bb387cat`. Its public browser loaded all homepage photographs at 1363px without overflow. Writing shows actual zero counts, all requested formats and the exact ORCID. At 340 CSS px (browser zoom; no device emulation), mobile navigation opens and no horizontal overflow was observed. Subsequent corrections require a new exact-head Preview before merge.

## Responsive navigation correction

At 340 CSS px, a pointer click on a nested mobile navigation item closed the sheet without navigating; keyboard Enter on the link navigated while leaving the sheet open. Moving the close callback from the nested animated element onto the actual router link unifies both paths. TypeScript and client/server build passed after this small follow-up; live exact-head pointer and keyboard verification remains required before merge.
