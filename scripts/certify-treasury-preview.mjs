#!/usr/bin/env node
import { randomUUID } from "node:crypto";
import { existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { spawnSync } from "node:child_process";
import { setTimeout as delay } from "node:timers/promises";

const required = [
  "CERT_BASE_URL",
  "CERT_ADMIN_EMAIL",
  "CERT_ADMIN_PASSWORD",
  "CERT_EXPECTED_GIT_SHA",
  "CERT_EXPECTED_DATABASE_BRANCH_ID",
];
for (const key of required) {
  if (!process.env[key]) throw new Error(`Missing required environment variable: ${key}`);
}

const baseUrl = process.env.CERT_BASE_URL.replace(/\/$/, "");
const expectedSha = process.env.CERT_EXPECTED_GIT_SHA;
const expectedDatabaseBranchId = process.env.CERT_EXPECTED_DATABASE_BRANCH_ID;
const adminEmail = process.env.CERT_ADMIN_EMAIL;
const adminPassword = process.env.CERT_ADMIN_PASSWORD;
const currency = (process.env.CERT_CURRENCY || "XTS").toUpperCase();
const serviceInterest = process.env.CERT_SERVICE_INTEREST || "enterprise-software";
const deploymentAmount = Number(process.env.CERT_DEPLOYMENT_AMOUNT || "16000");
const requestConnectTimeoutSeconds = 10;
const requestMaxTimeSeconds = 45;
const cliTimeoutMs = 60_000;

let baseHostname;
try {
  const parsedBase = new URL(baseUrl);
  if (parsedBase.protocol !== "https:") throw new Error("not https");
  baseHostname = parsedBase.hostname;
} catch {
  throw new Error("CERT_BASE_URL must be a valid HTTPS deployment URL.");
}

if (!/^[A-Z]{3}$/.test(currency)) throw new Error("CERT_CURRENCY must be a three-letter uppercase code.");
if (!Number.isFinite(deploymentAmount) || deploymentAmount <= 0) throw new Error("CERT_DEPLOYMENT_AMOUNT must be positive.");
if (!/^[0-9a-f]{40}$/i.test(expectedSha)) throw new Error("CERT_EXPECTED_GIT_SHA must be a full 40-character Git SHA.");
if (!/^br-[a-z0-9-]+$/i.test(expectedDatabaseBranchId)) {
  throw new Error("CERT_EXPECTED_DATABASE_BRANCH_ID must be a Neon branch id beginning with br-.");
}

const cliIdentity = spawnSync("vercel", ["whoami"], {
  encoding: "utf8",
  timeout: cliTimeoutMs,
});
if (cliIdentity.error) {
  throw new Error(`Vercel CLI is required for protected Preview certification: ${cliIdentity.error.message}`);
}
if (cliIdentity.status !== 0) {
  throw new Error("Vercel CLI is not authenticated. Run vercel login in the execution environment before certification.");
}

function parseJson(text) {
  if (!text.trim()) return null;
  try { return JSON.parse(text); } catch { return null; }
}

function runRequest(path, { method = "GET", body, cookie, financialKey } = {}) {
  const dir = mkdtempSync(join(tmpdir(), "portfolio-cert-"));
  const headerFile = join(dir, "headers.txt");
  const bodyFile = join(dir, "body.txt");

  try {
    const args = [
      "curl", path,
      "--deployment", baseUrl,
      "--",
      "--silent", "--show-error",
      "--connect-timeout", String(requestConnectTimeoutSeconds),
      "--max-time", String(requestMaxTimeSeconds),
      "--dump-header", headerFile,
      "--output", bodyFile,
      "-H", "Accept: application/json",
    ];
    if (method !== "GET") args.push("-X", method);
    if (financialKey) args.push("-H", `Idempotency-Key: ${financialKey}`);
    // Request secrets must never appear in process arguments on a shared host.
    if (cookie) {
      const cookieFile = join(dir, "request-cookie.txt");
      writeFileSync(cookieFile, `Cookie: ${cookie}\n`, { mode: 0o600 });
      args.push("-H", `@${cookieFile}`);
    }
    if (body !== undefined) {
      const requestFile = join(dir, "request.json");
      writeFileSync(requestFile, JSON.stringify(body), { mode: 0o600 });
      args.push("-H", "Content-Type: application/json", "--data-binary", `@${requestFile}`);
    }
    writeFileSync(headerFile, "", { mode: 0o600 });
    writeFileSync(bodyFile, "", { mode: 0o600 });

    const result = spawnSync("vercel", args, {
      encoding: "utf8",
      maxBuffer: 10 * 1024 * 1024,
      timeout: cliTimeoutMs,
    });
    const headers = existsSync(headerFile) ? readFileSync(headerFile, "utf8") : "";
    const bodyText = existsSync(bodyFile) ? readFileSync(bodyFile, "utf8") : "";

    if (result.error) throw new Error(`Unable to execute Vercel CLI: ${result.error.message}`);
    if (result.status !== 0) {
      throw new Error(`vercel curl failed for ${method} ${path}: ${(result.stderr || "").trim() || bodyText.trim()}`);
    }

    const statuses = [...headers.matchAll(/^HTTP\/\S+\s+(\d{3})/gmi)].map((match) => Number(match[1]));
    const status = statuses.at(-1);
    if (!status) throw new Error(`Could not determine HTTP status for ${method} ${path}`);

    return { status, headers, bodyText, json: parseJson(bodyText) };
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}

function expectStatus(result, expected, label) {
  if (result.status !== expected) {
    throw new Error(`${label} expected HTTP ${expected}, received ${result.status}: ${result.bodyText.slice(0, 1000)}`);
  }
  return result;
}

function cookiesFrom(headers) {
  const pairs = headers
    .split(/\r?\n/)
    .filter((line) => /^set-cookie:/i.test(line))
    .map((line) => line.replace(/^set-cookie:\s*/i, "").split(";")[0])
    .filter(Boolean);
  if (!pairs.length) throw new Error("Application login did not return a session cookie.");
  return pairs.join("; ");
}

function assertReleaseIdentity() {
  const release = expectStatus(runRequest("/api/release"), 200, "Release provenance");
  if (!release.json || release.json.environment !== "preview") {
    throw new Error(`Refusing financial certification writes outside Preview. Reported environment: ${release.json?.environment ?? "unknown"}`);
  }
  if (release.json.commitSha !== expectedSha) {
    throw new Error(`Exact-head mismatch. Expected ${expectedSha}, deployment reports ${release.json?.commitSha ?? "null"}`);
  }
  if (release.json.deploymentUrl !== baseHostname) {
    throw new Error(
      `CERT_BASE_URL must identify the immutable deployment itself. Expected host ${release.json?.deploymentUrl ?? "null"}, received ${baseHostname}`,
    );
  }
  if (release.json.databaseBranchId !== expectedDatabaseBranchId) {
    throw new Error(
      `Database target mismatch. Expected ${expectedDatabaseBranchId}, deployment reports ${release.json?.databaseBranchId ?? "null"}`,
    );
  }
  return release;
}

function runFinancialWrite(path, options) {
  assertReleaseIdentity();
  return runRequest(path, { ...options, financialKey: randomUUID() });
}

const marker = `preview-cert-${new Date().toISOString().replace(/[:.]/g, "-")}-${randomUUID().slice(0, 8)}`;
const budgetSourceReference = `${marker}-budget`;
const acceptedSourceReference = `${marker}-accepted`;
const overAllocationSourceReference = `${marker}-over-allocation`;
const now = Date.now();
const day = 24 * 60 * 60 * 1000;
let cookie = "";
const pendingBudgetSources = new Set();
const pendingDeploymentSources = new Set();
const budgetIds = new Set();
const recoveredBudgetIds = new Set();
const deploymentIds = new Set();
const recoveredDeploymentIds = new Set();
let cleanupError = null;

function createTrackedFixture(path, body, pendingSources, ids) {
  assertReleaseIdentity();
  pendingSources.add(body.sourceReference);
  const result = runRequest(path, { method: "POST", cookie, body });
  if (result.status >= 200 && result.status < 300 && typeof result.json?.id === "string" && result.json.id) {
    ids.add(result.json.id);
    pendingSources.delete(body.sourceReference);
  } else if ([400, 401, 403, 404, 409].includes(result.status)) {
    pendingSources.delete(body.sourceReference);
  }
  return result;
}

function readBudgets() {
  const { json } = expectStatus(
    runRequest("/api/admin/capital/budgets", { cookie }),
    200,
    "Capital budget readback",
  );
  if (!Array.isArray(json)) throw new Error("Capital budget readback did not return a list.");
  return json;
}

function readDeployments() {
  const { json } = expectStatus(
    runRequest("/api/admin/treasury/evidence", { cookie }),
    200,
    "Treasury evidence readback",
  );
  if (!Array.isArray(json?.deployments)) throw new Error("Treasury evidence did not return a deployment list.");
  return json.deployments;
}

async function recoverCreates(label, readRows, pendingSources, ids, recoveredIds, errors) {
  let lastError;
  for (let attempt = 0; attempt < 3 && pendingSources.size; attempt++) {
    if (attempt > 0) await delay(1_000);
    try {
      const foundSources = new Set();
      for (const row of readRows()) {
        if (typeof row?.id !== "string" || !row.id || !pendingSources.has(row.sourceReference)) continue;
        ids.add(row.id);
        recoveredIds.add(row.id);
        foundSources.add(row.sourceReference);
      }
      for (const source of foundSources) pendingSources.delete(source);
      lastError = null;
    } catch (error) {
      lastError = error.message;
    }
  }
  if (pendingSources.size) {
    const detail = lastError ? ` (${lastError})` : "";
    errors.push(`${label} creation could not be reconciled: ${[...pendingSources].join(", ")}${detail}`);
  }
}

function confirmCleanup(path, body, readRows, id, isClean, label) {
  let writeError;
  try {
    const result = runFinancialWrite(path, { method: "POST", cookie, body });
    if (result.status === 200 && result.json?.id === id && isClean(result.json)) return;
    writeError = new Error(`${label} returned HTTP ${result.status} without confirming cleanup`);
  } catch (error) {
    writeError = error;
  }
  const row = readRows().find((item) => item.id === id);
  if (!isClean(row)) throw writeError;
}

function voidDeployment(id) {
  confirmCleanup(
    `/api/admin/treasury/evidence/deployment/${id}/void`,
    { reason: "Preview certification cleanup after controlled runtime verification." },
    readDeployments,
    id,
    (row) => Boolean(row?.voidedAt),
    "Deployment cleanup",
  );
}

function closeBudget(id) {
  confirmCleanup(
    `/api/admin/capital/budgets/${id}/close`,
    { certificationSourceReference: budgetSourceReference },
    readBudgets,
    id,
    (row) => row?.status === "closed",
    "Budget cleanup",
  );
}

async function safeCleanup() {
  const errors = [];

  try {
    await recoverCreates("Budget", readBudgets, pendingBudgetSources, budgetIds, recoveredBudgetIds, errors);
    await recoverCreates("Deployment", readDeployments, pendingDeploymentSources, deploymentIds, recoveredDeploymentIds, errors);

    for (const id of deploymentIds) {
      try {
        voidDeployment(id);
      } catch (error) {
        errors.push(`deployment ${id}: ${error.message}`);
      }
    }

    for (const id of budgetIds) {
      try {
        closeBudget(id);
      } catch (error) {
        errors.push(`budget ${id}: ${error.message}`);
      }
    }
  } finally {
    try {
      expectStatus(
        runRequest("/api/auth/logout", { method: "POST", cookie }),
        200,
        "Logout",
      );
      cookie = "";
    } catch (error) {
      errors.push(`logout: ${error.message}`);
    }
  }

  if (errors.length) cleanupError = new Error(errors.join("; "));
}

try {
  const release = assertReleaseIdentity();

  const login = expectStatus(runRequest("/api/auth/login", {
    method: "POST",
    body: { email: adminEmail, password: adminPassword },
  }), 200, "Application login");
  cookie = cookiesFrom(login.headers);

  const me = expectStatus(runRequest("/api/auth/me", { cookie }), 200, "Authenticated identity");
  if (!me.json) throw new Error("Application authentication did not produce an authenticated principal.");

  const budget = expectStatus(createTrackedFixture(
    "/api/admin/capital/budgets",
    {
      periodStart: new Date(now - 30 * day).toISOString(),
      periodEnd: new Date(now + 30 * day).toISOString(),
      currency,
      envelopeAmount: deploymentAmount + 4000,
      sourceReference: budgetSourceReference,
    },
    pendingBudgetSources,
    budgetIds,
  ), 201, "Capital budget creation");
  const budgetId = budget.json?.id;
  if (!budgetIds.has(budgetId)) throw new Error("Capital budget response did not contain an id.");

  const allocation = expectStatus(runFinancialWrite(`/api/admin/capital/budgets/${budgetId}/allocations`, {
    method: "POST",
    cookie,
    body: {
      channel: "referral",
      serviceInterest,
      recommendationDecision: "maintain",
      recommendationConfidence: "medium",
      recommendedAmount: deploymentAmount,
      approvedAmount: deploymentAmount,
      sourceWindow: "365d",
      recommendationSnapshot: { basis: "runtime-certification", marker, expectedSha },
      rationale: "Controlled isolated Preview certification allocation.",
    },
  }), 200, "Capital allocation creation");
  const allocationId = allocation.json?.id;
  if (!allocationId) throw new Error("Capital allocation response did not contain an id.");

  expectStatus(runFinancialWrite(`/api/admin/capital/budgets/${budgetId}/approve`, {
    method: "POST",
    cookie,
    body: {},
  }), 200, "Capital budget approval");

  const accepted = expectStatus(createTrackedFixture(
    "/api/admin/treasury/deployments",
    {
      budgetAllocationId: allocationId,
      currency,
      amount: deploymentAmount,
      category: "growth_capex",
      serviceInterest,
      occurredAt: new Date(now - 60_000).toISOString(),
      sourceReference: acceptedSourceReference,
      approvalReference: `${marker}-approved-budget`,
    },
    pendingDeploymentSources,
    deploymentIds,
  ), 201, "Valid capital deployment");
  const deploymentId = accepted.json?.id;
  if (!deploymentIds.has(deploymentId)) throw new Error("Accepted capital deployment did not contain an id.");

  const overAllocation = createTrackedFixture(
    "/api/admin/treasury/deployments",
    {
      budgetAllocationId: allocationId,
      currency,
      amount: 1,
      category: "growth_capex",
      serviceInterest,
      occurredAt: new Date(now - 30_000).toISOString(),
      sourceReference: overAllocationSourceReference,
      approvalReference: `${marker}-approved-budget`,
    },
    pendingDeploymentSources,
    deploymentIds,
  );
  const rejected = expectStatus(overAllocation, 409, "Deliberate over-allocation");

  const expectedRejection = {
    message: "Capital deployment exceeds approved allocation balance",
    approvedAmount: deploymentAmount,
    alreadyDeployed: deploymentAmount,
    remainingAmount: 0,
  };
  for (const [key, value] of Object.entries(expectedRejection)) {
    if (rejected.json?.[key] !== value) {
      throw new Error(`Over-allocation control mismatch for ${key}: expected ${value}, received ${rejected.json?.[key]}`);
    }
  }

  const observed = readDeployments().find((row) => row.id === deploymentId && !row.voidedAt);
  if (!observed) throw new Error("Accepted deployment was not present in treasury evidence readback.");

  expectStatus(
    runRequest("/api/admin/treasury/intelligence", { cookie }),
    200,
    "Treasury/ROIC intelligence readback",
  );

  voidDeployment(deploymentId);
  deploymentIds.delete(deploymentId);

  closeBudget(budgetId);
  budgetIds.delete(budgetId);

  expectStatus(runRequest("/api/auth/logout", { method: "POST", cookie }), 200, "Logout");
  cookie = "";
  assertReleaseIdentity();

  console.log(JSON.stringify({
    decision: "PASS",
    exactHead: expectedSha,
    databaseBranchId: expectedDatabaseBranchId,
    environment: release.json.environment,
    deploymentUrl: baseUrl,
    validDeploymentStatus: 201,
    overAllocationStatus: 409,
    readback: "observed",
    cleanup: "deployment_voided_budget_closed",
    marker,
  }, null, 2));
} catch (error) {
  if (cookie) await safeCleanup();

  console.error(JSON.stringify({
    decision: "FAIL",
    marker,
    budgetId: [...budgetIds][0] ?? null,
    budgetIds: [...budgetIds],
    recoveredBudgetIds: [...recoveredBudgetIds],
    deploymentIds: [...deploymentIds],
    recoveredDeploymentIds: [...recoveredDeploymentIds],
    cleanupError: cleanupError?.message ?? null,
  }, null, 2));

  if (cleanupError) {
    console.error(`Cleanup warning: ${cleanupError.message}`);
  }
  throw error;
}
