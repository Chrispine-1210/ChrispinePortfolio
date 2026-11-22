import { readdir, readFile } from "node:fs/promises";
import { join } from "node:path";
import { z } from "zod";
import { MigrationSafetyError, type MigrationTarget } from "./config.js";
import { canonicalJson, schemaIdentity, sha256 } from "./schema.js";

export interface MigrationClient {
  query(sql: string, params?: unknown[]): Promise<{ rows: Record<string, any>[] }>;
  exec(sql: string): Promise<void>;
}
export type MigrationFile = { file: string; sha256: string; sql: string };
const entrySchema = z.object({ file: z.string().regex(/^\d{4}_[a-z0-9_]+\.sql$/), sha256: z.string().regex(/^[a-f0-9]{64}$/) }).strict();
export const baselineSchema = z.object({ version: z.literal(1), migrations: z.array(entrySchema).min(1), schemaDigest: z.string().regex(/^[a-f0-9]{64}$/) }).strict();
export type MigrationBaseline = z.infer<typeof baselineSchema>;
const historySchema = entrySchema.extend({ origin: z.enum(["applied", "baseline"]) });
type History = z.infer<typeof historySchema>;

// Ignore comments and quoted bodies before checking statement-leading keywords.
// Migrations may not commit/abort the runner's enclosing transaction themselves.
function assertTransactionalSql(sql: string) {
  let visible = "";
  for (let i = 0; i < sql.length;) {
    if (sql.startsWith("--", i)) { const end = sql.slice(i).search(/[\r\n]/); i = end < 0 ? sql.length : i + end; visible += " "; }
    else if (sql.startsWith("/*", i)) {
      let depth = 1; i += 2;
      while (i < sql.length && depth) {
        if (sql.startsWith("/*", i)) { depth++; i += 2; }
        else if (sql.startsWith("*/", i)) { depth--; i += 2; }
        else i++;
      }
      visible += " ";
    } else if (sql[i] === "'" || sql[i] === '"') {
      const escaped = sql[i] === "'" && /[eE]/.test(sql[i - 1] ?? "") && !/[a-zA-Z0-9_$]/.test(sql[i - 2] ?? "");
      const quote = sql[i++];
      while (i < sql.length) {
        if (sql[i] === quote) { i++; if (sql[i] === quote) { i++; continue; } break; }
        if (sql[i] === "\\" && escaped) i++;
        i++;
      }
      visible += " quoted ";
    } else if (sql[i] === "$" && /^\$(?:[a-zA-Z_][a-zA-Z0-9_]*)?\$/.test(sql.slice(i))) {
      const delimiter = sql.slice(i).match(/^\$(?:[a-zA-Z_][a-zA-Z0-9_]*)?\$/)![0];
      const end = sql.indexOf(delimiter, i + delimiter.length);
      i = end < 0 ? sql.length : end + delimiter.length; visible += " quoted ";
    } else visible += sql[i++];
  }
  if (visible.split(";").some(statement => /^\s*(BEGIN|START|COMMIT|END|ROLLBACK|ABORT|PREPARE)\b/i.test(statement))) {
    throw new MigrationSafetyError("TRANSACTION_CONTROL_FORBIDDEN", "Migration SQL must not control the runner's enclosing transaction");
  }
}

export async function loadMigrations(directory: string): Promise<MigrationFile[]> {
  const files = (await readdir(directory)).filter(file => /\.sql$/i.test(file)).sort();
  if (!files.length || files.some(file => !entrySchema.shape.file.safeParse(file).success)
    || new Set(files.map(file => file.slice(0, 4))).size !== files.length) {
    throw new MigrationSafetyError("INVALID_MIGRATIONS", "Migration filenames must be unique, ordered four-digit versions");
  }
  return Promise.all(files.map(async file => { const sql = await readFile(join(directory, file), "utf8"); return { file, sql, sha256: sha256(sql) }; }));
}

function entries(files: MigrationFile[]) { return files.map(({ file, sha256 }) => ({ file, sha256 })); }

function validateHistory(history: History[], files: MigrationFile[]) {
  for (let i = 0; i < history.length; i++) {
    if (!files[i] || history[i].file !== files[i].file || history[i].sha256 !== files[i].sha256) {
      throw new MigrationSafetyError("HISTORY_MISMATCH", "Applied migration history differs from the reviewed source; no SQL was replayed");
    }
  }
}

async function historyState(client: MigrationClient): Promise<History[] | null> {
  const { rows: [state] } = await client.query("SELECT pg_catalog.to_regclass('chrispine_migrations.history')::text AS journal");
  if (!state?.journal) return null;
  const { rows } = await client.query("SELECT file,sha256,origin FROM chrispine_migrations.history ORDER BY file COLLATE \"C\"");
  const parsed = z.array(historySchema).safeParse(rows);
  if (!parsed.success) throw new MigrationSafetyError("HISTORY_MISMATCH", "Migration history has an invalid format");
  return parsed.data;
}

async function establishJournal(client: MigrationClient) {
  await client.exec(`CREATE SCHEMA IF NOT EXISTS chrispine_migrations;
    REVOKE ALL ON SCHEMA chrispine_migrations FROM PUBLIC;
    CREATE TABLE IF NOT EXISTS chrispine_migrations.history (
      file text PRIMARY KEY, sha256 text NOT NULL CHECK (sha256 ~ '^[a-f0-9]{64}$'),
      origin text NOT NULL CHECK (origin IN ('applied','baseline')), recorded_at timestamptz NOT NULL DEFAULT now()
    );
    REVOKE ALL ON chrispine_migrations.history FROM PUBLIC;`);
}

