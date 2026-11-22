// Generates reviewable SQL only. No credentials, connections or implicit writes.
import { readFile, mkdir, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { loadMigrations } from "../migrations/runner.js";
import {
  adoptionBatch,
  pendingBatch,
  databaseRolePolicy,
  migrationStatements,
  type BatchTarget,
} from "../migrations/connector-batch.js";
const environment = process.argv[2],
  branchId = process.argv[3],
  destination = process.argv[4];
if (!["preview", "production"].includes(environment) || !destination)
  throw Error(
    "Supply preview|production, explicit branch ID and output directory",
  );
const root = "docs/production-readiness/database-adoption-2026-11-22/";
const read = async (name: string) =>
  JSON.parse(await readFile(root + name + ".json", "utf8"));
const files = await loadMigrations("migrations");
const t: BatchTarget = {
  environment: environment as BatchTarget["environment"],
  branchId,
  database: "neondb",
  migrationRole: "portfolio_migrator",
  runtimeRole: "portfolio_runtime",
};
const baseline = await read("reference-baseline"),
  catalog = await read("reference-catalog");
const currentAdoption = adoptionBatch(t, files, baseline, catalog);
await mkdir(destination, { recursive: true });
async function save(name: string, sql: string) {
  const statements = migrationStatements(sql);
  await writeFile(
    resolve(destination, name + ".sql"),
    "BEGIN;\n" + statements.join(";\n") + ";\nCOMMIT;\n",
  );
  await writeFile(
    resolve(destination, name + ".json"),
    JSON.stringify(statements) + "\n",
  );
}
await save("roles-current", databaseRolePolicy(t, catalog));
await save("adopt-current", currentAdoption);
if (environment === "preview") {
  const prefix = await read("prefix-baseline"),
    before = await read("prefix-catalog");
  await save("roles", databaseRolePolicy(t, before));
  await save(
    "adopt-prefix",
    adoptionBatch(t, files.slice(0, -1), prefix, before),
  );
  await save(
    "apply-pending",
    pendingBatch(t, files.slice(0, -1), files.slice(-1), before, catalog),
  );
} else await save("roles", databaseRolePolicy(t, catalog));
console.log(
  JSON.stringify({
    environment,
    branchId,
    destination,
    sourceFiles: files.length,
    baselineDigest: baseline.schemaDigest,
    executed: false,
  }),
);
