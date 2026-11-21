import { PGlite } from "@electric-sql/pglite";
import { drizzle } from "drizzle-orm/pglite";
import { readFile, readdir } from "node:fs/promises";
import path from "node:path";
import * as schema from "../../../shared/schema.js";

if (
  process.env.NODE_ENV !== "test" ||
  process.env.ENGINEERING_QA_FIXTURE !== "isolated-pglite-only" ||
  process.env.VERCEL
) {
  throw new Error("Isolated QA database requires the guarded review launcher");
}
const root = process.env.QA_PROJECT_ROOT;
if (!root) throw new Error("QA project root is required");
export const database = new PGlite();
for (const name of (await readdir(path.join(root, "migrations")))
  .filter((name) => /^\d{4}_.*\.sql$/.test(name))
  .sort()) {
  await database.exec(
    await readFile(path.join(root, "migrations", name), "utf8"),
  );
}
export const db = drizzle(database, { schema });
// Keep the read-only release probe on the same isolated database as the ORM.
export const pool = {
  query: (text: string, parameters?: unknown[]) => database.query(text, parameters),
};
