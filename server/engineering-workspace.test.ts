import { readFile, readdir } from "node:fs/promises";
import { randomUUID } from "node:crypto";
import { PGlite } from "@electric-sql/pglite";
import { drizzle } from "drizzle-orm/pglite";
import express, { type Express } from "express";
import { requestContext, safeApiError } from "./security/http-boundary.js";
import request from "supertest";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import * as schema from "../shared/schema.js";
import {
  emptyDetails,
  mediaReference,
  publicationInput,
  recordInput,
  type RecordKind,
} from "../shared/engineering.js";
const database = new PGlite();
vi.mock("./db.js", () => ({ db: drizzle(database, { schema }) }));
let app: Express;
let owner: { cookie: string; id: string },
  other: { cookie: string; id: string },
  reader: { cookie: string; id: string };
const base = "/api/admin/engineering",
  origin = "https://portfolio.test";
beforeAll(async () => {
  vi.stubEnv("ADMIN_AUTH_MODE", "database");
  vi.stubEnv("DATABASE_URL", "postgresql://test:test@localhost/test");
  vi.stubEnv("AUTH_KEY_PEPPER", "isolated-engineering-test-pepper-only");
  vi.stubEnv("APP_BASE_URL", origin);
  for (const file of (await readdir("migrations"))
    .filter((f) => /^\d{4}_.*\.sql$/.test(f))
    .sort())
    await database.exec(await readFile(`migrations/${file}`, "utf8"));
  await database.exec(
    "insert into roles(key,name) values('engineering_reader','Reader'); insert into role_permissions(role_id,permission_id) select r.id,p.id from roles r,permissions p where r.key='engineering_reader' and p.key='engineering.read';",
  );
  const { getDatabaseAuthRuntime } = await import(
    "./security/database-auth-routes.js"
  );
  async function account(name: string, role: string) {
    const {
      rows: [user],
    } = await database.query<{ id: string; security_version: number }>(
      "insert into users(email) values($1) returning id,security_version",
      [name + "@test.invalid"],
    );
    await database.query(
      "insert into user_roles(user_id,role_id) select $1,id from roles where key=$2",
      [user.id, role],
    );
    const session = await getDatabaseAuthRuntime().sessions.issue({
      userId: user.id,
      userSecurityVersion: user.security_version,
    });
    return { id: user.id, cookie: `admin_session=${session.token}` };
  }
  owner = await account("engineering-owner", "super_administrator");
  other = await account("engineering-other", "administrator");
  reader = await account("engineering-reader", "engineering_reader");
  ({ app } = await import("./app.js"));
});
afterAll(async () => {
  vi.unstubAllEnvs();
  await database.close();
});
function input(kind: RecordKind = "diary", context = "personal") {
  return {
    context,
    kind,
    title: "Investigate a real engineering question",
    summary:
      "Private operating note: never copied automatically to a public field note.",
    workDate: "2026-11-18",
    dueDate: null,
    status: "draft",
    priority: 2,
    accountable: "Operator",
    evidence: [],
    details: emptyDetails(kind, "2026-11-18"),
  };
}
const post = (path: string, body: unknown, cookie?: string) =>
  request(app)
    .post(path)
    .set("Origin", origin)
    .set("Cookie", cookie ?? owner.cookie)
    .send(body);
const create = (record = input(), cookie?: string) =>
  post(base + "/records", { record, requestKey: randomUUID() }, cookie);
const patch = (
  id: string,
  record: unknown,
  expectedVersion: number,
  cookie?: string,
) =>
  request(app)
    .patch(base + "/records/" + id)
    .set("Origin", origin)
    .set("Cookie", cookie ?? owner.cookie)
    .send({ record, expectedVersion, requestKey: randomUUID() });

