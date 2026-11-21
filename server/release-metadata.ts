export type ReleaseMetadata = {
  provider: "vercel" | "local";
  environment: string;
  commitSha: string | null;
  commitRef: string | null;
  deploymentUrl: string | null;
};

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
  };
}
