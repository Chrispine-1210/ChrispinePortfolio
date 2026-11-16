import { createHash } from "node:crypto";
import { describe, expect, it } from "vitest";
import { getReleaseMetadata } from "./release-metadata.js";

function identityFor(connectionString: string) {
  const parsed = new URL(connectionString);
  return createHash("sha256")
    .update(`${parsed.hostname.toLowerCase()}${parsed.pathname}`)
    .digest("hex")
    .slice(0, 24);
}

describe("release metadata", () => {
  it("exposes non-secret deployment/database provenance and prioritizes APP_DATABASE_URL", () => {
    const appDatabaseUrl = "postgres://app-user:app-secret@preview-db.example.net:5432/portfolio";
    const fallbackDatabaseUrl = "postgres://fallback:secret@production-db.example.net:5432/portfolio";

    const metadata = getReleaseMetadata({
      NODE_ENV: "production",
      VERCEL: "1",
      VERCEL_ENV: "preview",
      VERCEL_GIT_COMMIT_SHA: "vercel-sha",
      GIT_COMMIT_SHA: "fallback-sha",
      VERCEL_GIT_COMMIT_REF: "maintenance/runtime-certification",
      VERCEL_URL: "preview.example.vercel.app",
      AUTH_SECRET: "must-not-leak",
      APP_DATABASE_URL: appDatabaseUrl,
      DATABASE_URL: fallbackDatabaseUrl,
    });

    expect(metadata).toEqual({
      provider: "vercel",
      environment: "preview",
      commitSha: "vercel-sha",
      commitRef: "maintenance/runtime-certification",
      deploymentUrl: "preview.example.vercel.app",
      databaseIdentity: identityFor(appDatabaseUrl),
    });

    const serialized = JSON.stringify(metadata);
    expect(serialized).not.toContain("must-not-leak");
    expect(serialized).not.toContain("app-secret");
    expect(serialized).not.toContain("fallback");
    expect(serialized).not.toContain("preview-db.example.net");
  });

  it("uses DATABASE_URL only when APP_DATABASE_URL is absent", () => {
    const databaseUrl = "postgres://user:secret@fallback-db.example.net:5432/portfolio";
    expect(getReleaseMetadata({ DATABASE_URL: databaseUrl }).databaseIdentity)
      .toBe(identityFor(databaseUrl));
  });

  it("returns explicit local/unknown provenance when deployment metadata is absent", () => {
    expect(getReleaseMetadata({})).toEqual({
      provider: "local",
      environment: "unknown",
      commitSha: null,
      commitRef: null,
      deploymentUrl: null,
      databaseIdentity: null,
    });
  });
});
