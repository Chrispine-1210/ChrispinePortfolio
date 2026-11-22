import { PGlite } from "@electric-sql/pglite";
import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { afterEach, describe, expect, it, vi } from "vitest";
import { migrationTarget, productionBranchId, type MigrationTarget } from "../scripts/migrations/config.js";
import { loadMigrations, runMigrations, type MigrationClient, type MigrationFile } from "../scripts/migrations/runner.js";
import { schemaIdentity, schemaObjects, sha256 } from "../scripts/migrations/schema.js";
import { runtimeDatabaseUrl } from "../shared/database-target.js";

const environment = {
  APP_DATABASE_URL: "postgres://app_runtime:runtime-secret@ep-fixture-pooler.example.neon.tech/neondb?sslmode=require",
  DATABASE_URL: "postgres://old_owner:old-secret@ep-old.example.neon.tech/neondb",
  MIGRATION_DATABASE_URL: "postgres://migrator:migration-secret@ep-fixture.example.neon.tech/neondb?sslmode=require",
  MIGRATION_ENVIRONMENT: "preview", MIGRATION_EXPECTED_BRANCH_ID: "br-fixture-migrations",
  MIGRATION_EXPECTED_DATABASE: "neondb", MIGRATION_EXPECTED_ROLE: "migrator",
};

describe("migration target boundary", () => {
  it("uses the runtime APP_DATABASE_URL precedence and accepts the same direct endpoint with a different role", () => {
    expect(runtimeDatabaseUrl(environment)).toBe(environment.APP_DATABASE_URL);
    expect(migrationTarget(environment)).toMatchObject({ branchId: "br-fixture-migrations", runtimeRole: "app_runtime", migrationRole: "migrator" });
    expect(() => migrationTarget({ ...environment, APP_DATABASE_URL: undefined })).toThrow(/targets differ/);
  });
  it.each(["MIGRATION_DATABASE_URL", "MIGRATION_ENVIRONMENT", "MIGRATION_EXPECTED_BRANCH_ID", "MIGRATION_EXPECTED_DATABASE", "MIGRATION_EXPECTED_ROLE"])("requires explicit %s", key => {
    expect(() => migrationTarget({ ...environment, [key]: undefined })).toThrow(/explicitly configured/);
  });
  it("rejects a pooler, changed target, reused runtime role and unsafe connection options before opening a connection", () => {
    for (const url of [environment.APP_DATABASE_URL,
      "postgres://migrator:migration-secret@ep-other.example.neon.tech/neondb",
      "postgres://app_runtime:migration-secret@ep-fixture.example.neon.tech/neondb",
      environment.MIGRATION_DATABASE_URL + "&options=-c%20search_path%3Devil",
      "postgres://migrator:migration-secret@ep-fixture.example.neon.tech/neondb?sslmode=disable"]) {
      expect(() => migrationTarget({ ...environment, MIGRATION_DATABASE_URL: url })).toThrow();
    }
  });
  it("refuses a production branch under Preview or a hosting-environment mismatch", () => {
    expect(() => migrationTarget({ ...environment, MIGRATION_EXPECTED_BRANCH_ID: productionBranchId })).toThrow(/production branch boundary/);
    expect(() => migrationTarget({ ...environment, MIGRATION_ENVIRONMENT: "production" })).toThrow(/production branch boundary/);
    expect(() => migrationTarget({ ...environment, VERCEL_ENV: "production" })).toThrow(/hosting environment/);
  });
  it("keeps connection secrets out of configuration errors", () => {
    try { migrationTarget({ ...environment, MIGRATION_DATABASE_URL: "bad://user:private-password@db" }); throw new Error("expected refusal"); }
    catch (error) { expect(String(error)).not.toMatch(/private-password|runtime-secret|migration-secret/); }
  });
});

