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
];
for (const key of required) {
  if (!process.env[key]) throw new Error(`Missing required environment variable: ${key}`);
}

const baseUrl = process.env.CERT_BASE_URL.replace(/\/$/, "");
const expectedSha = process.env.CERT_EXPECTED_GIT_SHA;
const adminEmail = process.env.CERT_ADMIN_EMAIL;
const adminPassword = process.env.CERT_ADMIN_PASSWORD;
const currency = (process.env.CERT_CURRENCY || "XTS").toUpperCase();
const serviceInterest = process.env.CERT_SERVICE_INTEREST || "enterprise-software";
const deploymentAmount = Number(process.env.CERT_DEPLOYMENT_AMOUNT || "16000");

if (!/^https:\/\//i.test(baseUrl)) {
  throw new Error("CERT_BASE_URL must be an HTTPS deployment URL.");
}
if (!/^[A-Z]{3}$/.test(currency)) throw new Error("CERT_CURRENCY must be a three-letter uppercase code.");
if (!Number.isFinite(deploymentAmount) || deploymentAmount <= 0) throw new Error("CERT_DEPLOYMENT_AMOUNT must be positive.");
if (!/^[0-9a-f]{40}$/i.test(expectedSha)) throw new Error("CERT_EXPECTED_GIT_SHA must be a full 40-character Git SHA.");

const cliIdentity = spawnSync("vercel", ["whoami"], { encoding: "utf8" });
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
  const args = [
    "curl", path,
    "--deployment", baseUrl,
    "--",
    "--silent", "--show-error",
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
  });
  const headers = existsSync(headerFile) ? readFileSync(headerFile, "utf8") : "";
  const bodyText = existsSync(bodyFile) ? readFileSync(bodyFile, "utf8") : "";
  rmSync(dir, { recursive: true, force: true });

  if (result.error) throw new Error(`Unable to execute Vercel CLI: ${result.error.message}`);
  if (result.status !== 0) {
    throw new Error(`vercel curl failed for ${method} ${path}: ${(result.stderr || "").trim() || bodyText.trim()}`);
  }

  const statuses = [...headers.matchAll(/^HTTP\/\S+\s+(\d{3})/gmi)].map((match) => Number(match[1]));
  const status = statuses.at(-1);
  if (!status) throw new Error(`Could not determine HTTP status for ${method} ${path}`);

  return { status, headers, bodyText, json: parseJson(bodyText) };
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

const marker = `preview-cert-${new Date().toISOString().replace(/[:.]/g, "-")}-${randomUUID().slice(0, 8)}`;
const now = Date.now();
const day = 24 * 60 * 60 * 1000;
let cookie = "";
let budgetId = null;
let deploymentId = null;
const deploymentIds = new Set();
let cleanupError = null;

function safeCleanup() {
  if (!cookie) return;
  const errors = [];

  try {
    const evidence = runRequest("/api/admin/treasury/evidence", { cookie });
    if (evidence.status === 200) {
      for (const row of evidence.json?.deployments || []) {
        if (
          row?.id &&
          !row.voidedAt &&
          typeof row.sourceReference === "string" &&
          row.sourceReference.startsWith(marker)
        ) {
          deploymentIds.add(row.id);
        }
      }
    }
  } catch (error) {
    errors.push(`evidence discovery: ${error.message}`);
  }

  for (const id of deploymentIds) {
    try {
      const voidResult = runRequest(`/api/admin/treasury/evidence/deployment/${id}/void`, {
        method: "POST",
        cookie,
        body: { reason: "Preview certification cleanup after controlled runtime verification." },
      });
      if (![200, 409].includes(voidResult.status)) {
        throw new Error(`HTTP ${voidResult.status}`);
      }
    } catch (error) {
      errors.push(`deployment ${id}: ${error.message}`);
    }
  }

  if (budgetId) {
    try {
      const closeResult = runRequest(`/api/admin/capital/budgets/${budgetId}/close`, { method: "POST", cookie });
      if (![200, 409].includes(closeResult.status)) {
        throw new Error(`HTTP ${closeResult.status}`);
      }
    } catch (error) {
      errors.push(`budget ${budgetId}: ${error.message}`);
    }
  }

  try {
    runRequest("/api/auth/logout", { method: "POST", cookie });
  } catch (error) {
    errors.push(`logout: ${error.message}`);
  }

  if (errors.length) {
    cleanupError = new Error(errors.join("; "));
  }
}

