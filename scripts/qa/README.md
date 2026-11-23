# Isolated engineering review

This source reproduces the cloud review fixture without copying machine-specific absolute paths, compiled bundles, environment files or real database records into the application. It uses the real Express routes and a new in-memory PGlite database with the complete migration chain.

Run `npm run build`, then `npm run preview:engineering:qa`. Open `http://127.0.0.1:4173/_qa/start` for the synthetic session. Data disappears when the process stops. Pass `--port 4174` to the launcher for a different loopback port, or `--build-only` to verify compilation without starting a server.

The launcher refuses Vercel and `NODE_ENV=production`, strips authentication and provider environment variables, generates a disposable session pepper and binds to loopback. The database adapter and session endpoint also check the QA flag. The production entrypoint never imports this directory. No configured Neon database or actual owner account is used. This fixture verifies interface behavior; it does not certify real password sign-in or production database connectivity.

Earlier read-only casebook-preview glue has been superseded by the actual application fixture and the canonical reviewed catalogue in `docs/portfolio`. Generated `.qa-preview` files are ignored by Git.

## Genuine editorial draft acceptance

With the isolated fixture running, use a second terminal:

```sh
node scripts/qa/editorial-draft-acceptance.mjs http://127.0.0.1:4173 /tmp/editorial-acceptance.json
```

This command refuses hosted origins and verifies the synthetic fixture principal
before writing. It creates the reviewed draft in the in-memory application,
proves anonymous denial and draft privacy, rejects premature publication, and
uses the existing review/approve/publish/archive/restore transitions. The local
test publication ends as an unpublished draft, and stopping the fixture discards
all its data. The actual rich-content parser and renderer verify inline geometry,
alt text, caption and credit; the compiled cover must exist in the current build.
The payload and human-readable source live in `docs/editorial/drafts/`.

This is API and rendered-markup evidence. It does not certify browser layout,
real owner password sign-in, hosted Preview, publication or production. No live
content is seeded and no financial/provider operations are performed.
