import { readFile, readdir } from "node:fs/promises";
import { PGlite } from "@electric-sql/pglite";
import { drizzle } from "drizzle-orm/pglite";
import type { Express } from "express";
import express from "express";
import request from "supertest";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import * as schema from "../shared/schema.js";
import { ApiError, asyncHandler } from "./middleware.js";
import { requestContext, safeApiError } from "./security/http-boundary.js";

const database = new PGlite();
vi.mock("./db.js", () => ({ db: drizzle(database, { schema }) }));
let app: Express;
let cookie: string;

beforeAll(async () => {
  vi.stubEnv("ADMIN_AUTH_MODE", "database");
  vi.stubEnv("DATABASE_URL", "postgresql://test:test@localhost/test");
  vi.stubEnv("AUTH_KEY_PEPPER", "isolated-api-reliability-test-pepper");
  for (const file of (await readdir("migrations")).filter(name => /^\d{4}_.*\.sql$/.test(name)).sort()) {
    await database.exec(await readFile(`migrations/${file}`, "utf8"));
  }
  const { rows: [user] } = await database.query<{ id: string; security_version: number }>(
    "insert into users (email) values ('reliability@test.invalid') returning id, security_version",
  );
  await database.query("insert into user_roles (user_id, role_id) select $1, id from roles where key = 'super_administrator'", [user.id]);
  const { getDatabaseAuthRuntime } = await import("./security/database-auth-routes.js");
  const session = await getDatabaseAuthRuntime().sessions.issue({ userId: user.id, userSecurityVersion: user.security_version });
  cookie = `admin_session=${session.token}`;
  ({ app } = await import("./app.js"));
});

afterAll(async () => {
  vi.unstubAllEnvs();
  await database.close();
});

function expectSafeFailure(response: request.Response, code: string) {
  expect(response.headers["cache-control"]).toBe("no-store");
  expect(response.headers["x-request-id"]).toMatch(/^[\da-f-]{36}$/);
  expect(response.body).toMatchObject({ code, requestId: response.headers["x-request-id"] });
  expect(JSON.stringify(response.body)).not.toMatch(/postgres|select |insert |password|tokenHash|stack|params:/i);
}

describe("application failure completion", () => {
  it("answers malformed unsubscribe input without database access or a hanging request", async () => {
    const response = await request(app).post("/api/newsletter/unsubscribe").send({ token: "short" })
      .timeout({ response: 1500, deadline: 3000 }).expect(400);
    expectSafeFailure(response, "INVALID_REQUEST");
    expect(response.body.fields[0].path).toEqual(["token"]);
  });

  it("returns a bounded malformed-JSON response", async () => {
    const response = await request(app).post("/api/newsletter/unsubscribe")
      .set("Content-Type", "application/json").send('{"token":')
      .timeout({ response: 1500, deadline: 3000 }).expect(400);
    expectSafeFailure(response, "INVALID_REQUEST");
  });

  it("retains the small public intake limit", async () => {
    const response = await request(app).post("/api/contact").send({ message: "x".repeat(11_000) })
      .timeout({ response: 1500, deadline: 3000 }).expect(413);
    expectSafeFailure(response, "PAYLOAD_TOO_LARGE");
  });

  it.each([
    ["content", "blog_posts", "/api/admin/content/posts"],
    ["portfolio", "projects", "/api/admin/projects"],
    ["revenue", "recurring_revenue_agreements", "/api/admin/revenue/agreements"],
    ["capital", "commercial_invoices", "/api/admin/capital/invoices"],
    ["treasury", "treasury_accounts", "/api/admin/treasury/accounts"],
    ["email", "email_outbox", "/api/admin/email/outbox"],
    ["campaigns", "notification_campaigns", "/api/admin/campaigns"],
    ["engineering", "engineering_records", "/api/admin/engineering/records"],
  ])("completes %s database failures through the real authenticated app", async (_domain, table, endpoint) => {
    const log = vi.spyOn(console, "error").mockImplementation(() => {});
    await database.exec(`alter table ${table} rename to unavailable_fixture`);
    try {
      const status = _domain === "engineering" ? 503 : 500;
      const response = await request(app).get(endpoint).set("Cookie", cookie)
        .timeout({ response: 1500, deadline: 3000 }).expect(status);
      expectSafeFailure(response, status === 503 ? "SERVICE_UNAVAILABLE" : "INTERNAL_ERROR");
      expect(JSON.stringify(log.mock.calls)).not.toContain("unavailable_fixture");
      expect(JSON.stringify(log.mock.calls)).not.toContain(cookie);
    } finally {
      await database.exec(`alter table unavailable_fixture rename to ${table}`);
    }
  });

  it("keeps authorization ahead of domain validation and queries", async () => {
    await request(app).post("/api/admin/campaigns").send({}).expect(401);
    const response = await request(app).post("/api/admin/campaigns").set("Cookie", cookie).send({})
      .timeout({ response: 1500, deadline: 3000 }).expect(400);
    expectSafeFailure(response, "INVALID_REQUEST");
  });

  it("maps an actual unique-constraint violation without exposing the duplicated record", async () => {
    const input = { title: "Reliability fixture", slug: "reliability-fixture", excerpt: "Test fixture", content: "Test content", category: "Testing" };
    await request(app).post("/api/admin/content/posts").set("Cookie", cookie).send(input).expect(201);
    const response = await request(app).post("/api/admin/content/posts").set("Cookie", cookie).send(input)
      .timeout({ response: 1500, deadline: 3000 }).expect(409);
    expectSafeFailure(response, "CONFLICT");
    expect(JSON.stringify(response.body)).not.toContain(input.slug);
  });
});

