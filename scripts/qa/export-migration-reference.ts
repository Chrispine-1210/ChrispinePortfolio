// Source-only reference. Never reads application credentials or business data.
import { PGlite } from "@electric-sql/pglite";
import { mkdir, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { loadMigrations, runMigrations } from "../migrations/runner.js";
import { schemaObjects } from "../migrations/schema.js";
const destination = resolve(
  process.argv[2] ?? "docs/production-readiness/database-adoption-2026-11-22",
);
const database = new PGlite();
try {
  await database.exec(
    "CREATE ROLE reference_runtime NOLOGIN; SET neon.branch_id='br-reference-local';",
  );
  const client = {
    query: async (sql: string, params?: unknown[]) =>
      database.query<Record<string, unknown>>(sql, params),
    exec: async (sql: string) => {
      await database.exec(sql);
    },
  };
  const files = await loadMigrations("migrations");
  const target = {
    connectionString: "local-reference-only",
    environment: "test" as const,
    branchId: "br-reference-local",
    database: "postgres",
    migrationRole: "postgres",
    runtimeRole: "reference_runtime",
  };
  await runMigrations(client, target, files.slice(0, -1), { mode: "apply" });
  await mkdir(destination, { recursive: true });
  await writeFile(
    resolve(destination, "prefix-baseline.json"),
    JSON.stringify(
      await runMigrations(client, target, files.slice(0, -1), {
        mode: "export-baseline",
      }),
      null,
      2,
    ) + "\n",
  );
  await writeFile(
    resolve(destination, "prefix-catalog.json"),
    JSON.stringify(await schemaObjects(client), null, 2) + "\n",
  );
  const applied = await runMigrations(client, target, files, { mode: "apply" });
  const baseline = await runMigrations(client, target, files, {
    mode: "export-baseline",
  });
  const objects = await schemaObjects(client);
  await mkdir(destination, { recursive: true });
  await writeFile(
    resolve(destination, "reference-baseline.json"),
    JSON.stringify(baseline, null, 2) + "\n",
  );
  await writeFile(
    resolve(destination, "reference-catalog.json"),
    JSON.stringify(objects, null, 2) + "\n",
  );
  console.log(
    JSON.stringify({
      reference: "fresh PGlite; source migrations only",
      ...applied,
      baselineDigest: baseline.schemaDigest,
      objects: objects.length,
    }),
  );
} finally {
  await database.close();
}