describe("engineering workspace boundaries", () => {
  it("accepts share-link metadata on reads without relaxing filters, authentication or write bodies", async () => {
    const metadata = { _vercel_share: "synthetic-preview-link" };
    const publicList = await request(app)
      .get("/api/journey")
      .query(metadata)
      .expect(200);
    expect(publicList.body.data).toEqual([]);
    expect(publicList.text).not.toContain(metadata._vercel_share);
    await request(app)
      .get("/api/journey")
      .query({ ...metadata, limit: 25 })
      .expect(400);
    await request(app)
      .get("/api/journey")
      .query({ ...metadata, topic: "unknown" })
      .expect(400);
    await request(app)
      .get(base + "/records")
      .query(metadata)
      .expect(401);
    await request(app)
      .get(base + "/records")
      .query({ ...metadata, context: "personal" })
      .set("Cookie", owner.cookie)
      .expect(200);
    await request(app)
      .get(base + "/records")
      .query({ ...metadata, context: "unknown" })
      .set("Cookie", owner.cookie)
      .expect(400);
    await request(app)
      .get(base + "/records")
      .query({ ...metadata, limit: 101 })
      .set("Cookie", owner.cookie)
      .expect(400);
    await post(base + "/records", {
      record: input(),
      requestKey: randomUUID(),
      ...metadata,
    }).expect(400);
  });
  it("keeps additive migration replay safe without changing records or history", async () => {
    await database.exec(
      await readFile("migrations/0011_engineering_workspace.sql", "utf8"),
    );
    const p = await database.query(
      "select count(*)::int as count from permissions where key like 'engineering.%'",
    );
    expect(p.rows).toEqual([{ count: 3 }]);
  });
  it("requires database permissions, ownership and a same-origin JSON write", async () => {
    await request(app)
      .get(base + "/records")
      .expect(401);
    await request(app)
      .get(base + "/records")
      .set("Cookie", reader.cookie)
      .expect(200);
    await create(input(), reader.cookie).expect(403);
    await request(app)
      .post(base + "/records")
      .set("Cookie", owner.cookie)
      .set("Origin", "https://external.test")
      .send({ record: input(), requestKey: randomUUID() })
      .expect(403);
    await request(app)
      .post(base + "/records")
      .set("Cookie", owner.cookie)
      .send({ record: input(), requestKey: randomUUID() })
      .expect(403);
  });
  it("is retry-safe, rejects request-key reuse and preserves immutable version history", async () => {
    const body = { record: input(), requestKey: randomUUID() };
    const first = await post(base + "/records", body)
      .expect(201)
      .expect("Cache-Control", "no-store");
    const replay = await post(base + "/records", body)
      .expect(201)
      .expect("Idempotency-Replayed", "true");
    expect(replay.body.id).toBe(first.body.id);
    await post(base + "/records", {
      ...body,
      record: { ...body.record, title: "Conflicting request" },
    }).expect(409);
    const revised = {
      ...body.record,
      title: "Document the corrected engineering question",
    };
    await patch(first.body.id, revised, 1).expect(200);
    await patch(first.body.id, body.record, 1).expect(409);
    await patch(first.body.id, revised, 2, other.cookie).expect(404);
    await request(app)
      .get(base + `/records/${first.body.id}/history`)
      .set("Cookie", other.cookie)
      .expect(404);
    const history = await request(app)
      .get(base + `/records/${first.body.id}/history`)
      .set("Cookie", owner.cookie)
      .expect(200);
    expect(history.body.map((r: { version: number }) => r.version)).toEqual([
      2, 1,
    ]);
    await expect(
      database.query(
        "update engineering_versions set snapshot='{}'::jsonb where record_id=$1",
        [first.body.id],
      ),
    ).rejects.toThrow(/immutable/);
    await patch(first.body.id, { ...revised, context: "sudern" }, 2).expect(
      409,
    );
    await expect(
      database.query(
        "update engineering_records set owner_user_id=$1 where id=$2",
        [other.id, first.body.id],
      ),
    ).rejects.toThrow(/identity is immutable/);
  });
  it("keeps the public journal empty until an explicit reviewed, sanitized snapshot publishes", async () => {
    const record = { ...input(), title: "PRIVATE internal operating title" };
    const row = await create(record).expect(201);
    const publicCopy = {
      slug: "dns-lab-review",
      title: "What a DNS lab taught me",
      summary:
        "A personal lab note about distinguishing IP connectivity from DNS resolution.",
      body: "This controlled exercise compares raw IP reachability with name resolution, records the commands used, and separates a test result from a production operating claim. No client data is included.",
      learning: "Test a falsifiable hypothesis before changing configuration.",
      topic: "networking",
      mediaUrl: "https://www.youtube.com/watch?v=M7lc1UVf-VE",
      imageUrl: "",
      imageAlt: "",
      evidenceLevel: "self_reported",
      evidenceUrls: [],
      limitations:
        "This is a personal lab report, not proof of production network performance.",
      disclosureReviewed: true,
      expectedVersion: 1,
      requestKey: randomUUID(),
    };
    await post(base + `/records/${row.body.id}/publish`, publicCopy).expect(
      409,
    );
    const prepared = { ...record, status: "review" };
    await patch(row.body.id, prepared, 1).expect(200);
    await post(base + `/records/${row.body.id}/publish`, {
      ...publicCopy,
      expectedVersion: 2,
      mediaUrl: "https://www.youtube.com.attacker.test/watch?v=M7lc1UVf-VE",
    }).expect(400);
    await post(base + `/records/${row.body.id}/publish`, {
      ...publicCopy,
      expectedVersion: 2,
      body:
        publicCopy.body +
        " postgresql://user:private-password@db.example/database",
    }).expect(400);
    const published = await post(base + `/records/${row.body.id}/publish`, {
      ...publicCopy,
      expectedVersion: 2,
      requestKey: randomUUID(),
    }).expect(201);
    const detail = await request(app)
      .get("/api/journey/dns-lab-review")
      .expect(200);
    expect(detail.text).not.toMatch(
      /PRIVATE|Private operating note|ownerUserId|details|recordId/,
    );
    expect(detail.body.title).toBe(publicCopy.title);
    await patch(
      row.body.id,
      { ...prepared, summary: "PRIVATE later revision" },
      2,
    ).expect(200);
    expect(
      (await request(app).get("/api/journey/dns-lab-review").expect(200)).body
        .summary,
    ).toBe(publicCopy.summary);
    await expect(
      database.query(
        "update engineering_publications set snapshot='{}'::jsonb where id=$1",
        [published.body.id],
      ),
    ).rejects.toThrow(/immutable/);
    await expect(
      database.query("delete from engineering_publications where id=$1", [
        published.body.id,
      ]),
    ).rejects.toThrow(/immutable/);
    const listings = await request(app)
      .get(base + "/publications?context=personal")
      .set("Cookie", owner.cookie)
      .expect(200);
    expect(listings.body.data[0].currentVersion).toBe(3);
    await post(
      base + `/publications/${published.body.id}/withdraw`,
      {
        expectedVersion: 3,
        requestKey: randomUUID(),
        justification: "Withdraw the reviewed test publication",
      },
      other.cookie,
    ).expect(404);
    await post(base + `/publications/${published.body.id}/withdraw`, {
      expectedVersion: 3,
      requestKey: randomUUID(),
      justification: "Withdraw the reviewed test publication",
    }).expect(200);
    await request(app).get("/api/journey/dns-lab-review").expect(404);
    expect(
      (await request(app).get("/api/journey").expect(200)).body.data,
    ).toHaveLength(0);
  });
  it("enforces task prerequisites, cross-context isolation and cycle rejection", async () => {
    const task = input("task");
    task.details = {
      acceptance: "A documented test result exists",
      result: "",
      dependencies: [],
      impact: "delivery",
      effortMinutes: 30,
    };
    const a = await create({
      ...task,
      title: "Prepare the test fixture",
    }).expect(201);
    const bRecord = {
      ...task,
      title: "Run the acceptance check",
      details: { ...task.details, dependencies: [a.body.id] },
    };
    const b = await create(bRecord).expect(201);
    await create({ ...bRecord, context: "sudern" }).expect(400);
    await patch(
      a.body.id,
      { ...task, details: { ...task.details, dependencies: [b.body.id] } },
      1,
    ).expect(409);
    await patch(
      b.body.id,
      {
        ...bRecord,
        status: "done",
        details: {
          ...bRecord.details,
          result: "Completed the acceptance check",
        },
      },
      1,
    ).expect(409);
    await patch(
      a.body.id,
      {
        ...task,
        status: "done",
        details: { ...task.details, result: "Fixture verified" },
      },
      1,
    ).expect(200);
    await patch(
      b.body.id,
      {
        ...bRecord,
        status: "done",
        details: {
          ...bRecord.details,
          result: "Completed the acceptance check",
        },
      },
      1,
    ).expect(200);
    await patch(a.body.id, { ...task, status: "active" }, 2).expect(409);
    await patch(b.body.id, { ...bRecord, status: "active" }, 2).expect(200);
    await patch(a.body.id, { ...task, status: "active" }, 2).expect(200);
  });
  it("counts work once, across contexts, and rejects a day longer than 24 hours", async () => {
    const record = input("work_log");
    record.details = {
      minutes: 1000,
      category: "delivery",
      result: "Recorded actual test-fixture work",
      relatedEntries: [],
    };
    await create(record).expect(201);
    await create({
      ...record,
      context: "aothothe",
      details: { ...record.details, minutes: 500 },
    }).expect(409);
    const brief = await request(app)
      .get(base + "/brief?context=personal")
      .set("Cookie", owner.cookie)
      .expect(200);
    expect(brief.body.complete).toBe(true);
    expect(brief.body.method).toMatch(/Rule-based/);
    expect(
      brief.body.dailyEffort.find(
        (d: { date: string }) => d.date === "2026-11-18",
      ).minutes,
    ).toBe(1000);
  });
  it("cannot claim connected telemetry and accepts events only for an authorized owned asset", async () => {
    const asset = input("asset");
    asset.details = {
      layer: "endpoint",
      identifier: "QA lab endpoint",
      criticality: "high",
      authorized: false,
      monitoring: "not_connected",
      source: "",
      lastObservedAt: null,
      recoveryPlan: "",
    };
    await create({
      ...asset,
      details: { ...asset.details, monitoring: "telemetry" },
    }).expect(400);
    const a = await create(asset).expect(201);
    const event = input("security_event");
    event.details = {
      assetId: a.body.id,
      observedAt: new Date().toISOString(),
      severity: "medium",
      source: "Manual log review",
      finding: "Unfamiliar connection; ownership not established",
      disposition: "untriaged",
      response: "",
    };
    await create(event).expect(403);
    await patch(
      a.body.id,
      { ...asset, details: { ...asset.details, authorized: true } },
      1,
    ).expect(200);
    await create(event).expect(201);
    await create(event, other.cookie).expect(400);
    const state = await request(app)
      .get(base + "/connections")
      .set("Cookie", owner.cookie)
      .expect(200);
    expect(state.body.capabilities.telemetry).toBe("Not connected");
    expect(
      state.body.connections.some(
        (c: { access: string }) => c.access === "Owner-restricted",
      ),
    ).toBe(true);
  });
  it("applies a shared database write limit, and returns a safe correlation ID", async () => {
    await database.query(
      "insert into engineering_requests(actor_user_id,request_key,fingerprint,response) select $1,gen_random_uuid()::text,'fixture','{}'::jsonb from generate_series(1,60)",
      [other.id],
    );
    const res = await create(input(), other.cookie)
      .expect(429)
      .expect("Retry-After", "60");
    expect(res.body.code).toBe("RATE_LIMITED");
    expect(res.body.requestId).toMatch(/^[0-9a-f-]{36}$/);
  });
  it("conceals raw driver failures while preserving a diagnostic correlation ID", async () => {
    const boundary = express();
    boundary.use(requestContext);
    boundary.get("/failure", () => {
      throw new Error(
        "postgresql://owner:never-disclose@private-host/db SQL query sensitive-table",
      );
    });
    boundary.use(safeApiError);
    const failed = await request(boundary)
      .get("/failure")
      .expect(500)
      .expect("Cache-Control", "no-store");
    expect(failed.body.requestId).toBe(failed.headers["x-request-id"]);
    expect(failed.text).not.toMatch(
      /never-disclose|private-host|sensitive-table|stack|postgres/,
    );
  });
  it("handles unknown API paths, invalid JSON and oversized bodies without disclosing internals", async () => {
    await request(app).get("/api/engineering-missing-route").expect(404);
    const malformed = await request(app)
      .post(base + "/records")
      .set("Content-Type", "application/json")
      .send('{"private":"unterminated')
      .expect(400);
    expect(malformed.text).not.toMatch(
      /unterminated|SyntaxError|stack|postgres/,
    );
    const large = await request(app)
      .post(base + "/records")
      .send({ private: "never return this value ".repeat(1000) })
      .expect(413);
    expect(large.body.code).toBe("PAYLOAD_TOO_LARGE");
    expect(large.text).not.toMatch(/never return this value/);
  });
});

