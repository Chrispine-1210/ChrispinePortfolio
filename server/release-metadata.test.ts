import { describe, expect, it } from "vitest";
import { getReleaseMetadata } from "./release-metadata.js";

describe("release metadata", () => {
  it("exposes only non-secret deployment provenance and prioritizes Vercel git identity", () => {
    const metadata = getReleaseMetadata({
      NODE_ENV: "production",
      VERCEL: "1",
      VERCEL_ENV: "preview",
      VERCEL_GIT_COMMIT_SHA: "vercel-sha",
      GIT_COMMIT_SHA: "fallback-sha",
      VERCEL_GIT_COMMIT_REF: "maintenance/runtime-certification",
      VERCEL_URL: "preview.example.vercel.app",
      AUTH_SECRET: "must-not-leak",
      DATABASE_URL: "postgres://must-not-leak",
    });

    expect(metadata).toEqual({
      provider: "vercel",
      environment: "preview",
      commitSha: "vercel-sha",
      commitRef: "maintenance/runtime-certification",
      deploymentUrl: "preview.example.vercel.app",
    });
    expect(JSON.stringify(metadata)).not.toContain("must-not-leak");
  });

  it("returns explicit local/unknown provenance when deployment metadata is absent", () => {
    expect(getReleaseMetadata({})).toEqual({
      provider: "local",
      environment: "unknown",
      commitSha: null,
      commitRef: null,
      deploymentUrl: null,
    });
  });
});
