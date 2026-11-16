import { createHash } from "node:crypto";

export type ReleaseMetadata = {
  provider: "vercel" | "local";
  environment: string;
  commitSha: string | null;
  commitRef: string | null;
  deploymentUrl: string | null;
  databaseIdentity: string | null;
};

function getDatabaseIdentity(source: NodeJS.ProcessEnv): string | null {
  const connectionString = source.APP_DATABASE_URL ?? source.DATABASE_URL;
  if (!connectionString) return null;

  try {
    const parsed = new URL(connectionString);
    const target = `${parsed.hostname.toLowerCase()}${parsed.pathname}`;
    return createHash("sha256").update(target).digest("hex").slice(0, 24);
  } catch {
    return null;
  }
}

export function getReleaseMetadata(
  source: NodeJS.ProcessEnv = process.env,
): ReleaseMetadata {
  const provider = source.VERCEL ? "vercel" : "local";
  const environment = source.VERCEL_ENV ?? source.NODE_ENV ?? "unknown";

  return {
    provider,
    environment,
    commitSha: source.VERCEL_GIT_COMMIT_SHA ?? source.GIT_COMMIT_SHA ?? null,
    commitRef: source.VERCEL_GIT_COMMIT_REF ?? source.GIT_COMMIT_REF ?? null,
    deploymentUrl: source.VERCEL_URL ?? null,
    databaseIdentity: getDatabaseIdentity(source),
  };
}