describe("engineering domain input", () => {
  it("rejects credential-shaped input and an unreviewed completed AI run", () => {
    expect(
      recordInput.safeParse({
        ...input(),
        summary: "postgresql://user:private-password@db.example/database",
      }).success,
    ).toBe(false);
    const ai = input("ai_review");
    expect(recordInput.safeParse({ ...ai, status: "done" }).success).toBe(
      false,
    );
    expect(
      publicationInput.safeParse({ body: "-----BEGIN PRIVATE KEY-----" })
        .success,
    ).toBe(false);
  });
  it("constructs only allowlisted, canonical media sources", () => {
    expect(
      mediaReference("https://youtu.be/M7lc1UVf-VE?anything=ignored")?.embedUrl,
    ).toBe("https://www.youtube-nocookie.com/embed/M7lc1UVf-VE");
    expect(mediaReference("https://vimeo.com/123456789")?.embedUrl).toBe(
      "https://player.vimeo.com/video/123456789",
    );
    expect(
      mediaReference(
        "https://www.instagram.com/p/example/?access_token=private",
      )?.url,
    ).toBe("https://www.instagram.com/p/example/");
    for (const url of [
      "javascript:alert(1)",
      "https://www.youtube.com.evil.test/watch?v=M7lc1UVf-VE",
      "https://user:pass@youtube.com/watch?v=M7lc1UVf-VE",
      "http://youtube.com/watch?v=M7lc1UVf-VE",
    ])
      expect(mediaReference(url)).toBeNull();
  });
});