export async function runMigrations(client: MigrationClient, target: MigrationTarget, files: MigrationFile[], options: {
  mode: "plan" | "apply" | "export-baseline";
  baseline?: unknown;
}) {
  let active = false;
  try {
    if (!files.length) throw new MigrationSafetyError("INVALID_MIGRATIONS", "No reviewed migration files supplied");
    for (const file of files) {
      if (file.sha256 !== sha256(file.sql)) throw new MigrationSafetyError("SOURCE_MISMATCH", "Migration SQL does not match its checksum");
      assertTransactionalSql(file.sql);
    }
    // One dedicated direct session, one transaction: schema, data changes and
    // journal entries either commit together or all roll back.
    await client.exec(options.mode === "apply" ? "BEGIN" : "BEGIN ISOLATION LEVEL REPEATABLE READ READ ONLY");
    active = true;
    await client.exec("SET LOCAL search_path = public, pg_catalog; SET LOCAL lock_timeout = '5s'; SET LOCAL statement_timeout = '60s';");
    const { rows: [identity] } = await client.query("SELECT pg_catalog.current_database() AS database, current_user AS role, pg_catalog.current_setting('neon.branch_id',true) AS branch");
    if (identity?.database !== target.database || identity?.role !== target.migrationRole || identity?.branch !== target.branchId) {
      throw new MigrationSafetyError("TARGET_MISMATCH", "Connected database, role or Neon branch differs from the expected target");
    }
    const { rows: [role] } = await client.query(`SELECT r.rolsuper,r.rolcreatedb,r.rolcreaterole, pg_catalog.pg_has_role(r.rolname,current_user,'MEMBER') AS inherits_migrator
      FROM pg_catalog.pg_roles r WHERE r.rolname=$1`, [target.runtimeRole]);
    if (!role || role.rolsuper || role.rolcreatedb || role.rolcreaterole || role.inherits_migrator) throw new MigrationSafetyError("ROLE_SEPARATION_REQUIRED", "Runtime credentials must not inherit migration authority");
    const { rows: [lock] } = await client.query("SELECT pg_catalog.pg_try_advisory_xact_lock(1129337650, 1296648018) AS acquired");
    if (lock?.acquired !== true) throw new MigrationSafetyError("MIGRATION_BUSY", "Another migration runner holds the database migration lock");
    const history = await historyState(client);
    validateHistory(history ?? [], files);
    const schema = await schemaIdentity(client);
    const unjournaled = !history?.length && schema.objectCount > 0;
    let baseline: MigrationBaseline | undefined;
    if (options.baseline !== undefined) {
      const parsed = baselineSchema.safeParse(options.baseline);
      if (!parsed.success) throw new MigrationSafetyError("INVALID_BASELINE", "The reviewed baseline file has an invalid format");
      baseline = parsed.data;
      if (!unjournaled || canonicalJson(baseline.migrations) !== canonicalJson(entries(files)) || baseline.schemaDigest !== schema.digest) {
        throw new MigrationSafetyError("BASELINE_MISMATCH", "Existing schema or migration checksums differ from the reviewed baseline");
      }
    }
    if (options.mode === "export-baseline") {
      if (target.environment === "production" || unjournaled || history?.length !== files.length || history.some(row => row.origin !== "applied")) {
        throw new MigrationSafetyError("REFERENCE_REQUIRED", "Export a baseline only from an isolated database where every migration was applied by this runner");
      }
      await client.exec("ROLLBACK"); active = false;
      return { version: 1 as const, migrations: entries(files), schemaDigest: schema.digest };
    }
    const pending = files.slice(history?.length ?? 0);
    const plan = { environment: target.environment, branchId: target.branchId, database: target.database,
      migrationRole: target.migrationRole, schemaDigest: schema.digest, schemaObjects: schema.objectCount,
      applied: history?.length ?? 0, needsBaseline: unjournaled && !baseline,
      pending: baseline ? [] : pending.map(file => file.file), action: baseline ? "baseline" : "migrate" };
    if (options.mode === "plan") { await client.exec("ROLLBACK"); active = false; return plan; }
    if (unjournaled && !baseline) throw new MigrationSafetyError("BASELINE_REQUIRED", "Existing schema has no migration journal; review an isolated reference baseline before adoption");
    if (!history || pending.length || baseline) await establishJournal(client);
    if (baseline) {
      for (const file of files) await client.query("INSERT INTO chrispine_migrations.history(file,sha256,origin) VALUES ($1,$2,'baseline')", [file.file, file.sha256]);
    } else {
      for (const file of pending) {
        await client.exec(file.sql);
        await client.query("INSERT INTO chrispine_migrations.history(file,sha256,origin) VALUES ($1,$2,'applied')", [file.file, file.sha256]);
      }
    }
    await client.exec("COMMIT"); active = false;
    return { ...plan, appliedNow: baseline ? 0 : pending.length, baselined: baseline ? files.length : 0 };
  } catch (error) {
    if (active) await client.exec("ROLLBACK").catch(() => {});
    if (error instanceof MigrationSafetyError) throw error;
    throw new MigrationSafetyError("MIGRATION_FAILED", "Migration operation failed; schema/history commit is not confirmed. Inspect the journal before retrying. Driver details are redacted.");
  }
}
