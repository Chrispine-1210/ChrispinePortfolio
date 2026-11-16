#!/usr/bin/env node
import { randomUUID } from "node:crypto";
import { existsSync, mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { spawnSync } from "node:child_process";

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

function runRequest(path, { method = "GET", body, cookie } = {}) {
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
    if (cookie) args.push("-H", `Cookie: ${cookie}`);
    if (body !== undefined) {
      args.push("-H", "Content-Type: application/json", "--data", JSON.stringify(body));
    }

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
  return runRequest(path, options);
}

const marker = `preview-cert-${new Date().toISOString().replace(/[:.]/g, "-")}-${randomUUID().slice(0, 8)}`;
const budgetSourceReference = `${marker}-budget`;
const acceptedSourceReference = `${marker}-accepted`;
const overAllocationSourceReference = `${marker}-over-allocation`;
const now = Date.now();
const day = 24 * 60 * 60 * 1000;
let cookie = "";
let budgetId = null;
let deploymentId = null;
const recoveredBudgetIds = new Set();
const deploymentIds = new Set();
const recoveredDeploymentIds = new Set();
let cleanupError = null;

function readBudgets() {
  return expectStatus(
    runRequest("/api/admin/capital/budgets", { cookie }),
    200,
    "Capital budget readback",
  ).json || [];
}

function readTreasuryEvidence() {
  return expectStatus(
    runRequest("/api/admin/treasury/evidence", { cookie }),
    200,
    "Treasury evidence readback",
  ).json || {};
}

function reconcileMarkerResources() {
  const errors = [];

  try {
    const budgets = readBudgets();
    for (const budget of budgets) {
      if (budget?.sourceReference === budgetSourceReference) {
        if (!budgetId) budgetId = budget.id;
        recoveredBudgetIds.add(budget.id);
      }
    }
  } catch (error) {
    errors.push(`budget recovery: ${error.message}`);
  }

  try {
    const evidence = readTreasuryEvidence();
    for (const row of evidence.deployments || []) {
      if (
        row?.id &&
        typeof row.sourceReference === "string" &&
        row.sourceReference.startsWith(marker)
      ) {
        deploymentIds.add(row.id);
        recoveredDeploymentIds.add(row.id);
      }
    }
  } catch (error) {
    errors.push(`deployment recovery: ${error.message}`);
  }

  return errors;
}

function deploymentIsVoided(id) {
  const row = (readTreasuryEvidence().deployments || []).find((item) => item.id === id);
  return Boolean(row?.voidedAt);
}

function budgetStatus(id) {
  const row = readBudgets().find((item) => item.id === id);
  return row?.status ?? null;
}

function safeCleanup() {
  if (!cookie) return;
  const errors = reconcileMarkerResources();

  try {
    for (const id of deploymentIds) {
      try {
        if (deploymentIsVoided(id)) continue;
        const voidResult = runFinancialWrite(`/api/admin/treasury/evidence/deployment/${id}/void`, {
          method: "POST",
          cookie,
          body: { reason: "Preview certification cleanup after controlled runtime verification." },
        });
        if (voidResult.status === 409) {
          if (!deploymentIsVoided(id)) {
            throw new Error(`HTTP 409 but deployment remains active`);
          }
        } else if (voidResult.status !== 200) {
          throw new Error(`HTTP ${voidResult.status}`);
        }
      } catch (error) {
        errors.push(`deployment ${id}: ${error.message}`);
      }
    }

    if (budgetId) {
      try {
        const currentStatus = budgetStatus(budgetId);
        if (currentStatus !== "closed") {
          const closeResult = runFinancialWrite(`/api/admin/capital/budgets/${budgetId}/close`, {
            method: "POST",
            cookie,
          });
          if (closeResult.status === 409) {
            const confirmedStatus = budgetStatus(budgetId);
            if (confirmedStatus !== "closed") {
              throw new Error(`HTTP 409 and budget status is ${confirmedStatus ?? "missing"}`);
            }
          } else if (closeResult.status !== 200) {
            throw new Error(`HTTP ${closeResult.status}`);
          }
        }
      } catch (error) {
        errors.push(`budget ${budgetId}: ${error.message}`);
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

  const budget = expectStatus(runFinancialWrite("/api/admin/capital/budgets", {
    method: "POST",
    cookie,
    body: {
      periodStart: new Date(now - 30 * day).toISOString(),
      periodEnd: new Date(now + 30 * day).toISOString(),
      currency,
      envelopeAmount: deploymentAmount + 4000,
      sourceReference: budgetSourceReference,
    },
  }), 201, "Capital budget creation");
  budgetId = budget.json?.id;
  if (!budgetId) throw new Error("Capital budget response did not contain an id.");

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

  const accepted = expectStatus(runFinancialWrite("/api/admin/treasury/deployments", {
    method: "POST",
    cookie,
    body: {
      budgetAllocationId: allocationId,
      currency,
      amount: deploymentAmount,
      category: "growth_capex",
      serviceInterest,
      occurredAt: new Date(now - 60_000).toISOString(),
      sourceReference: acceptedSourceReference,
      approvalReference: `${marker}-approved-budget`,
    },
  }), 201, "Valid capital deployment");
  deploymentId = accepted.json?.id;
  if (!deploymentId) throw new Error("Accepted capital deployment did not contain an id.");
  deploymentIds.add(deploymentId);

  const overAllocation = runFinancialWrite("/api/admin/treasury/deployments", {
    method: "POST",
    cookie,
    body: {
      budgetAllocationId: allocationId,
      currency,
      amount: 1,
      category: "growth_capex",
      serviceInterest,
      occurredAt: new Date(now - 30_000).toISOString(),
      sourceReference: overAllocationSourceReference,
      approvalReference: `${marker}-approved-budget`,
    },
  });
  if (overAllocation.json?.id) deploymentIds.add(overAllocation.json.id);
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

  const evidence = readTreasuryEvidence();
  const observed = (evidence.deployments || []).find((row) => row.id === deploymentId && !row.voidedAt);
  if (!observed) throw new Error("Accepted deployment was not present in treasury evidence readback.");

  expectStatus(
    runRequest("/api/admin/treasury/intelligence", { cookie }),
    200,
    "Treasury/ROIC intelligence readback",
  );

  const voided = expectStatus(runFinancialWrite(`/api/admin/treasury/evidence/deployment/${deploymentId}/void`, {
    method: "POST",
    cookie,
    body: { reason: "Preview certification cleanup after controlled runtime verification." },
  }), 200, "Deployment cleanup");
  if (!voided.json?.voidedAt) throw new Error("Deployment cleanup did not record voidedAt.");
  deploymentIds.delete(deploymentId);
  deploymentId = null;

  const closed = expectStatus(runFinancialWrite(`/api/admin/capital/budgets/${budgetId}/close`, {
    method: "POST",
    cookie,
  }), 200, "Budget cleanup");
  if (closed.json?.status !== "closed") throw new Error("Budget cleanup did not close the certification budget.");
  budgetId = null;

  expectStatus(runRequest("/api/auth/logout", { method: "POST", cookie }), 200, "Logout");
  cookie = "";

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
  if (cookie) safeCleanup();

  console.error(JSON.stringify({
    decision: "FAIL",
    marker,
    budgetId,
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
