import { describe, expect, it } from "vitest";
import { trustedPreviewOrigin } from "./security/deployment-origin.js";
describe("trusted deployment write origin", () => {
  it("accepts the platform's exact Preview hostname", () => {
    expect(
      trustedPreviewOrigin({
        VERCEL: "1",
        VERCEL_ENV: "preview",
        VERCEL_URL: "portfolio-review-123.vercel.app",
      }),
    ).toBe("https://portfolio-review-123.vercel.app");
  });
  it("does not derive a production or local origin", () => {
    for (const values of [
      {},
      { VERCEL: "1", VERCEL_ENV: "production" },
      { VERCEL_ENV: "preview" },
      { VERCEL: "1", VERCEL_ENV: "development" },
    ]) {
      expect(
        trustedPreviewOrigin({
          ...values,
          VERCEL_URL: "portfolio-review-123.vercel.app",
        }),
      ).toBeNull();
    }
  });
  it("rejects schemes, credentials, ports, paths and lookalike domains", () => {
    for (const hostname of [
      "https://review.vercel.app",
      "user@review.vercel.app",
      "review.vercel.app:443",
      "review.vercel.app/path",
      "review.vercel.app.evil.test",
      "localhost",
      "review.other.vercel.app",
      "-review.vercel.app",
      "review-.vercel.app",
    ]) {
      expect(
        trustedPreviewOrigin({
          VERCEL: "1",
          VERCEL_ENV: "preview",
          VERCEL_URL: hostname,
        }),
      ).toBeNull();
    }
  });
});
