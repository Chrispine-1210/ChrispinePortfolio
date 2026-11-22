// A single server transaction for environments where a direct session is unavailable.
// It has no connection credentials and does not execute anything by itself.
import {
  applicationDatabase,
  productionBranchId,
  MigrationSafetyError,
  type MigrationTarget,
} from "./config.js";
import {
  assertTransactionalSql,
  baselineSchema,
  type MigrationBaseline,
  type MigrationFile,
} from "./runner.js";
import { canonicalJson, schemaCatalogSql, sha256 } from "./schema.js";
export type BatchTarget = Pick<
  MigrationTarget,
  "environment" | "branchId" | "database" | "migrationRole" | "runtimeRole"
>;
export function sqlValue(value: string) {
  let tag = "$v_" + sha256(value).slice(0, 16) + "$";
  while (value.includes(tag)) tag = tag.slice(0, -1) + "_$";
  return tag + value + tag;
}
function identifier(value: string) {
  if (!/^[a-z][a-z0-9_]{0,62}$/.test(value))
    throw new MigrationSafetyError(
      "INVALID_ROLE",
      "Invalid database role identifier",
    );
  return '"' + value + '"';
}
function validateTarget(t: BatchTarget) {
  if (
    t.database !== applicationDatabase ||
    !/^br-[a-z0-9-]+$/.test(t.branchId) ||
    (t.environment === "production") !== (t.branchId === productionBranchId)
  )
    throw new MigrationSafetyError(
      "TARGET_MISMATCH",
      "Invalid database/environment boundary",
    );
  if (
    !["production", "preview", "development", "test"].includes(t.environment) ||
    t.runtimeRole === t.migrationRole
  )
    throw new MigrationSafetyError(
      "ROLE_SEPARATION_REQUIRED",
      "Separate runtime and migration roles are required",
    );
  identifier(t.runtimeRole);
  identifier(t.migrationRole);
}
function validateFiles(files: MigrationFile[]) {
  if (
    !files.length ||
    new Set(files.map((f) => f.file.slice(0, 4))).size !== files.length ||
    files.some(
      (f, i) =>
        !/^\d{4}_[a-z0-9_]+\.sql$/.test(f.file) ||
        f.sha256 !== sha256(f.sql) ||
        (i > 0 && files[i - 1].file >= f.file),
    )
  )
    throw new MigrationSafetyError(
      "SOURCE_MISMATCH",
      "Invalid migration source or checksums",
    );
  files.forEach((f) => assertTransactionalSql(f.sql));
}
const entries = (files: MigrationFile[]) =>
  files.map(({ file, sha256 }) => ({ file, sha256 }));
export const catalogArraySql = `SELECT coalesce(jsonb_agg(to_jsonb(o) ORDER BY o.kind COLLATE "C",o.key COLLATE "C"),'[]'::jsonb) FROM (${schemaCatalogSql}) o`;
const executionBudgetGuard = `IF (SELECT setting::bigint FROM pg_catalog.pg_settings WHERE name='statement_timeout') NOT BETWEEN 1 AND 60000 OR (SELECT setting::bigint FROM pg_catalog.pg_settings WHERE name='lock_timeout') NOT BETWEEN 1 AND 5000 THEN RAISE EXCEPTION 'MIGRATION_TIMEOUT_REQUIRED'; END IF;`;
// Execute these statements on one connection in one transaction. SET LOCAL must
// precede DO: changing statement_timeout inside DO cannot start its outer timer.
export function migrationStatements(
  sql: string,
  options: { statementTimeoutMs?: number; lockTimeoutMs?: number } = {},
) {
  const statement = options.statementTimeoutMs ?? 60000,
    lock = options.lockTimeoutMs ?? 5000;
  if (
    !Number.isInteger(statement) ||
    statement < 1 ||
    statement > 60000 ||
    !Number.isInteger(lock) ||
    lock < 1 ||
    lock > 5000
  )
    throw new MigrationSafetyError(
      "INVALID_TIMEOUT",
      "Migration budgets must be positive and bounded",
    );
  return [
    `SET LOCAL statement_timeout='${statement}ms'`,
    `SET LOCAL lock_timeout='${lock}ms'`,
    sql,
  ];
}
function guard(t: BatchTarget, catalog: unknown[]) {
  return `
 IF pg_catalog.current_database()<>${sqlValue(t.database)} OR current_user<>${sqlValue(t.migrationRole)} OR pg_catalog.current_setting('neon.branch_id',true) IS DISTINCT FROM ${sqlValue(t.branchId)} THEN RAISE EXCEPTION 'TARGET_MISMATCH'; END IF;
 IF NOT EXISTS(SELECT 1 FROM pg_catalog.pg_roles r WHERE rolname=${sqlValue(t.runtimeRole)} AND NOT rolsuper AND NOT rolcreatedb AND NOT rolcreaterole AND NOT rolbypassrls AND NOT pg_catalog.pg_has_role(rolname,current_user,'MEMBER') AND NOT EXISTS(SELECT 1 FROM pg_catalog.pg_roles p WHERE p.rolname='neon_superuser' AND pg_catalog.pg_has_role(r.oid,p.oid,'MEMBER'))) THEN RAISE EXCEPTION 'ROLE_SEPARATION_REQUIRED'; END IF;
 IF pg_catalog.has_schema_privilege(${sqlValue(t.runtimeRole)},'public','CREATE') OR pg_catalog.has_database_privilege(${sqlValue(t.runtimeRole)},pg_catalog.current_database(),'CREATE') THEN RAISE EXCEPTION 'ROLE_SEPARATION_REQUIRED'; END IF;
 ${executionBudgetGuard}
 IF NOT pg_catalog.pg_try_advisory_xact_lock(1129337650,1296648018) THEN RAISE EXCEPTION 'MIGRATION_BUSY'; END IF;
 SELECT (${catalogArraySql}) INTO objects;
 IF objects IS DISTINCT FROM ${sqlValue(JSON.stringify(catalog))}::jsonb THEN RAISE EXCEPTION 'BASELINE_MISMATCH'; END IF;
`;
}
function historyRead() {
  return `IF to_regclass('chrispine_migrations.history') IS NOT NULL THEN EXECUTE 'SELECT coalesce(jsonb_agg(jsonb_build_object(''file'',file,''sha256'',sha256) ORDER BY file COLLATE "C"),''[]''::jsonb) FROM chrispine_migrations.history' INTO history; END IF;`;
}
const journal = `CREATE SCHEMA IF NOT EXISTS chrispine_migrations; REVOKE ALL ON SCHEMA chrispine_migrations FROM PUBLIC;
 CREATE TABLE IF NOT EXISTS chrispine_migrations.history(file text PRIMARY KEY,sha256 text NOT NULL CHECK(sha256~'^[a-f0-9]{64}$'),origin text NOT NULL CHECK(origin IN ('applied','baseline')),recorded_at timestamptz NOT NULL DEFAULT now()); REVOKE ALL ON chrispine_migrations.history FROM PUBLIC;`;
