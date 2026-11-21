import { describe, expect, it } from "vitest";
// @ts-expect-error The audit policy is an executable JavaScript module.
import { evaluateAudit, lockDigest } from "../scripts/audit-policy.mjs";
const url = "https://github.com/advisories/GHSA-fc5q-39xc-vjpf";
const lock = {
    packages: {
      "node_modules/picomatch": { dev: true },
      "node_modules/vite": { dev: true },
    },
  },
  lockText = JSON.stringify(lock),
  now = new Date("2026-11-18T12:00:00Z");
const report = {
  auditReportVersion: 2,
  metadata: { vulnerabilities: { high: 2, critical: 0 } },
  vulnerabilities: {
    picomatch: {
      severity: "high",
      via: [{ url }],
      nodes: ["node_modules/picomatch"],
    },
    vite: {
      severity: "high",
      via: ["picomatch"],
      nodes: ["node_modules/vite"],
    },
  },
};
const policy = {
  status: "approved",
  advisory: url,
  approvedBy: "Synthetic test approver",
  approvedAt: "2026-11-18T08:00:00Z",
  expiresAt: "2026-11-25T00:00:00Z",
  lockSha256: lockDigest(lockText),
};
const assess = (patch = {}) =>
  evaluateAudit({
    report,
    lock,
    lockText,
    policy,
    scope: "full",
    now,
    ...patch,
  });
describe("narrow build-audit decision boundary", () => {
  it("keeps the proposed policy closed until explicit approval", () => {
    expect(
      assess({
        policy: {
          ...policy,
          status: "proposed",
          approvedBy: null,
          approvedAt: null,
        },
      }).passed,
    ).toBe(false);
  });
  it("permits only the one approved advisory through a strictly dev-only graph", () => {
    const r = assess();
    expect(r.passed).toBe(true);
    expect(r.exceptions).toHaveLength(2);
  });
  it("never grants an exception to the production audit", () => {
    expect(assess({ scope: "production" }).passed).toBe(false);
  });
  it("rejects a runtime path, unknown path and missing node list", () => {
    for (const bad of [
      {
        packages: {
          "node_modules/picomatch": {},
          "node_modules/vite": { dev: true },
        },
      },
      { packages: {} },
    ])
      expect(
        assess({
          lock: bad,
          lockText: JSON.stringify(bad),
          policy: { ...policy, lockSha256: lockDigest(JSON.stringify(bad)) },
        }).passed,
      ).toBe(false);
    expect(
      assess({
        report: {
          ...report,
          vulnerabilities: {
            picomatch: { ...report.vulnerabilities.picomatch, nodes: [] },
          },
        },
      }).passed,
    ).toBe(false);
  });
  it("fails after expiry, before approval, on a changed lock or an excessive approval duration", () => {
    for (const p of [
      { ...policy, expiresAt: "2026-11-18T10:00:00Z" },
      { ...policy, approvedAt: "2026-11-18T13:00:00Z" },
      { ...policy, lockSha256: "bad" },
      { ...policy, expiresAt: "2026-12-01T00:00:00Z" },
    ])
      expect(assess({ policy: p }).passed).toBe(false);
  });
  it("does not exempt another advisory or a critical severity", () => {
    for (const p of [
      {
        ...report.vulnerabilities.picomatch,
        via: [{ url: "https://github.com/advisories/GHSA-other-advisory" }],
      },
      { ...report.vulnerabilities.picomatch, severity: "critical" },
    ])
      expect(
        assess({
          report: {
            ...report,
            vulnerabilities: { ...report.vulnerabilities, picomatch: p },
          },
        }).passed,
      ).toBe(false);
  });
  it("rejects incomplete audit responses and missing dependency provenance", () => {
    for (const r of [
      null,
      { error: { code: "EAI_AGAIN" } },
      { auditReportVersion: 1, vulnerabilities: {} },
      {
        auditReportVersion: 2,
        vulnerabilities: {
          vite: {
            severity: "high",
            via: ["missing"],
            nodes: ["node_modules/vite"],
          },
        },
      },
    ])
      expect(assess({ report: r }).passed).toBe(false);
  });
  it("still passes an independently clean runtime audit", () => {
    expect(
      assess({
        scope: "production",
        policy: { status: "proposed" },
        report: {
          auditReportVersion: 2,
          metadata: { vulnerabilities: { high: 0, critical: 0 } },
          vulnerabilities: {},
        },
      }).passed,
    ).toBe(true);
  });
});
