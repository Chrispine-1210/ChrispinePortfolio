import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { Pool, neonConfig } from "@neondatabase/serverless";
import ws from "ws";
import { migrationTarget, MigrationSafetyError } from "./migrations/config.js";
import { loadMigrations, runMigrations } from "./migrations/runner.js";

async function main() {
  const args = process.argv.slice(2);
  let mode: "plan" | "apply" | "export-baseline" = "plan";
  let selected = false;
  let baseline: unknown;
  for (let i = 0; i < args.length; i++) {
    if (["--plan", "--apply", "--export-baseline"].includes(args[i]) && !selected) {
      mode = args[i].slice(2) as typeof mode; selected = true;
    } else if (args[i] === "--baseline-file" && args[i + 1] && baseline === undefined) {
      try { baseline = JSON.parse(await readFile(resolve(args[++i]), "utf8")); }
      catch { throw new MigrationSafetyError("INVALID_BASELINE", "Cannot read the requested baseline JSON file"); }
    } else { throw new MigrationSafetyError("INVALID_ARGUMENT", "Use one of --plan (default), --apply, --export-baseline, and optional --baseline-file PATH"); }
  }
  const target = migrationTarget(process.env);
  const files = await loadMigrations(resolve(process.cwd(), "migrations"));
  neonConfig.webSocketConstructor = ws;
  const pool = new Pool({ connectionString: target.connectionString, connectionTimeoutMillis: 10_000, max: 1 });
  try {
    const client = await pool.connect();
    try {
      const result = await runMigrations({ query: async (sql, params) => client.query(sql, params), exec: async sql => { await client.query(sql); } }, target, files, { mode, baseline });
      process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
    } finally { client.release(); }
  } finally { await pool.end(); }
}

main().catch(error => {
  const safe = error instanceof MigrationSafetyError ? error : new MigrationSafetyError("MIGRATION_FAILED", "Migration connection or operation failed; driver details are redacted");
  console.error(JSON.stringify({ code: safe.code, message: safe.message }));
  process.exitCode = 1;
});
