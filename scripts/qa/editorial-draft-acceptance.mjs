import assert from "node:assert/strict";
import { readFile, writeFile, mkdir } from "node:fs/promises";
import { fileURLToPath, pathToFileURL } from "node:url";
import path from "node:path";
import { build } from "esbuild";

// This exercises real application routes only on the guarded in-memory QA
// fixture. It cannot target a hosted origin, real principal or configured Neon.
const [originArg, outputFile] = process.argv.slice(2);
if (!originArg) throw new Error("Usage: node scripts/qa/editorial-draft-acceptance.mjs http://127.0.0.1:4173 [result.json]");
const origin = new URL(originArg);
assert.equal(origin.protocol, "http:");
assert.equal(origin.hostname, "127.0.0.1");
assert.ok(origin.port && !origin.username && !origin.password);
assert.equal(origin.pathname, "/");
assert.ok(!origin.search && !origin.hash);
const baseURL = origin.origin;
const root = fileURLToPath(new URL("../../", import.meta.url));
const draft = JSON.parse(await readFile(path.join(root, "docs/editorial/drafts/why-deployment-is-only-one-release-gate.json"), "utf8"));
assert.ok(!("isPublished" in draft) && !("workflowStatus" in draft));
const checks = [];
let cookie, postId, retired = false;
async function call(url, method = "GET", data, authenticated = false) {
  return fetch(baseURL + url, { method, redirect: "manual", headers: {
    ...(data ? { "Content-Type": "application/json" } : {}),
    ...(authenticated ? { Cookie: cookie, Origin: baseURL } : {}),
  }, ...(data ? { body: JSON.stringify(data) } : {}) });
}
async function status(response, expected, name) {
  assert.equal(response.status, expected, `${name}: ${response.status}`);
  checks.push({ check: name, status: "PASS", httpStatus: expected });
  return response;
}
async function transition(action, expected = 200) {
  return status(await call(`/api/admin/content/posts/${postId}/transition`, "POST", {
    action, ...(action === "archive" ? { justification: "Isolated editorial acceptance completed; withdraw local test publication" } : {}),
  }, true), expected, `workflow ${action}`);
}

// Verify the fixture identity before any write. This route exists only in the
// production-refusing QA launcher. The issued session uses normal auth/RBAC.
const start = await call("/_qa/start");
assert.equal(start.status, 302);
assert.equal(start.headers.get("location"), "/admin/workspace");
cookie = start.headers.getSetCookie().find(value => value.startsWith("admin_session="))?.split(";")[0];
assert.ok(cookie);
const me = await status(await call("/api/auth/me", "GET", undefined, true), 200, "synthetic QA session");
assert.equal((await me.json()).email, "engineering-review@qa.invalid", "Refuse any non-QA principal before writing");

const outputDirectory = path.join(root, ".qa-preview");
await mkdir(outputDirectory, { recursive: true });
const rendererFile = path.join(outputDirectory, "editorial-render.mjs");
await build({
  stdin: { contents: `import {createElement} from 'react'; import {renderToStaticMarkup} from 'react-dom/server'; import {RichContent} from './client/src/components/editorial/RichContent.tsx'; import {readEditorial} from './shared/editorial.ts'; import {editorialPhotos,PhotoCreditForSource} from './client/src/components/EditorialPhoto.tsx'; import oldCode from './attached_assets/portfolio-editorial/photo-code.webp'; export function inspect(content) { if (!readEditorial(content)) throw new Error('Invalid editorial draft'); return renderToStaticMarkup(createElement(RichContent,{content})); } export function inspectPhotos() { return { current:renderToStaticMarkup(createElement(PhotoCreditForSource,{src:editorialPhotos.code.src})), legacy:renderToStaticMarkup(createElement(PhotoCreditForSource,{src:oldCode})), source:editorialPhotos.code.src }; }`, resolveDir: root, sourcefile: "editorial-render.ts", loader: "ts" },
  outfile: rendererFile, bundle: true, platform: "node", packages: "external", format: "esm", jsx: "automatic", loader: { ".css": "empty", ".webp": "file" }, alias: { "@assets": path.join(root, "attached_assets") }, tsconfig: path.join(root, "tsconfig.json"),
});
const { inspect, inspectPhotos } = await import(pathToFileURL(rendererFile).href);
const photoCredits = inspectPhotos();
assert.match(photoCredits.source, /photo-workspace-/);
assert.match(photoCredits.current, /Slava Keyzman/);
assert.match(photoCredits.legacy, /Bernd Dittrich/);
assert.ok(photoCredits.legacy.includes("XIpm0bnYOQE"));
checks.push({ check: "new software source keeps Slava Keyzman credit; saved legacy code covers retain Bernd Dittrich credit", status: "PASS" });
const markup = inspect(draft.content);
assert.ok(markup.includes('<figure class="rich-image" style="width:100%;margin-left:auto;margin-right:auto">'));
assert.ok(markup.includes('src="/media/editorial/network.webp"'));
assert.ok(markup.includes('alt="Ethernet patch leads connected to switches in a network rack"'));
assert.ok(markup.includes("Editorial photo by Yuriy Vertikov on Unsplash"));
assert.ok(markup.includes('href="https://unsplash.com/photos/a-rack-of-servers-with-wires-and-wires-attached-to-them-c-lSQecD9oI"'));
assert.ok(markup.includes("not a photograph of this project"));
checks.push({ check: "real rich-content parser and renderer preserve inline geometry, alt, caption and linked attribution", status: "PASS" });
await status(await call(draft.featuredImage), 200, "compiled planning cover available locally");
await status(await call("/media/editorial/network.webp"), 200, "inline network image available locally");

