// Run the real HTTP suite over independent native PostgreSQL sessions. External
// QA binaries/driver never become application dependencies or deployment code.
import assert from "node:assert/strict";
import { mkdtemp, rm, writeFile, readFile, mkdir, symlink, lstat } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, resolve, isAbsolute } from "node:path";
import { pathToFileURL } from "node:url";
import { spawn, spawnSync } from "node:child_process";
import { createServer } from "node:net";
import { once } from "node:events";
if (process.env.VERCEL || process.env.NODE_ENV === "production") throw Error("Native QA is local only");
const modules = process.argv[2];
if (!modules || !isAbsolute(modules)) throw Error("Supply an absolute external QA modules directory");
const bin = await import(pathToFileURL(join(modules, "@embedded-postgres/linux-x64/dist/index.js")).href);
const pg = (await import(pathToFileURL(join(modules, "pg/lib/index.js")).href)).default;
const directory = await mkdtemp(join(tmpdir(), "financial-receipt-qa-"));
const cluster = join(directory, "database"), root = process.cwd();
let server, admin, linkedDriver = false;
try {
  const localDriver = resolve("node_modules/pg");
  if (!await lstat(localDriver).catch(() => null)) {
    await symlink(join(modules, "pg"), localDriver, "dir"); linkedDriver = true;
  }
  const probe = createServer();
  await new Promise((yes, no) => { probe.once("error", no); probe.listen(0, "127.0.0.1", yes); });
  const port = probe.address().port; await new Promise(yes => probe.close(yes));
  assert.equal(spawnSync(bin.initdb, ["-D", cluster, "-U", "postgres", "--auth-local=trust", "--auth-host=trust", "--no-locale", "--encoding=UTF8"], { encoding: "utf8", timeout: 30000 }).status, 0);
  await new Promise((yes, no) => {
    const timer = setTimeout(() => no(Error("Native QA startup deadline")), 10000);
    server = spawn(bin.postgres, ["-D", cluster, "-h", "127.0.0.1", "-p", String(port), "-k", ""], { stdio: ["ignore", "ignore", "pipe"] });
    server.stderr.on("data", b => { if (String(b).includes("ready to accept connections")) { clearTimeout(timer); yes(); } });
    server.once("error", no);
  });
  admin = new pg.Client({ host: "127.0.0.1", port, user: "postgres", database: "postgres" }); await admin.connect();
  await admin.query("CREATE DATABASE financial_qa");
  const config = join(directory, "vitest.config.mts");
  await writeFile(config, `import base from ${JSON.stringify(resolve("vitest.config.ts"))};\nexport default {...base,resolve:{...base.resolve,alias:{...base.resolve.alias,pg:${JSON.stringify(join(modules, "pg/lib/index.js"))}}}};\n`);
  async function runSuite(file, reopen = false) {
    const report = join(directory, reopen ? "restart.json" : "report.json");
    const child = spawn(process.execPath, ["node_modules/vitest/vitest.mjs", "run", "--config", config, file, "--reporter=json", "--outputFile", report], {
      cwd: root, env: { ...process.env, FINANCIAL_NATIVE_PORT: String(port), FINANCIAL_NATIVE_QA: "disposable-loopback", FINANCIAL_NATIVE_REOPEN: reopen ? "1" : "0" }, stdio: ["ignore", "pipe", "pipe"],
    });
    let log = ""; child.stdout.on("data", b => { log += b; }); child.stderr.on("data", b => { log += b; });
    const timer = setTimeout(() => child.kill("SIGTERM"), 120000);
    const [code] = await once(child, "exit"); clearTimeout(timer);
    if (code !== 0) throw Error("Native financial QA failed: " + log + (await readFile(report, "utf8").catch(() => "")));
    const result = JSON.parse(await readFile(report, "utf8"));
    assert.equal(result.numFailedTests, 0); assert.equal(result.numPendingTests, 0);
    return result;
  }
  const result = await runSuite("server/financial-idempotency.test.ts");
  assert.equal(result.numPassedTests, 13);
  const reopened = await runSuite("server/financial-idempotency-restart.test.ts", true);
  assert.equal(reopened.numPassedTests, 1);
  const evidence = "docs/production-readiness/financial-idempotency-2026-11-22"; await mkdir(evidence, { recursive: true });
  const proof = { decision: "PASS", postgres: (await admin.query("SELECT version()")).rows[0].version,
    testsPassed: result.numPassedTests + reopened.numPassedTests, checks: [...result.testResults, ...reopened.testResults].flatMap(suite => suite.assertionResults.map(check => check.fullName)),
    independentSessions: true, actualProcessRestart: true, actualHttpDisconnect: true, productionDataUsed: false, githubHosted: false };
  await writeFile(join(evidence, "native-proof.json"), JSON.stringify(proof, null, 2) + "\n");
  console.log(JSON.stringify(proof));
} finally {
  await admin?.end().catch(() => {});
  if (server && server.exitCode === null) { const done = once(server, "exit"); server.kill("SIGINT"); await done; }
  await rm(directory, { recursive: true, force: true });
  if (linkedDriver) await rm(resolve("node_modules/pg"));
}