describe("bounded error classification", () => {
  it.each(["post", "put", "patch", "delete"] as const)("does not advise retrying an unconfirmed %s", async method => {
    const fixture = express();
    fixture.use(requestContext);
    fixture[method]("/", asyncHandler(async () => { throw Object.assign(new Error("connection lost after a possible write"), { code: "08006" }); }));
    fixture.use(safeApiError);
    const response = await request(fixture)[method]("/").expect(503);
    expectSafeFailure(response, "WRITE_OUTCOME_UNKNOWN");
    expect(response.headers["retry-after"]).toBeUndefined();
    expect(response.body.message).toContain("Check the record before submitting again");
  });

  it.each([
    ["23505", 409, "CONFLICT"], ["23503", 409, "CONFLICT"],
    ["23502", 400, "INVALID_REQUEST"], ["23514", 400, "INVALID_REQUEST"],
    ["22P02", 400, "INVALID_REQUEST"], ["22003", 400, "INVALID_REQUEST"],
    ["40001", 409, "CONFLICT"], ["40P01", 409, "CONFLICT"],
    ["55P03", 503, "SERVICE_UNAVAILABLE"], ["57014", 503, "SERVICE_UNAVAILABLE"],
    ["08006", 503, "SERVICE_UNAVAILABLE"], ["P0001", 500, "INTERNAL_ERROR"],
  ])("classifies wrapped SQLSTATE %s safely", async (code, status, expectedCode) => {
    const failure = Object.assign(new Error("private database failure password=secret"), { code });
    const fixture = express();
    fixture.use(requestContext);
    fixture.get("/", asyncHandler(async () => { throw new Error("private SQL and params", { cause: failure }); }));
    fixture.use(safeApiError);
    const log = vi.spyOn(console, "error").mockImplementation(() => {});
    const response = await request(fixture).get("/").expect(status);
    expectSafeFailure(response, expectedCode);
    expect(JSON.stringify(log.mock.calls)).not.toMatch(/secret|private SQL|params/);
    if (status === 503) expect(response.headers["retry-after"]).toBe("60");
  });

  it("preserves intentional client errors and redacts server errors", async () => {
    const fixture = express();
    fixture.use(requestContext);
    fixture.get("/client", asyncHandler(async () => { throw new ApiError(403, "Permission required", "FORBIDDEN"); }));
    fixture.get("/server", asyncHandler(async () => { throw new ApiError(500, "secret internals", "PRIVATE"); }));
    fixture.use(safeApiError);
    const denied = await request(fixture).get("/client").expect(403);
    expect(denied.body).toMatchObject({ message: "Permission required", code: "FORBIDDEN" });
    const failed = await request(fixture).get("/server").expect(500);
    expectSafeFailure(failed, "INTERNAL_ERROR");
    expect(JSON.stringify(failed.body)).not.toContain("secret internals");
  });
});
