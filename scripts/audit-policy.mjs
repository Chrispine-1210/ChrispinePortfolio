import { createHash } from "node:crypto";
const ranks = { info: 0, low: 1, moderate: 2, high: 3, critical: 4 };
const knownAdvisory = "https://github.com/advisories/GHSA-fc5q-39xc-vjpf";
export const lockDigest = (text) =>
  createHash("sha256").update(text).digest("hex");

// Fail closed on unsupported reports, unidentified paths, changed locks and new advisories.
export function evaluateAudit({
  report,
  lock,
  lockText,
  policy,
  scope,
  now = new Date(),
}) {
  const blocked = [],
    exceptions = [];
  if (
    !report ||
    report.error ||
    report.auditReportVersion !== 2 ||
    !report.vulnerabilities ||
    typeof report.vulnerabilities !== "object"
  ) {
    return {
      passed: false,
      blocked: ["Audit report unavailable or invalid"],
      exceptions,
    };
  }
  const graph = report.vulnerabilities;
  const totals = report.metadata?.vulnerabilities;
  if (
    Array.isArray(graph) ||
    !totals ||
    !Number.isInteger(totals.high) ||
    !Number.isInteger(totals.critical) ||
    totals.high !==
      Object.values(graph).filter((v) => v?.severity === "high").length ||
    totals.critical !==
      Object.values(graph).filter((v) => v?.severity === "critical").length
  ) {
    return {
      passed: false,
      blocked: ["Audit severity totals are missing or inconsistent"],
      exceptions,
    };
  }
  function leaves(name, visiting = new Set()) {
    if (
      visiting.has(name) ||
      !graph[name] ||
      !Array.isArray(graph[name].via) ||
      !graph[name].via.length
    )
      return null;
    const next = new Set(visiting).add(name),
      found = [];
    for (const via of graph[name].via) {
      if (typeof via === "string") {
        const child = leaves(via, next);
        if (!child) return null;
        found.push(...child);
      } else if (via && typeof via === "object" && typeof via.url === "string")
        found.push(via.url);
      else return null;
    }
    return found;
  }
  const acceptedAt = Date.parse(policy?.approvedAt ?? ""),
    expiry = Date.parse(policy?.expiresAt ?? "");
  const accepted =
    policy?.status === "approved" &&
    typeof policy.approvedBy === "string" &&
    policy.approvedBy.trim().length > 0 &&
    Number.isFinite(acceptedAt) &&
    Number.isFinite(expiry) &&
    acceptedAt <= now.getTime() &&
    now.getTime() < expiry &&
    expiry - acceptedAt <= 7 * 86400000 &&
    policy.advisory === knownAdvisory &&
    policy.lockSha256 === lockDigest(lockText);
  for (const [name, v] of Object.entries(graph)) {
    if (!(v.severity in ranks)) {
      blocked.push(`${name}: unknown severity`);
      continue;
    }
    if (ranks[v.severity] < ranks.high) continue;
    const paths = Array.isArray(v.nodes) ? v.nodes : [],
      advisories = leaves(name);
    const devOnly =
      paths.length > 0 && paths.every((p) => lock.packages?.[p]?.dev === true);
    const specific =
      advisories?.length > 0 &&
      advisories.every((url) => url === knownAdvisory);
    if (
      scope === "full" &&
      accepted &&
      devOnly &&
      specific &&
      v.severity === "high"
    )
      exceptions.push({
        package: name,
        advisory: knownAdvisory,
        scope: "development-only",
        expiresAt: policy.expiresAt,
      });
    else
      blocked.push(
        `${name}: ${v.severity}${scope === "full" && devOnly && specific ? " (build-only exception is absent, unapproved, expired or not bound to this lockfile)" : ""}`,
      );
  }
  return { passed: blocked.length === 0, blocked, exceptions };
}
