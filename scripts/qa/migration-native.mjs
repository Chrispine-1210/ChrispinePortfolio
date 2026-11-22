// Optional independent verification. Install tooling outside the app:
// npm install --prefix /tmp/portfolio-pg-qa --no-save @embedded-postgres/linux-x64 pg
// node --import tsx scripts/qa/migration-native.mjs /tmp/portfolio-pg-qa/node_modules
import assert from "node:assert/strict";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, isAbsolute } from "node:path";
import { pathToFileURL } from "node:url";
import { spawn, spawnSync } from "node:child_process";
import { createServer } from "node:net";
import { once } from "node:events";
import { loadMigrations, runMigrations } from "../migrations/runner.ts";
import { migrationTarget } from "../migrations/config.ts";
import { schemaObjects, canonicalJson } from "../migrations/schema.ts";

if (process.env.VERCEL || process.env.NODE_ENV === "production") throw new Error("Native migration fixtures are local-only");
const modules = process.argv[2];
if (!modules || !isAbsolute(modules)) throw new Error("Supply an absolute directory containing the external QA tooling node_modules");
const binaries = await import(pathToFileURL(join(modules, "@embedded-postgres/linux-x64/dist/index.js")).href);
const pg = (await import(pathToFileURL(join(modules, "pg/lib/index.js")).href)).default;
const directory = await mkdtemp(join(tmpdir(), "portfolio-migration-native-"));
const clients = [];
let server;
const checks = [];

function adapter(client) {
  return { query: (sql, params) => client.query(sql, params), exec: async sql => { await client.query(sql); } };
}
async function connect(config) {
  const client = new pg.Client({ host: "127.0.0.1", connectionTimeoutMillis: 5000, ...config });
  clients.push(client); await client.connect(); return client;
}
async function deadline(promise, milliseconds) {
  let timer;
  try { return await Promise.race([promise, new Promise((_, reject) => { timer = setTimeout(() => reject(new Error("Native verification deadline exceeded")), milliseconds); })]); }
  finally { clearTimeout(timer); }
}

