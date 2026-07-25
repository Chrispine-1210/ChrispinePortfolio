import { readdir, readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { Pool } from "@neondatabase/serverless";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) throw new Error("DATABASE_URL is required to run migrations");

const migrationsDirectory = resolve(process.cwd(), "migrations");
const migrationFiles = (await readdir(migrationsDirectory))
  .filter(file => /^\d{4}_[a-z0-9_]+\.sql$/i.test(file))
  .sort((left, right) => left.localeCompare(right));

if (!migrationFiles.length) throw new Error("No SQL migrations were found");

const pool = new Pool({ connectionString });
try {
  for (const file of migrationFiles) {
    const sql = await readFile(resolve(migrationsDirectory, file), "utf8");
    process.stdout.write(`Applying ${file}... `);
    await pool.query(sql);
    process.stdout.write("done\n");
  }
  process.stdout.write(`Applied ${migrationFiles.length} idempotent migration files.\n`);
} finally {
  await pool.end();
}
