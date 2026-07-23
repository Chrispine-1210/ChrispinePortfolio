import type { Express } from "express";
import request from "supertest";
import { afterEach, beforeAll, describe, expect, it, vi } from "vitest";

let app: Express;
let generateToken: (email: string, isAdmin: boolean) => string;
let verifyToken: (
  token: string,
) => { email: string; isAdmin: boolean; iat: number } | null;
let parseEnvironment: typeof import("./env.js").parseEnvironment;

beforeAll(async () => {
  vi.stubEnv("AUTH_SECRET", "test-secret-that-is-long-enough-for-isolated-tests");
  vi.stubEnv("ADMIN_EMAIL", "admin@test.invalid");
  vi.stubEnv("ADMIN_PASSWORD", "isolated-test-password");
  vi.stubEnv("DATABASE_URL", "postgresql://test:test@localhost:5432/test");

  const auth = await import("./custom-auth.js");
  ({ generateToken, verifyToken } = auth);
  ({ parseEnvironment } = await import("./env.js"));
  ({ app } = await import("./app.js"));
});

afterEach(() => {
  vi.useRealTimers();
});

describe("administrative route boundaries", () => {
  const protectedRequests = [
    ["post", "/api/blog"],
    ["put", "/api/blog/00000000-0000-0000-0000-000000000000"],
    ["delete", "/api/blog/00000000-0000-0000-0000-000000000000"],
    ["post", "/api/portfolio"],
    ["put", "/api/portfolio/00000000-0000-0000-0000-000000000000"],
    ["delete", "/api/portfolio/00000000-0000-0000-0000-000000000000"],
    ["get", "/api/email-templates"],
    ["post", "/api/email-templates"],
    ["get", "/api/analytics/stats"],
    ["get", "/api/analytics/events"],
    ["get", "/api/admin/seed-status"],
    ["post", "/api/admin/seed-database"],
  ] as const;

  it.each(protectedRequests)("denies anonymous %s %s", async (method, path) => {
    const response = await request(app)[method](path).send({});

    expect(response.status).toBe(401);
    expect(response.body).toEqual({ message: "Unauthorized" });
  });
});

describe("temporary signed-token containment", () => {
  it("accepts an intact token inside its maximum age", () => {
    const token = generateToken("admin@test.invalid", true);

    expect(verifyToken(token)).toMatchObject({
      email: "admin@test.invalid",
      isAdmin: true,
    });
  });

  it("rejects a modified token", () => {
    const token = generateToken("admin@test.invalid", true);
    const [payload, signature] = token.split(".");
    const replacement = signature[0] === "0" ? "1" : "0";
    const modified = `${payload}.${replacement}${signature.slice(1)}`;

    expect(verifyToken(modified)).toBeNull();
  });

  it("rejects a token beyond seven days", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-07-01T00:00:00Z"));
    const token = generateToken("admin@test.invalid", true);

    vi.setSystemTime(new Date("2026-07-09T00:00:00Z"));
    expect(verifyToken(token)).toBeNull();
  });
});

describe("environment validation", () => {
  it("rejects partially configured administrator authentication", () => {
    expect(() =>
      parseEnvironment({
        NODE_ENV: "production",
        AUTH_SECRET: "a".repeat(32),
      }),
    ).toThrow("must be configured together");
  });

  it("rejects short authentication secrets", () => {
    expect(() =>
      parseEnvironment({
        NODE_ENV: "production",
        AUTH_SECRET: "short",
        ADMIN_EMAIL: "admin@test.invalid",
        ADMIN_PASSWORD: "isolated-test-password",
      }),
    ).toThrow("at least 32 characters");
  });

  it("accepts a complete administrator configuration", () => {
    expect(
      parseEnvironment({
        NODE_ENV: "production",
        AUTH_SECRET: "a".repeat(32),
        ADMIN_EMAIL: "admin@test.invalid",
        ADMIN_PASSWORD: "isolated-test-password",
      }),
    ).toMatchObject({
      NODE_ENV: "production",
      ADMIN_EMAIL: "admin@test.invalid",
    });
  });

  it("requires a database and independent hashing pepper for database authentication", () => {
    expect(() => parseEnvironment({
      NODE_ENV: "production",
      ADMIN_AUTH_MODE: "database",
    })).toThrow("DATABASE_URL is required");

    expect(parseEnvironment({
      NODE_ENV: "production",
      ADMIN_AUTH_MODE: "database",
      DATABASE_URL: "postgresql://test:test@localhost:5432/test",
      AUTH_KEY_PEPPER: "p".repeat(32),
    })).toMatchObject({ ADMIN_AUTH_MODE: "database" });
  });
});
