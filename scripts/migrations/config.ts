import { runtimeDatabaseUrl } from "../../shared/database-target.js";

// A production restore that changes branch identity requires a reviewed update.
export const productionBranchId = "br-misty-wave-bb79bj7l";
export const applicationDatabase = "neondb";

export class MigrationSafetyError extends Error {
  constructor(public readonly code: string, message: string) { super(message); }
}

export type MigrationTarget = {
  connectionString: string;
  environment: "preview" | "production" | "development" | "test";
  branchId: string;
  database: string;
  migrationRole: string;
  runtimeRole: string;
};

function required(source: NodeJS.ProcessEnv, key: string): string {
  const value = source[key]?.trim();
  if (!value) throw new MigrationSafetyError("CONFIG_REQUIRED", `${key} must be explicitly configured`);
  return value;
}

function connection(value: string): { host: string; port: string; database: string; role: string; pooled: boolean } {
  try {
    const url = new URL(value);
    if (!["postgres:", "postgresql:"].includes(url.protocol) || !url.hostname || !url.username || !url.pathname.slice(1)) throw new Error();
    // Options can change the effective database identity/search path behind the
    // URL. Only connection-security/driver parameters are accepted here.
    if ([...url.searchParams.keys()].some(key => !["sslmode", "channel_binding", "connect_timeout", "application_name"].includes(key))) throw new Error();
    if (url.searchParams.get("sslmode") === "disable" && !["localhost", "127.0.0.1", "[::1]"].includes(url.hostname)) throw new Error();
    const pooled = url.hostname.split(".")[0].endsWith("-pooler");
    return { host: url.hostname.replace(/-pooler(?=\.)/, ""), port: url.port || "5432",
      database: decodeURIComponent(url.pathname.slice(1)), role: decodeURIComponent(url.username), pooled };
  } catch {
    throw new MigrationSafetyError("INVALID_CONNECTION", "Invalid PostgreSQL target configuration; connection details are redacted");
  }
}

export function migrationTarget(source: NodeJS.ProcessEnv): MigrationTarget {
  const connectionString = required(source, "MIGRATION_DATABASE_URL");
  const environment = required(source, "MIGRATION_ENVIRONMENT");
  if (!["preview", "production", "development", "test"].includes(environment)) throw new MigrationSafetyError("INVALID_ENVIRONMENT", "Unsupported migration environment");
  if (source.VERCEL_ENV && source.VERCEL_ENV !== environment) throw new MigrationSafetyError("ENVIRONMENT_MISMATCH", "Migration environment differs from the hosting environment");
  const branchId = required(source, "MIGRATION_EXPECTED_BRANCH_ID");
  if (!/^br-[a-z0-9-]+$/.test(branchId)) throw new MigrationSafetyError("INVALID_BRANCH", "Expected branch must be an explicit Neon branch ID");
  if ((environment === "production") !== (branchId === productionBranchId)) throw new MigrationSafetyError("ENVIRONMENT_MISMATCH", "Migration environment does not match the reviewed production branch boundary");
  const database = required(source, "MIGRATION_EXPECTED_DATABASE");
  const migrationRole = required(source, "MIGRATION_EXPECTED_ROLE");
  const runtime = runtimeDatabaseUrl(source);
  if (!runtime) throw new MigrationSafetyError("CONFIG_REQUIRED", "The effective application database URL is required for target comparison");
  const app = connection(runtime);
  const migration = connection(connectionString);
  if (migration.pooled) throw new MigrationSafetyError("DIRECT_CONNECTION_REQUIRED", "Migrations require a direct connection, not a pooler endpoint");
  if (migration.host !== app.host || migration.port !== app.port || migration.database !== app.database
    || migration.database !== database || database !== applicationDatabase) throw new MigrationSafetyError("TARGET_MISMATCH", "Migration and application database targets differ");
  if (migration.role !== migrationRole || migration.role === app.role) throw new MigrationSafetyError("ROLE_SEPARATION_REQUIRED", "Use an explicitly named migration role separate from the runtime role");
  return { connectionString, environment: environment as MigrationTarget["environment"], branchId, database, migrationRole, runtimeRole: app.role };
}