try {
  const release = expectStatus(runRequest("/api/release"), 200, "Release provenance");
  if (!release.json || release.json.environment !== "preview") {
    throw new Error(`Refusing financial certification writes outside Preview. Reported environment: ${release.json?.environment ?? "unknown"}`);
  }
  if (release.json.commitSha !== expectedSha) {
    throw new Error(`Exact-head mismatch. Expected ${expectedSha}, deployment reports ${release.json.commitSha ?? "null"}`);
  }

  const login = expectStatus(runRequest("/api/auth/login", {
    method: "POST",
    body: { email: adminEmail, password: adminPassword },
  }), 200, "Application login");
  cookie = cookiesFrom(login.headers);
  const me = expectStatus(runRequest("/api/auth/me", { cookie }), 200, "Authenticated identity");
  if (!me.json) throw new Error("Application authentication did not produce an authenticated principal.");

  const budget = expectStatus(runRequest("/api/admin/capital/budgets", {
    method: "POST", cookie,
    body: {
      periodStart: new Date(now - 30 * day).toISOString(),
      periodEnd: new Date(now + 30 * day).toISOString(),
      currency,
      envelopeAmount: deploymentAmount + 4000,
      sourceReference: `${marker}-budget`,
    },
  }), 201, "Capital budget creation");
  budgetId = budget.json?.id;
  if (!budgetId) throw new Error("Capital budget response did not contain an id.");

  const allocation = expectStatus(runRequest(`/api/admin/capital/budgets/${budgetId}/allocations`, {
    method: "POST", cookie,
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

  expectStatus(runRequest(`/api/admin/capital/budgets/${budgetId}/approve`, {
    method: "POST", cookie, body: {},
  }), 200, "Capital budget approval");

  const accepted = expectStatus(runRequest("/api/admin/treasury/deployments", {
    method: "POST", cookie,
    body: {
      budgetAllocationId: allocationId,
      currency,
      amount: deploymentAmount,
      category: "growth_capex",
      serviceInterest,
      occurredAt: new Date(now - 60_000).toISOString(),
      sourceReference: `${marker}-accepted`,
      approvalReference: `${marker}-approved-budget`,
    },
  }), 201, "Valid capital deployment");
  deploymentId = accepted.json?.id;
  if (!deploymentId) throw new Error("Accepted capital deployment did not contain an id.");
  deploymentIds.add(deploymentId);

  const overAllocation = runRequest("/api/admin/treasury/deployments", {
    method: "POST", cookie,
    body: {
      budgetAllocationId: allocationId,
      currency,
      amount: 1,
      category: "growth_capex",
      serviceInterest,
      occurredAt: new Date(now - 30_000).toISOString(),
      sourceReference: `${marker}-over-allocation`,
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

  const evidence = expectStatus(runRequest("/api/admin/treasury/evidence", { cookie }), 200, "Treasury evidence readback");
  const observed = (evidence.json?.deployments || []).find((row) => row.id === deploymentId && !row.voidedAt);
  if (!observed) throw new Error("Accepted deployment was not present in treasury evidence readback.");
  expectStatus(runRequest("/api/admin/treasury/intelligence", { cookie }), 200, "Treasury/ROIC intelligence readback");

  const voided = expectStatus(runRequest(`/api/admin/treasury/evidence/deployment/${deploymentId}/void`, {
    method: "POST", cookie,
    body: { reason: "Preview certification cleanup after controlled runtime verification." },
  }), 200, "Deployment cleanup");
  if (!voided.json?.voidedAt) throw new Error("Deployment cleanup did not record voidedAt.");
  deploymentIds.delete(deploymentId);
  deploymentId = null;

  const closed = expectStatus(runRequest(`/api/admin/capital/budgets/${budgetId}/close`, {
    method: "POST", cookie,
  }), 200, "Budget cleanup");
  if (closed.json?.status !== "closed") throw new Error("Budget cleanup did not close the certification budget.");
  budgetId = null;

  expectStatus(runRequest("/api/auth/logout", { method: "POST", cookie }), 200, "Logout");
  cookie = "";

  console.log(JSON.stringify({
    decision: "PASS",
    exactHead: expectedSha,
    environment: release.json.environment,
    deploymentUrl: baseUrl,
    validDeploymentStatus: 201,
    overAllocationStatus: 409,
    readback: "observed",
    cleanup: "deployment_voided_budget_closed",
    marker,
  }, null, 2));
} catch (error) {
  safeCleanup();
  if (cleanupError) {
    console.error(`Cleanup warning: ${cleanupError.message}`);
  }
  throw error;
}