const databases: PGlite[] = [];
afterEach(async () => { for (const db of databases.splice(0)) await db.close(); });
function file(name: string, sql: string): MigrationFile { return { file: name, sha256: sha256(sql), sql }; }
const files = [file("0000_fixture.sql", "CREATE TABLE ledger (id int PRIMARY KEY, amount int NOT NULL CHECK(amount>=0)); INSERT INTO ledger VALUES (1,10);"),
  file("0001_fixture.sql", "ALTER TABLE ledger ADD COLUMN note text DEFAULT 'reviewed';")];

async function fixture() {
  const database = new PGlite(); databases.push(database);
  await database.exec("CREATE ROLE app_runtime; SET neon.branch_id='br-fixture-migrations';");
  const client: MigrationClient = { query: (sql, params) => database.query(sql, params), exec: async sql => { await database.exec(sql); } };
  const target: MigrationTarget = { ...migrationTarget(environment), database: "postgres", migrationRole: "postgres" };
  return { database, client, target };
}
async function journalExists(db: PGlite) { return (await db.query("SELECT to_regclass('chrispine_migrations.history') AS journal")).rows[0]; }

describe("transactional migration history", () => {
  it("refuses malformed filenames or duplicate versions rather than silently omitting SQL", async () => {
    for (const names of [["0000_valid.sql", "12_omitted.sql"], ["0000_first.sql", "0000_second.sql"]]) {
      const directory = await mkdtemp(join(tmpdir(), "portfolio-migration-files-"));
      try {
        for (const name of names) await writeFile(join(directory, name), "SELECT 1;");
        await expect(loadMigrations(directory)).rejects.toMatchObject({ code: "INVALID_MIGRATIONS" });
      } finally { await rm(directory, { recursive: true, force: true }); }
    }
  });
  it("plans a fresh database without creating any journal or application table", async () => {
    const { database, client, target } = await fixture();
    expect(await runMigrations(client, target, files, { mode: "plan" })).toMatchObject({ applied: 0, needsBaseline: false, pending: files.map(f => f.file) });
    expect(await journalExists(database)).toEqual({ journal: null });
    expect((await database.query("SELECT to_regclass('public.ledger') AS ledger")).rows[0]).toEqual({ ledger: null });
  });
  it.each(["branchId", "database", "migrationRole"])("refuses an actual %s mismatch before DDL", async field => {
    const { database, client, target } = await fixture();
    await expect(runMigrations(client, { ...target, [field]: "wrong-target" }, files, { mode: "apply" })).rejects.toMatchObject({ code: "TARGET_MISMATCH" });
    expect(await journalExists(database)).toEqual({ journal: null });
  });
  it("refuses a runtime role that can create privileged roles", async () => {
    const { database, client, target } = await fixture();
    await database.exec("ALTER ROLE app_runtime CREATEROLE;");
    await expect(runMigrations(client, target, files, { mode: "apply" })).rejects.toMatchObject({ code: "ROLE_SEPARATION_REQUIRED" });
    expect(await journalExists(database)).toEqual({ journal: null });
  });
  it("refuses a busy migration lock without creating schema", async () => {
    const { database, client, target } = await fixture();
    const query = client.query.bind(client);
    client.query = async (sql, params) => sql.includes("pg_try_advisory_xact_lock") ? { rows: [{ acquired: false }] } : query(sql, params);
    await expect(runMigrations(client, target, files, { mode: "apply" })).rejects.toMatchObject({ code: "MIGRATION_BUSY" });
    expect(await journalExists(database)).toEqual({ journal: null });
  });
  it("applies once, never replays data seeds, and keeps the journal inaccessible to the runtime role", async () => {
    const { database, client, target } = await fixture();
    expect(await runMigrations(client, target, files, { mode: "apply" })).toMatchObject({ appliedNow: 2 });
    expect(await runMigrations(client, target, files, { mode: "apply" })).toMatchObject({ appliedNow: 0 });
    expect((await database.query("SELECT id,amount,note FROM ledger")).rows).toEqual([{ id: 1, amount: 10, note: "reviewed" }]);
    await database.exec("SET ROLE app_runtime;");
    try { await expect(database.query("SELECT * FROM chrispine_migrations.history")).rejects.toMatchObject({ code: "42501" }); }
    finally { await database.exec("RESET ROLE"); }
  });
  it("rejects modified or missing applied files before any pending SQL", async () => {
    const { database, client, target } = await fixture();
    await runMigrations(client, target, files, { mode: "apply" });
    const extra = file("0002_new.sql", "CREATE TABLE should_not_exist (id int);");
    for (const changed of [[file(files[0].file, files[0].sql + " -- changed"), files[1], extra], [files[0], extra]]) {
      await expect(runMigrations(client, target, changed, { mode: "apply" })).rejects.toMatchObject({ code: "HISTORY_MISMATCH" });
    }
    expect((await database.query("SELECT to_regclass('public.should_not_exist') AS pending")).rows[0]).toEqual({ pending: null });
  });
  it("rolls back schema, seeded data and journal entries when a later migration fails", async () => {
    const { database, client, target } = await fixture();
    const bad = file("0002_bad.sql", "INSERT INTO ledger VALUES (2,-10,'private password=fixture-secret');");
    await expect(runMigrations(client, target, [...files, bad], { mode: "apply" })).rejects.toMatchObject({ code: "MIGRATION_FAILED" });
    expect(await journalExists(database)).toEqual({ journal: null });
    expect((await database.query("SELECT to_regclass('public.ledger') AS ledger")).rows[0]).toEqual({ ledger: null });
  });
  it("rolls back pending schema when its journal insert fails, preserving previously applied history", async () => {
    const { database, client, target } = await fixture();
    await runMigrations(client, target, files, { mode: "apply" });
    const original = client.query.bind(client);
    client.query = async (sql, params) => {
      if (sql.startsWith("INSERT INTO chrispine_migrations.history")) throw new Error("private password=fixture-secret");
      return original(sql, params);
    };
    await expect(runMigrations(client, target, [...files, file("0002_pending.sql", "ALTER TABLE ledger ADD COLUMN pending int;")], { mode: "apply" }))
      .rejects.toMatchObject({ code: "MIGRATION_FAILED" });
    expect((await database.query("SELECT count(*)::int AS total FROM chrispine_migrations.history")).rows).toEqual([{ total: 2 }]);
    expect((await database.query("SELECT column_name FROM information_schema.columns WHERE table_name='ledger' AND column_name='pending'")).rows).toEqual([]);
  });
  it("reconciles an uncertain commit through the journal without replaying already committed data", async () => {
    const { database, client, target } = await fixture();
    const exec = client.exec.bind(client);
    let loseResponse = true;
    client.exec = async sql => { await exec(sql); if (sql === "COMMIT" && loseResponse) { loseResponse = false; throw new Error("lost commit response"); } };
    await expect(runMigrations(client, target, files, { mode: "apply" })).rejects.toMatchObject({ code: "MIGRATION_FAILED" });
    expect(await runMigrations(client, target, files, { mode: "apply" })).toMatchObject({ appliedNow: 0 });
    expect((await database.query("SELECT count(*)::int AS total FROM ledger")).rows).toEqual([{ total: 1 }]);
  });
  it.each(["COMMIT;", "-- comment\rCOMMIT;", "ROLLBACK;", "SELECT '\\'; COMMIT; -- '"])("rejects transaction-control SQL: %s", async sql => {
    const { client, target } = await fixture();
    const exec = vi.spyOn(client, "exec");
    await expect(runMigrations(client, target, [file("0000_unsafe.sql", sql)], { mode: "apply" })).rejects.toMatchObject({ code: "TRANSACTION_CONTROL_FORBIDDEN" });
    expect(exec).not.toHaveBeenCalled();
  });
});

