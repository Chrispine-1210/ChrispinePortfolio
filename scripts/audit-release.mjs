import { readFile } from "node:fs/promises";
import { spawnSync } from "node:child_process";
import { evaluateAudit } from "./audit-policy.mjs";
const lockText = await readFile(
  new URL("../package-lock.json", import.meta.url),
  "utf8",
);
const lock = JSON.parse(lockText),
  policy = JSON.parse(
    await readFile(
      new URL("../security/build-audit-exception.json", import.meta.url),
      "utf8",
    ),
  );
let failed = false;
for (const scope of ["production", "full"]) {
  const args = [
    "audit",
    "--json",
    ...(scope === "production" ? ["--omit=dev"] : []),
  ];
  const result = spawnSync(
    process.platform === "win32" ? "npm.cmd" : "npm",
    args,
    { encoding: "utf8", maxBuffer: 10 * 1024 * 1024, timeout: 60000 },
  );
  let report;
  try {
    report = JSON.parse(result.stdout);
  } catch {
    report = null;
  }
  const transportFailed =
    Boolean(result.error) || result.signal || ![0, 1].includes(result.status);
  const assessed = transportFailed
    ? {
        passed: false,
        blocked: ["Audit process failed or timed out"],
        exceptions: [],
      }
    : evaluateAudit({ report, lock, lockText, policy, scope });
  console.log(
    JSON.stringify(
      {
        scope,
        findings: report?.metadata?.vulnerabilities ?? null,
        ...assessed,
      },
      null,
      2,
    ),
  );
  if (!assessed.passed) failed = true;
}
if (failed) process.exitCode = 1;