try {
  const portServer = createServer();
  await new Promise((resolve, reject) => { portServer.once("error", reject); portServer.listen(0, "127.0.0.1", resolve); });
  const port = portServer.address().port;
  await new Promise(resolve => portServer.close(resolve));
  const initialised = spawnSync(binaries.initdb, ["-D", directory, "-U", "postgres", "--auth-local=trust", "--auth-host=trust", "--no-locale", "--encoding=UTF8"], { encoding: "utf8", timeout: 30_000 });
  assert.equal(initialised.status, 0, "Native initdb failed");
  let ready;
  let fail;
  const listening = new Promise((resolve, reject) => { ready = resolve; fail = reject; });
  server = spawn(binaries.postgres, ["-D", directory, "-h", "127.0.0.1", "-p", String(port), "-k", ""], { stdio: ["ignore", "ignore", "pipe"] });
  server.stderr.on("data", chunk => { if (String(chunk).includes("ready to accept connections")) ready(); });
  server.once("error", fail);
  server.once("exit", code => { if (code !== 0) fail(new Error("Native server exited before verification")); });
  await deadline(listening, 10_000);

  const owner = await connect({ port, user: "postgres", database: "postgres" });
  const version = (await owner.query("SELECT version() AS version")).rows[0].version;
  await owner.query("CREATE ROLE migrator LOGIN; CREATE ROLE app_runtime NOLOGIN");
  await owner.query("CREATE DATABASE neondb OWNER migrator");
  // Synthetic identity fixture, not evidence of a live Neon database identity.
  await owner.query("ALTER DATABASE neondb SET neon.branch_id='br-fixture-migrations'");
  const a = await connect({ port, user: "migrator", database: "neondb" });
  const b = await connect({ port, user: "migrator", database: "neondb" });
  const target = migrationTarget({
    APP_DATABASE_URL: `postgres://app_runtime@127.0.0.1:${port}/neondb`,
    MIGRATION_DATABASE_URL: `postgres://migrator@127.0.0.1:${port}/neondb`,
    MIGRATION_ENVIRONMENT: "test", MIGRATION_EXPECTED_BRANCH_ID: "br-fixture-migrations",
    MIGRATION_EXPECTED_DATABASE: "neondb", MIGRATION_EXPECTED_ROLE: "migrator",
  });
  const files = await loadMigrations("migrations");
  const planned = await runMigrations(adapter(a), target, files, { mode: "plan" });
  assert.equal(planned.needsBaseline, false);
  assert.equal((await a.query("SELECT to_regclass('chrispine_migrations.history') AS journal")).rows[0].journal, null);
  checks.push("read-only plan created no journal");

  let entered;
  let failed;
  let release;
  const enteredLock = new Promise((resolve, reject) => { entered = resolve; failed = reject; });
  const holdLock = new Promise(resolve => { release = resolve; });
  const firstAdapter = adapter(a);
  const first = runMigrations({ ...firstAdapter, query: async (sql, params) => {
    const result = await firstAdapter.query(sql, params);
    if (sql.includes("pg_try_advisory_xact_lock") && result.rows[0].acquired) { entered(); await holdLock; }
    return result;
  } }, target, files, { mode: "apply" });
  first.catch(failed);
  try {
    await deadline(enteredLock, 10_000);
    await assert.rejects(runMigrations(adapter(b), target, files, { mode: "apply" }), { code: "MIGRATION_BUSY" });
    checks.push("second real runner refused while first held the transaction lock");
  } finally { release(); }
  const applied = await first;
  assert.equal(applied.appliedNow, files.length);
  assert.equal((await runMigrations(adapter(b), target, files, { mode: "apply" })).appliedNow, 0);
  checks.push("all repository migrations applied once, and restart replay applied zero");

  const baseline = await runMigrations(adapter(a), target, files, { mode: "export-baseline" });
  await owner.query("CREATE DATABASE legacy_clone OWNER migrator");
  await owner.query("ALTER DATABASE legacy_clone SET neon.branch_id='br-fixture-migrations'");
  const legacy = await connect({ port, user: "migrator", database: "legacy_clone" });
  for (const file of files) await legacy.query(file.sql);
  const legacyTarget = { ...target, database: "legacy_clone" };
  await assert.rejects(runMigrations(adapter(legacy), legacyTarget, files, { mode: "apply" }), { code: "BASELINE_REQUIRED" });
  let adopted;
  try { adopted = await runMigrations(adapter(legacy), legacyTarget, files, { mode: "apply", baseline }); }
  catch (error) {
    // Synthetic schemas only: retain the precise differences behind a refusal.
    const snapshots = [];
    for (const client of [a,legacy]) {
      await client.query("BEGIN READ ONLY; SET LOCAL search_path=public,pg_catalog");
      try { snapshots.push(await schemaObjects(adapter(client))); } finally { await client.query("ROLLBACK"); }
    }
    const [reference,existing] = snapshots.map(rows => new Map(rows.map(row => [`${row.kind}:${row.key}`,row.definition])));
    console.error(JSON.stringify({ baselineDifferences: [...new Set([...reference.keys(),...existing.keys()])].filter(key => canonicalJson(reference.get(key))!==canonicalJson(existing.get(key))).slice(0,10)
      .map(key=>({key,reference:reference.get(key),existing:existing.get(key)})) },null,2));
    throw error;
  }
  assert.equal(adopted.appliedNow, 0);
  assert.equal(adopted.baselined, files.length);
  checks.push("matching legacy schema adopted through reference comparison without replay");
  process.stdout.write(JSON.stringify({ passed: true, version, migrationFiles: files.length, checks, productionChanges: false }, null, 2) + "\n");
} finally {
  for (const client of clients.reverse()) await client.end().catch(() => {});
  if (server?.exitCode === null) { const stopped = once(server, "exit"); server.kill("SIGTERM"); await deadline(stopped, 10_000); }
  await rm(directory, { recursive: true, force: true });
}