function block(body: string) {
  return `DO ${sqlValue(`DECLARE objects jsonb; history jsonb; BEGIN SET LOCAL search_path=public,pg_catalog; ${body} END;`)};`;
}
export function adoptionBatch(
  t: BatchTarget,
  files: MigrationFile[],
  baseline: MigrationBaseline,
  catalog: unknown[],
) {
  validateTarget(t);
  validateFiles(files);
  const b = baselineSchema.parse(baseline);
  if (
    canonicalJson(b.migrations) !== canonicalJson(entries(files)) ||
    sha256(canonicalJson(catalog)) !== b.schemaDigest
  )
    throw new MigrationSafetyError(
      "INVALID_BASELINE",
      "Reference catalog or migration checksums differ",
    );
  const expected = sqlValue(JSON.stringify(entries(files))) + "::jsonb";
  return block(`${guard(t, catalog)} ${historyRead()}
 IF history IS NOT NULL AND history<>${expected} THEN RAISE EXCEPTION 'HISTORY_MISMATCH'; END IF;
 IF history=${expected} THEN RETURN; END IF;
 ${journal}
 ${files.map((f) => `INSERT INTO chrispine_migrations.history(file,sha256,origin) VALUES(${sqlValue(f.file)},${sqlValue(f.sha256)},'baseline');`).join("\n")}`);
}
export function pendingBatch(
  t: BatchTarget,
  applied: MigrationFile[],
  pending: MigrationFile[],
  before: unknown[],
  after: unknown[],
) {
  validateTarget(t);
  validateFiles([...applied, ...pending]);
  if (!pending.length)
    throw new MigrationSafetyError(
      "INVALID_MIGRATIONS",
      "No pending source files supplied",
    );
  return block(`${guard(t, before)} ${historyRead()}
 IF history IS DISTINCT FROM ${sqlValue(JSON.stringify(entries(applied)))}::jsonb THEN RAISE EXCEPTION 'HISTORY_MISMATCH'; END IF;
 ${pending.map((f) => `EXECUTE ${sqlValue(f.sql)}; INSERT INTO chrispine_migrations.history(file,sha256,origin) VALUES(${sqlValue(f.file)},${sqlValue(f.sha256)},'applied');`).join("\n")}
 ${["audit_events", "content_versions", "engineering_versions"].map((name) => `IF to_regclass('public.${name}') IS NOT NULL THEN REVOKE UPDATE,DELETE ON public.${name} FROM ${identifier(t.runtimeRole)}; END IF;`).join("\n")}
 SELECT (${catalogArraySql}) INTO objects;
 IF objects IS DISTINCT FROM ${sqlValue(JSON.stringify(after))}::jsonb THEN RAISE EXCEPTION 'RESULT_SCHEMA_MISMATCH'; END IF;`);
}
export function databaseRolePolicy(t: BatchTarget, catalog: unknown[]) {
  validateTarget(t);
  if (!Array.isArray(catalog) || !catalog.length)
    throw new MigrationSafetyError(
      "INVALID_BASELINE",
      "Role changes require the reviewed source catalog",
    );
  const runtime = identifier(t.runtimeRole),
    migrator = identifier(t.migrationRole);
  const mutableDeletes = [
    "user_roles",
    "email_suppressions",
    "blog_likes",
    "blog_comments",
    "email_templates",
    "external_posts",
    "portfolio_projects",
    "blog_posts",
  ];
  return `DO ${sqlValue(`DECLARE r record; objects jsonb; BEGIN
 SET LOCAL search_path=pg_catalog,public;
 IF current_database()<>${sqlValue(t.database)} OR current_setting('neon.branch_id',true) IS DISTINCT FROM ${sqlValue(t.branchId)} THEN RAISE EXCEPTION 'TARGET_MISMATCH'; END IF;
 ${executionBudgetGuard}
 IF NOT pg_catalog.pg_try_advisory_xact_lock(1129337650,1296648018) THEN RAISE EXCEPTION 'MIGRATION_BUSY'; END IF;
 SELECT (${catalogArraySql}) INTO objects;
 IF objects IS DISTINCT FROM ${sqlValue(JSON.stringify(catalog))}::jsonb THEN RAISE EXCEPTION 'BASELINE_MISMATCH'; END IF;
 IF (SELECT count(*) FROM pg_roles WHERE rolname IN (${sqlValue(t.runtimeRole)},${sqlValue(t.migrationRole)}) AND NOT rolsuper AND NOT rolcreatedb AND NOT rolcreaterole AND NOT rolbypassrls)<>2 THEN RAISE EXCEPTION 'ROLE_SEPARATION_REQUIRED'; END IF;
 IF pg_has_role(${sqlValue(t.runtimeRole)},${sqlValue(t.migrationRole)},'MEMBER') THEN RAISE EXCEPTION 'ROLE_SEPARATION_REQUIRED'; END IF;
 GRANT ${migrator} TO CURRENT_USER;
 GRANT CONNECT,CREATE ON DATABASE ${identifier(t.database)} TO ${migrator};
 GRANT CONNECT ON DATABASE ${identifier(t.database)} TO ${runtime};
 REVOKE CREATE ON SCHEMA public FROM PUBLIC;
 GRANT USAGE,CREATE ON SCHEMA public TO ${migrator};
 GRANT USAGE ON SCHEMA public TO ${runtime};
 FOR r IN SELECT c.relname,c.relkind FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace WHERE n.nspname='public' AND c.relkind IN ('r','p','S','v','m','f') AND NOT EXISTS(SELECT 1 FROM pg_depend d WHERE d.classid='pg_class'::regclass AND d.objid=c.oid AND d.deptype='e') LOOP
 EXECUTE format('ALTER %s public.%I OWNER TO ${migrator}',CASE r.relkind WHEN 'S' THEN 'SEQUENCE' WHEN 'v' THEN 'VIEW' WHEN 'm' THEN 'MATERIALIZED VIEW' WHEN 'f' THEN 'FOREIGN TABLE' ELSE 'TABLE' END,r.relname); END LOOP;
 FOR r IN SELECT p.proname,pg_get_function_identity_arguments(p.oid) AS args,p.prokind FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace WHERE n.nspname='public' AND p.prokind IN ('f','p') AND NOT EXISTS(SELECT 1 FROM pg_depend d WHERE d.classid='pg_proc'::regclass AND d.objid=p.oid AND d.deptype='e') LOOP
 EXECUTE format('ALTER %s public.%I(%s) OWNER TO ${migrator}',CASE WHEN r.prokind='p' THEN 'PROCEDURE' ELSE 'FUNCTION' END,r.proname,r.args); END LOOP;
 FOR r IN SELECT t.typname FROM pg_type t JOIN pg_namespace n ON n.oid=t.typnamespace WHERE n.nspname='public' AND t.typtype='e' LOOP EXECUTE format('ALTER TYPE public.%I OWNER TO ${migrator}',r.typname); END LOOP;
 GRANT SELECT,INSERT,UPDATE ON ALL TABLES IN SCHEMA public TO ${runtime};
 REVOKE DELETE,TRUNCATE,REFERENCES,TRIGGER ON ALL TABLES IN SCHEMA public FROM ${runtime};
 GRANT DELETE ON ${mutableDeletes.map((n) => "public." + identifier(n)).join(",")} TO ${runtime};
 GRANT USAGE,SELECT ON ALL SEQUENCES IN SCHEMA public TO ${runtime};
 ALTER DEFAULT PRIVILEGES FOR ROLE ${migrator} IN SCHEMA public GRANT SELECT,INSERT,UPDATE ON TABLES TO ${runtime};
 ALTER DEFAULT PRIVILEGES FOR ROLE ${migrator} IN SCHEMA public GRANT USAGE,SELECT ON SEQUENCES TO ${runtime};
 REVOKE UPDATE ON public.audit_events,public.content_versions FROM ${runtime};
 IF to_regclass('public.engineering_versions') IS NOT NULL THEN REVOKE UPDATE ON public.engineering_versions FROM ${runtime}; END IF;
 IF to_regclass('public.financial_request_receipts') IS NOT NULL THEN REVOKE UPDATE ON public.financial_request_receipts FROM ${runtime}; END IF;
 END;`)};`;
}