describe("reviewed adoption of existing schema", () => {
  it("refuses blind replay and never self-certifies an unjournaled database", async () => {
    const { database, client, target } = await fixture();
    for (const migration of files) await client.exec(migration.sql);
    expect(await runMigrations(client, target, files, { mode: "plan" })).toMatchObject({ needsBaseline: true });
    await expect(runMigrations(client, target, files, { mode: "apply" })).rejects.toMatchObject({ code: "BASELINE_REQUIRED" });
    await expect(runMigrations(client, target, files, { mode: "export-baseline" })).rejects.toMatchObject({ code: "REFERENCE_REQUIRED" });
    expect(await journalExists(database)).toEqual({ journal: null });
    expect((await database.query("SELECT count(*)::int AS total FROM ledger")).rows).toEqual([{ total: 1 }]);
  });
  it("compares schema and every file checksum, then records the baseline without replaying SQL", async () => {
    const reference = await fixture();
    await runMigrations(reference.client, reference.target, files, { mode: "apply" });
    const baseline = await runMigrations(reference.client, reference.target, files, { mode: "export-baseline" });
    const clone = await fixture();
    for (const migration of files) await clone.client.exec(migration.sql);
    const before = await schemaIdentity(clone.client);
    expect(await runMigrations(clone.client, clone.target, files, { mode: "plan", baseline })).toMatchObject({ action: "baseline", needsBaseline: false });
    expect(await journalExists(clone.database)).toEqual({ journal: null });
    expect(await runMigrations(clone.client, clone.target, files, { mode: "apply", baseline })).toMatchObject({ appliedNow: 0, baselined: 2 });
    expect(await schemaIdentity(clone.client)).toEqual(before);
    expect((await clone.database.query("SELECT count(*)::int AS total FROM ledger")).rows).toEqual([{ total: 1 }]);
    expect((await clone.database.query("SELECT DISTINCT origin FROM chrispine_migrations.history")).rows).toEqual([{ origin: "baseline" }]);
    await expect(runMigrations(clone.client, clone.target, files, { mode: "export-baseline" })).rejects.toMatchObject({ code: "REFERENCE_REQUIRED" });
  });
  it("refuses a changed column or modified baseline checksum without writing history", async () => {
    const reference = await fixture();
    await runMigrations(reference.client, reference.target, files, { mode: "apply" });
    const baseline = await runMigrations(reference.client, reference.target, files, { mode: "export-baseline" });
    const clone = await fixture();
    for (const migration of files) await clone.client.exec(migration.sql);
    await expect(runMigrations(clone.client, clone.target, files, { mode: "apply", baseline: {
      ...baseline, migrations: files.map(({ file }) => ({ file, sha256: "0".repeat(64) })),
    } })).rejects.toMatchObject({ code: "BASELINE_MISMATCH" });
    await clone.client.exec("ALTER TABLE ledger ADD COLUMN unreviewed boolean;");
    await expect(runMigrations(clone.client, clone.target, files, { mode: "apply", baseline })).rejects.toMatchObject({ code: "BASELINE_MISMATCH" });
    expect(await journalExists(clone.database)).toEqual({ journal: null });
  });
  it("executes the repository's complete migration set and exports a reproducible schema reference", async () => {
    const { client, target } = await fixture();
    const migrations = await loadMigrations("migrations");
    expect(await runMigrations(client, target, migrations, { mode: "apply" })).toMatchObject({ appliedNow: migrations.length });
    const objects = await schemaObjects(client);
    expect(new Set(objects.map(row => `${row.kind}:${row.key}`)).size).toBe(objects.length);
    expect(objects.some(row => row.key.length > 63)).toBe(true);
    const first = await runMigrations(client, target, migrations, { mode: "export-baseline" });
    expect(await runMigrations(client, target, migrations, { mode: "apply" })).toMatchObject({ appliedNow: 0 });
    expect(await runMigrations(client, target, migrations, { mode: "export-baseline" })).toEqual(first);
  }, 30_000);
});
