// Independent real-session checks; disposable loopback-only PostgreSQL cluster.
import assert from "node:assert/strict";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, isAbsolute } from "node:path";
import { pathToFileURL } from "node:url";
import { spawn, spawnSync } from "node:child_process";
import { createServer } from "node:net";
import { once } from "node:events";
import { loadMigrations } from "../migrations/runner.ts";
import { schemaObjects } from "../migrations/schema.ts";
import {
  adoptionBatch,
  pendingBatch,
  databaseRolePolicy,
} from "../migrations/connector-batch.ts";
if (process.env.VERCEL || process.env.NODE_ENV === "production")
  throw Error("Native QA is local-only");
const modules = process.argv[2];
if (!modules || !isAbsolute(modules)) throw Error("Supply external QA modules");
const binaries = await import(
  pathToFileURL(join(modules, "@embedded-postgres/linux-x64/dist/index.js"))
    .href
);
const pg = (await import(pathToFileURL(join(modules, "pg/lib/index.js")).href))
  .default;
const directory = await mkdtemp(join(tmpdir(), "portfolio-role-qa-"));
const clients = [],
  checks = [];
let server;
const target = {
  environment: "test",
  branchId: "br-native-role-proof",
  database: "neondb",
  migrationRole: "portfolio_migrator",
  runtimeRole: "portfolio_runtime",
};
const files = await loadMigrations("migrations");
const evidence = "docs/production-readiness/database-adoption-2026-11-22/";
const before = JSON.parse(
    await readFile(evidence + "prefix-catalog.json", "utf8"),
  ),
  after = JSON.parse(
    await readFile(evidence + "reference-catalog.json", "utf8"),
  );
const prefix = JSON.parse(
    await readFile(evidence + "prefix-baseline.json", "utf8"),
  ),
  baseline = JSON.parse(
    await readFile(evidence + "reference-baseline.json", "utf8"),
  );
