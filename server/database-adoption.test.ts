import { readFile } from "node:fs/promises";
import { beforeAll, describe, expect, it } from "vitest";
import {
  adoptionBatch,
  pendingBatch,
  databaseRolePolicy,
  migrationStatements,
  sqlValue,
  type BatchTarget,
} from "../scripts/migrations/connector-batch.js";
import {
  loadMigrations,
  type MigrationFile,
  type MigrationBaseline,
} from "../scripts/migrations/runner.js";
let files: MigrationFile[], baseline: MigrationBaseline, catalog: unknown[];
const target: BatchTarget = {
  environment: "preview",
  branchId: "br-fixture-roles",
  database: "neondb",
  runtimeRole: "portfolio_runtime",
  migrationRole: "portfolio_migrator",
};
beforeAll(async () => {
  files = await loadMigrations("migrations");
  const root = "docs/production-readiness/database-adoption-2026-11-22/";
  baseline = JSON.parse(
    await readFile(root + "reference-baseline.json", "utf8"),
  );
  files = files.filter(f => baseline.migrations.some(m => m.file === f.file));
  catalog = JSON.parse(await readFile(root + "reference-catalog.json", "utf8"));
});
describe("connector migration operation boundaries", () => {
  it.each([0, -1, 60001, NaN, Infinity])(
    "refuses invalid statement budget %s",
    (statementTimeoutMs) => {
      expect(() =>
        migrationStatements("SELECT 1", { statementTimeoutMs }),
      ).toThrow("positive and bounded");
    },
  );
  it("refuses unbounded or injected lock budgets", () => {
    for (const lockTimeoutMs of [0, 5001, NaN])
      expect(() => migrationStatements("SELECT 1", { lockTimeoutMs })).toThrow(
        "positive and bounded",
      );
  });
  it("refuses mismatched production/environment/database targets before generating SQL", () => {
    for (const t of [
      { ...target, branchId: "br-misty-wave-bb79bj7l" },
      { ...target, environment: "production" as const },
      { ...target, database: "postgres" },
    ])
      expect(() => adoptionBatch(t, files, baseline, catalog)).toThrow(
        "boundary",
      );
  });
  it("refuses shared and injected role identifiers", () => {
    for (const t of [
      { ...target, runtimeRole: target.migrationRole },
      { ...target, migrationRole: "migrator; DROP TABLE users" },
    ])
      expect(() => databaseRolePolicy(t, catalog)).toThrow();
  });
  it("requires a reviewed catalog before any ownership or permission changes", () => {
    expect(() => databaseRolePolicy(target, [])).toThrow(
      "reviewed source catalog",
    );
  });
  it("refuses changed source before generating an apply", () => {
    expect(() =>
      adoptionBatch(
        target,
        [
          { ...files[0], sql: files[0].sql + "\n-- changed" },
          ...files.slice(1),
        ],
        baseline,
        catalog,
      ),
    ).toThrow("checksums");
  });
  it("refuses a baseline whose catalog or source list changed", () => {
    expect(() => adoptionBatch(target, files, baseline, [])).toThrow(
      "Reference",
    );
    expect(() =>
      adoptionBatch(
        target,
        files,
        { ...baseline, migrations: baseline.migrations.slice(1) },
        catalog,
      ),
    ).toThrow("Reference");
  });
  it("quotes untrusted text without interpreting SQL or dollar delimiters", () => {
    const value = "' ; COMMIT; -- \\ $v_test$";
    const quoted = sqlValue(value);
    const delimiter = quoted.slice(0, quoted.indexOf("$", 1) + 1);
    expect(quoted.slice(delimiter.length, -delimiter.length)).toBe(value);
  });
  it("refuses malformed sources and empty pending batches", () => {
    expect(() => pendingBatch(target, files, [], catalog, catalog)).toThrow(
      "No pending",
    );
    expect(() =>
      adoptionBatch(target, [files[0], files[0]], baseline, catalog),
    ).toThrow("checksums");
  });
});