try {
  await status(await call("/api/admin/content/posts", "POST", draft), 401, "anonymous draft creation denied");
  const created = await status(await call("/api/admin/content/posts", "POST", draft, true), 201, "create genuine draft in isolated PGlite");
  const stored = await created.json();
  postId = stored.id;
  assert.equal(stored.workflowStatus, "draft");
  assert.equal(stored.isPublished, false);
  assert.equal(stored.publishedAt, null);
  assert.equal(stored.content, draft.content);
  await status(await call(`/api/blog/${draft.slug}`), 404, "draft detail hidden from public");
  assert.ok(!(await (await call("/api/blog")).json()).some(post => post.slug === draft.slug));
  checks.push({ check: "draft omitted from public list", status: "PASS" });
  await transition("publish", 409);
  for (const action of ["submit_review", "approve", "publish"]) await transition(action);
  const detail = await status(await call(`/api/blog/${draft.slug}`), 200, "approved local article available");
  const article = await detail.json();
  assert.equal(article.featuredImage, draft.featuredImage);
  assert.equal(article.editorialMetadata.coverAlt, "Colleagues discussing work around a table with a laptop");
  assert.equal(inspect(article.content), markup);
  const card = (await (await call("/api/blog")).json()).find(post => post.slug === draft.slug);
  assert.ok(card && !card.content);
  assert.equal(card.featuredImage, draft.featuredImage);
  assert.equal(card.editorialMetadata.kind, "note");
  checks.push({ check: "public list/detail projection retains cover and editorial metadata", status: "PASS" });
  await transition("archive");
  await status(await call(`/api/blog/${draft.slug}`), 404, "withdrawn article hidden");
  await transition("restore");
  await status(await call(`/api/blog/${draft.slug}`), 404, "fixture returned to unpublished draft");
  retired = true;
} finally {
  if (postId && !retired) {
    const response = await call(`/api/admin/content/posts/${postId}/transition`, "POST", { action: "archive", justification: "Withdraw local QA article after interrupted acceptance" }, true);
    if (response.status !== 200) console.error("Inspect interrupted local fixture; stop the in-memory QA process.");
  }
}
const result = {
  verifiedAt: new Date().toISOString(),
  sourceBase: "d116fcfa9c44cf66c0cc3dbb619c367b22c94243",
  environment: "loopback-only disposable in-memory PGlite QA fixture",
  principal: "synthetic QA session; not real owner/password/browser acceptance",
  checks,
  fixtureRetirement: "Public test publication withdrawn and restored to draft; memory discarded when QA stops",
  limitations: ["API and server-rendered markup proof only; no browser/layout certification", "No hosted Preview or production acceptance", "No production data, financial fixtures, provider sends, charges, restores or deployment"],
};
if (outputFile) await writeFile(outputFile, JSON.stringify(result, null, 2) + "\n");
console.log(JSON.stringify(result, null, 2));