const adapter = (c) => ({
  query: (s, p) => c.query(s, p),
  exec: async (s) => {
    await c.query(s);
  },
});
try {
  const probe = createServer();
  await new Promise((yes, no) => {
    probe.once("error", no);
    probe.listen(0, "127.0.0.1", yes);
  });
  const port = probe.address().port;
  await new Promise((yes) => probe.close(yes));
  assert.equal(
    spawnSync(
      binaries.initdb,
      [
        "-D",
        directory,
        "-U",
        "postgres",
        "--auth-local=trust",
        "--auth-host=trust",
        "--no-locale",
        "--encoding=UTF8",
      ],
      { encoding: "utf8", timeout: 30000 },
    ).status,
    0,
  );
  await new Promise((yes, no) => {
    const timer = setTimeout(() => no(Error("Native startup deadline")), 10000);
    server = spawn(
      binaries.postgres,
      ["-D", directory, "-h", "127.0.0.1", "-p", String(port), "-k", ""],
      { stdio: ["ignore", "ignore", "pipe"] },
    );
    server.stderr.on("data", (b) => {
      if (String(b).includes("ready to accept connections")) {
        clearTimeout(timer);
        yes();
      }
    });
    server.once("error", no);
  });
  async function connect(user, database = "neondb") {
    const c = new pg.Client({
      host: "127.0.0.1",
      port,
      user,
      database,
      connectionTimeoutMillis: 5000,
    });
    await c.connect();
    clients.push(c);
    return c;
  }
  const admin = await connect("postgres", "postgres");
  await admin.query(
    "CREATE ROLE portfolio_migrator LOGIN; CREATE ROLE portfolio_runtime LOGIN",
  );
  await admin.query("CREATE DATABASE neondb");
  await admin.query(
    "ALTER DATABASE neondb SET neon.branch_id='br-native-role-proof'",
  );
  const owner = await connect("postgres");
  for (const f of files.slice(0, -1)) await owner.query(f.sql);
  await owner.query(
    "INSERT INTO users(id,email) VALUES('role-proof-user','synthetic-role-proof@test.invalid')",
  );
  await owner.query(databaseRolePolicy(target));
  checks.push(
    "separate role policy configured without superuser/create-role/create-db authority",
  );
  const migrator = await connect(target.migrationRole),
    runtime = await connect(target.runtimeRole);
  const secondOperator = await connect("postgres");
  assert.deepEqual(await schemaObjects(adapter(migrator)), before);
  const adopt = adoptionBatch(target, files.slice(0, -1), prefix, before);
  await migrator.query(adopt);
  await migrator.query(adopt);
  assert.equal(
    (
      await migrator.query(
        "SELECT count(*)::int n FROM chrispine_migrations.history",
      )
    ).rows[0].n,
    11,
  );
  checks.push(
    "exact structural baseline adopted once with source checksums; repeated adoption did not replay data",
  );
  for (const statement of [
    "CREATE TABLE public.forbidden_ddl(id int)",
    "CREATE ROLE forbidden_role",
    "ALTER TABLE public.cash_collections ADD COLUMN forbidden int",
    "DELETE FROM public.cash_collections WHERE false",
    "TRUNCATE public.audit_events",
    "UPDATE public.audit_events SET action=action WHERE false",
    "SELECT * FROM chrispine_migrations.history",
  ])
    await assert.rejects(runtime.query(statement), (e) => e.code === "42501");
  assert.equal(
    (
      await runtime.query(
        "UPDATE users SET first_name='Synthetic QA' WHERE id='role-proof-user' RETURNING id",
      )
    ).rowCount,
    1,
  );
  checks.push(
    "runtime DML allowed; DDL, role creation, financial deletion, audit mutation, truncate and journal reads denied",
  );
  await assert.rejects(runtime.query(adopt), /TARGET_MISMATCH/);
  await assert.rejects(
    migrator.query(
      adoptionBatch(
        { ...target, branchId: "br-wrong-branch" },
        files.slice(0, -1),
        prefix,
        before,
      ),
    ),
    /TARGET_MISMATCH/,
  );
  checks.push("wrong role and actual branch identity denied");
  await owner.query(
    "BEGIN; SELECT pg_advisory_xact_lock(1129337650,1296648018)",
  );
  try {
    await assert.rejects(migrator.query(adopt), /MIGRATION_BUSY/);
    await assert.rejects(secondOperator.query(databaseRolePolicy(target)), /MIGRATION_BUSY/);
  } finally {
    await owner.query("ROLLBACK");
  }
  checks.push(
    "separate migration and role-policy sessions refused while operator held the shared lock",
  );
  await assert.rejects(
    migrator.query(
      pendingBatch(target, files.slice(0, -1), files.slice(-1), before, []),
    ),
    /RESULT_SCHEMA_MISMATCH/,
  );
  assert.equal(
    (
      await owner.query(
        "SELECT to_regclass('public.engineering_records') AS relation",
      )
    ).rows[0].relation,
    null,
  );
  checks.push(
    "failed post-migration verification rolled schema and history back atomically",
  );
  await migrator.query(
    pendingBatch(target, files.slice(0, -1), files.slice(-1), before, after),
  );
  assert.deepEqual(await schemaObjects(adapter(migrator)), after);
  assert.equal(
    (
      await migrator.query(
        "SELECT count(*)::int n FROM chrispine_migrations.history",
      )
    ).rows[0].n,
    12,
  );
  await migrator.query(adoptionBatch(target, files, baseline, after));
  checks.push(
    "pending source migration applied atomically and subsequent complete adoption was a no-op",
  );
  assert.equal(
    (await runtime.query("SELECT count(*)::int n FROM engineering_records"))
      .rows[0].n,
    0,
  );
  assert.equal(
    (
      await runtime.query(
        "SELECT has_table_privilege(current_user,'engineering_records','INSERT') AS allowed",
      )
    ).rows[0].allowed,
    true,
  );
  checks.push(
    "new migration-owned tables inherited runtime read/write privileges",
  );
  assert.equal(
    (
      await runtime.query(
        "SELECT has_table_privilege(current_user,'engineering_versions','UPDATE') AS allowed",
      )
    ).rows[0].allowed,
    false,
  );
  checks.push(
    "new immutable history tables excluded from runtime mutation privileges",
  );
  const result = {
    decision: "PASS",
    postgres: (await owner.query("SELECT version()")).rows[0].version,
    target,
    checks,
    productionDataUsed: false,
  };
  await writeFile(
    evidence + "native-role-proof.json",
    JSON.stringify(result, null, 2) + "\n",
  );
  console.log(JSON.stringify(result));
} finally {
  for (const c of clients.reverse()) await c.end().catch(() => {});
  if (server && server.exitCode === null) {
    const done = once(server, "exit");
    server.kill("SIGINT");
    await done;
  }
  await rm(directory, { recursive: true, force: true });
}
