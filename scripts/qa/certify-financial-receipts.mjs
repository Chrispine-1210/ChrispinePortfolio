// Isolated Preview only. Password/share credentials enter via private stdin,
// never arguments, files or reports. No provider sends or actual billing.
import { createInterface } from "node:readline";
import { spawnSync } from "node:child_process";
import { writeFileSync } from "node:fs";
import { randomUUID } from "node:crypto";
import assert from "node:assert/strict";
if (process.env.VERCEL || process.env.NODE_ENV === "production") throw Error("Run the certification client outside production");
if (process.stdin.isTTY && spawnSync("stty", ["-echo"], { stdio: "inherit" }).status !== 0) throw Error("Unable to protect private stdin");
console.log("Ready for private Preview configuration on stdin");
const input = createInterface({ input: process.stdin });
const config = JSON.parse(await new Promise(resolve => input.once("line", resolve))); input.close();
assert.equal(config.branch, "br-restless-credit-bb387cat");
assert.match(config.sha, /^[a-f0-9]{40}$/);
assert.match(new URL(config.url).hostname, /^chrispine-portfolio-[a-z0-9]+-chrispine-1210s-projects\.vercel\.app$/);
const output = process.argv[2] ?? "/tmp/financial-receipts-preview-runtime.json";
const checks = [], fixture = { marker: "receipt-preview-" + randomUUID(), userId: config.userId, createKey: randomUUID(), voidKey: randomUUID() };
let cookie = "", hosting = "";
const save = extra => writeFileSync(output, JSON.stringify({ exactHead: config.sha, databaseBranchId: config.branch, fixture, checks, ...extra }, null, 2) + "\n");
async function call(path, method = "GET", body, key) {
  const response = await fetch(config.url + path, { method, headers: { Cookie: [hosting, cookie].filter(Boolean).join("; "), ...(body ? { "Content-Type": "application/json" } : {}), ...(key ? { "Idempotency-Key": key, "X-Financial-Actor": config.userId } : {}) }, ...(body ? { body: JSON.stringify(body) } : {}), redirect: "manual", signal: AbortSignal.timeout(30000) });
  const json = await response.json().catch(() => null);
  checks.push({ path, method, status: response.status, requestId: response.headers.get("x-request-id"), replayed: response.headers.get("idempotency-replayed") }); save();
  return { response, json };
}
function expect(result, status = 200) { assert.equal(result.response.status, status, `Expected HTTP ${status}, received ${result.response.status}`); return result.json; }
async function identity() {
  const release = expect(await call("/api/release"));
  assert.equal(release.environment, "preview"); assert.equal(release.commitSha, config.sha);
  assert.equal(release.databaseBranchId, config.branch); assert.equal(release.databaseRole, "portfolio_runtime");
  assert.equal(release.deploymentUrl, new URL(config.url).hostname);
}
async function post(path, body, key, status = 201) { await identity(); const result = await call(path, "POST", body, key); expect(result, status); return result; }
const path = "/api/admin/treasury/operating-expenses";
try {
  const access = await fetch(config.shareableUrl, { redirect: "manual", signal: AbortSignal.timeout(30000) });
  assert([302, 307].includes(access.status)); hosting = access.headers.getSetCookie().map(value => value.split(";")[0]).join("; "); assert(hosting);
  await identity(); expect(await call("/api/auth/me"), 401);
  const login = await call("/api/auth/login", "POST", { email: config.email, password: config.password }); expect(login);
  cookie = login.response.headers.getSetCookie().find(value => value.startsWith("admin_session=")).split(";")[0];
  const me = expect(await call("/api/auth/me")); assert.equal(me.id, config.userId); assert(me.permissions.includes("roic.evidence.manage")); assert(!me.permissions.includes("capital.budget.approve"));
  const body = { currency: "XTS", amount: 10, category: "software_tools", occurredAt: new Date(Date.now() - 86400000).toISOString(), sourceReference: fixture.marker, notes: "Synthetic isolated Preview receipt certification only; no business amount." };
  const accepted = await post(path, body, fixture.createKey); fixture.expenseId = accepted.json.id; save();
  const replays = await Promise.all(Array.from({ length: 3 }, () => post(path, body, fixture.createKey)));
  for (const replay of replays) { assert.deepEqual(replay.json, accepted.json); assert.equal(replay.response.headers.get("idempotency-replayed"), "true"); }
  await post(path, { ...body, amount: 11 }, fixture.createKey, 409);
  const receipt = expect(await call("/api/admin/financial-requests/" + fixture.createKey)); assert.equal(receipt.state, "recorded"); assert.equal(receipt.status, 201); assert.deepEqual(receipt.result, accepted.json);
  const absent = expect(await call("/api/admin/financial-requests/" + randomUUID())); assert.equal(absent.state, "unconfirmed");
  const voidPath = "/api/admin/treasury/evidence/opex/" + fixture.expenseId + "/void";
  const reason = { reason: "Retire isolated Preview receipt certification fixture" };
  const retired = await post(voidPath, reason, fixture.voidKey, 200);
  const replayedVoid = await post(voidPath, reason, fixture.voidKey, 200); assert.deepEqual(replayedVoid.json, retired.json); assert.equal(replayedVoid.response.headers.get("idempotency-replayed"), "true");
  expect(await call("/api/auth/logout", "POST", {})); cookie = ""; expect(await call("/api/auth/me"), 401); await identity();
  save({ decision: "PASS", databaseRole: "portfolio_runtime", normalPasswordAuthentication: true, fixtureVoided: true, identityRetirementPending: true });
  console.log(JSON.stringify({ decision: "PASS", checks: checks.length, fixture, exactHead: config.sha }));
} catch (error) { save({ decision: "FAIL", identityRetirementPending: true }); throw error; }
