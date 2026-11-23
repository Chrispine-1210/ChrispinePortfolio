import { randomUUID } from "node:crypto";
import { readFile, readdir } from "node:fs/promises";
import { PGlite } from "@electric-sql/pglite";
import { drizzle } from "drizzle-orm/pglite";
import type { Express } from "express";
import request from "supertest";
import { beforeAll, afterAll, describe, it, expect, vi } from "vitest";
import * as schema from "../shared/schema.js";
import { contextualDatabase } from "./database-context.js";

const native = Boolean(process.env.FINANCIAL_NATIVE_PORT);
let database: any, engine: any, app: Express, cookie: string, actor: string;
vi.mock("./db.js", () => ({ db: contextualDatabase(engine) }));
async function principal() {
  const { rows: [user] } = await database.query("INSERT INTO users(email) VALUES($1) RETURNING id,security_version", [`${randomUUID()}@test.invalid`]);
  await database.query("INSERT INTO user_roles(user_id,role_id) SELECT $1,id FROM roles WHERE key='finance_manager'", [user.id]);
  const { getDatabaseAuthRuntime } = await import("./security/database-auth-routes.js");
  const session = await getDatabaseAuthRuntime().sessions.issue({ userId: user.id, userSecurityVersion: user.security_version });
  return { actor: user.id as string, cookie: `admin_session=${session.token}` };
}
beforeAll(async () => {
  vi.stubEnv("ADMIN_AUTH_MODE", "database"); vi.stubEnv("DATABASE_URL", "postgresql://fixture:fixture@localhost/fixture");
  vi.stubEnv("AUTH_KEY_PEPPER", "local-financial-idempotency-fixture-pepper");
  vi.spyOn(console, "error").mockImplementation(() => {});
  if (native) {
    const port = Number(process.env.FINANCIAL_NATIVE_PORT);
    if (!Number.isInteger(port) || port < 1024 || port > 65535 || !process.env.FINANCIAL_NATIVE_QA) throw Error("Native QA boundary refused");
    // 'pg' is supplied externally by the disposable native QA runner only.
    const pg = (await import("pg")).default;
    const pool = new pg.Pool({ host: "127.0.0.1", port, user: "postgres", database: "financial_qa", max: 8 });
    database = { query: pool.query.bind(pool), exec: pool.query.bind(pool), close: pool.end.bind(pool) };
    engine = (await import("drizzle-orm/node-postgres")).drizzle({ client: pool, schema });
  } else { database = new PGlite(); engine = drizzle(database, { schema }); }
  for (const file of (await readdir("migrations")).filter(name => /^\d{4}_.*\.sql$/.test(name)).sort()) await database.exec(await readFile(`migrations/${file}`, "utf8"));
  ({ app } = await import("./app.js"));
  ({ actor, cookie } = await principal());
});
afterAll(async () => { await database?.close(); vi.unstubAllEnvs(); });
const path = "/api/admin/treasury/operating-expenses";
const payload = () => ({ currency: "XTS", amount: 10, category: "software_tools", occurredAt: new Date(Date.now() - 1000).toISOString(), sourceReference: `receipt-${randomUUID()}` });
const post = (key: string, body: object, session = cookie) => request(app).post(path).set("Cookie", session).set("Idempotency-Key", key).send(body);
const lookup = (key: string, session = cookie) => request(app).get(`/api/admin/financial-requests/${key}`).set("Cookie", session);
const count = async (table: string) => Number((await database.query(`SELECT count(*) AS total FROM ${table}`)).rows[0].total);

describe(`persistent financial receipts (${native ? "native PostgreSQL" : "PGlite"})`, () => {
  it("requires authentication before validating a key, then refuses missing/invalid references", async () => {
    await request(app).post(path).send(payload()).expect(401);
    const before = await count("operating_expense_entries");
    await request(app).post(path).set("Cookie", cookie).send(payload()).expect(400);
    await post("too-short", payload()).expect(400);
    await request(app).post(path).set("Cookie", cookie).set("X-Financial-Actor", "different-account").set("Idempotency-Key", randomUUID()).send(payload()).expect(409);
    expect(await count("operating_expense_entries")).toBe(before);
  });
  it("replays the exact committed status/body without a second mutation or audit", async () => {
    const key = randomUUID(), body = payload(), before = await count("audit_events");
    const accepted = await post(key, body).expect(201);
    const replay = await post(key, { ...body }).expect(201);
    expect(replay.body).toEqual(accepted.body);
    expect(replay.headers["idempotency-replayed"]).toBe("true");
    expect(replay.headers["x-original-request-id"]).toBe(accepted.headers["x-request-id"]);
    expect(await count("audit_events")).toBe(before + 1);
    const receipt = await lookup(key).expect(200);
    expect(receipt.body).toMatchObject({ state: "recorded", status: 201, result: accepted.body });
  });
  it("conflicts on changed payload and cross-action reuse before writing", async () => {
    const key = randomUUID(), body = payload(); await post(key, body).expect(201);
    const before = await count("operating_expense_entries");
    expect((await post(key, { ...body, amount: 11 }).expect(409)).body.code).toBe("IDEMPOTENCY_CONFLICT");
    await request(app).post("/api/admin/treasury/tax-provisions").set("Cookie", cookie).set("Idempotency-Key", key).send({}).expect(409);
    expect(await count("operating_expense_entries")).toBe(before);
  });
  it("returns the original rejection after state/input validation, without creating a record", async () => {
    const key = randomUUID(); const first = await post(key, {}).expect(400);
    const second = await post(key, {}).expect(400);
    expect(second.body).toEqual(first.body); expect(second.headers["idempotency-replayed"]).toBe("true");
    expect((await lookup(key)).body.status).toBe(400);
  });
  it("retains receipts across app reconstruction and canonical property order", async () => {
    const key = randomUUID(), body = payload(), first = await post(key, body).expect(201);
    const { createApp } = await import("./app.js"); app = createApp();
    const replay = await post(key, Object.fromEntries(Object.entries(body).reverse())).expect(201);
    expect(replay.body).toEqual(first.body); expect(replay.headers["idempotency-replayed"]).toBe("true");
  });
  it("keeps actors separate and never reveals another account's result", async () => {
    const other = await principal(), key = randomUUID(), body = payload();
    await post(key, body).expect(201);
    expect((await lookup(key, other.cookie)).body.state).toBe("unconfirmed");
    const second = await post(key, body, other.cookie).expect(201);
    expect(second.headers["idempotency-replayed"]).toBe("false");
  });
  it("rechecks live permissions for both replay and receipt recovery", async () => {
    const user = await principal(), key = randomUUID(), body = payload(); await post(key, body, user.cookie).expect(201);
    await database.query("DELETE FROM user_roles WHERE user_id=$1", [user.actor]);
    await post(key, body, user.cookie).expect(403); await lookup(key, user.cookie).expect(403);
  });
  it("does not classify a missing/in-flight receipt as failure or permission to use a new key", async () => {
    const result = await lookup(randomUUID()).expect(200);
    expect(result.body).toMatchObject({ state: "unconfirmed" });
    expect(result.body.message).toContain("may still be running");
    expect(result.body.message).toContain("Do not submit with a new reference");
  });
  it("rolls back mutation, audit and receipt if receipt persistence fails", async () => {
    const before = [await count("operating_expense_entries"), await count("audit_events"), await count("financial_request_receipts")];
    await database.exec("CREATE FUNCTION reject_receipt_fixture() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN RAISE EXCEPTION 'private fixture'; END; $$; CREATE TRIGGER reject_receipt_fixture BEFORE INSERT ON financial_request_receipts FOR EACH ROW EXECUTE FUNCTION reject_receipt_fixture();");
    const key = randomUUID(), body = payload();
    try { const failed = await post(key, body).expect(500); expect(failed.body.code).toBe("WRITE_OUTCOME_UNKNOWN"); }
    finally { await database.exec("DROP TRIGGER reject_receipt_fixture ON financial_request_receipts; DROP FUNCTION reject_receipt_fixture();"); }
    expect([await count("operating_expense_entries"), await count("audit_events"), await count("financial_request_receipts")]).toEqual(before);
    await post(key, body).expect(201);
  });
  it("rejects mutation/deletion of committed receipts", async () => {
    const key = randomUUID(); await post(key, payload()).expect(201);
    await expect(database.query("UPDATE financial_request_receipts SET response_status=200 WHERE actor_user_id=$1 AND request_key=$2", [actor, key])).rejects.toMatchObject({ code: "P0001" });
    await expect(database.query("DELETE FROM financial_request_receipts WHERE actor_user_id=$1 AND request_key=$2", [actor, key])).rejects.toMatchObject({ code: "P0001" });
  });
  it.runIf(native)("serializes simultaneous same-reference requests on real independent sessions", async () => {
    const key = randomUUID(), body = payload(); const before = await count("operating_expense_entries");
    const results = await Promise.all(Array.from({ length: 6 }, () => post(key, body)));
    expect(results.map(result => result.status)).toEqual(Array(6).fill(201));
    expect(new Set(results.map(result => result.body.id)).size).toBe(1);
    expect(results.filter(result => result.headers["idempotency-replayed"] === "false").length).toBe(1);
    expect(await count("operating_expense_entries")).toBe(before + 1);
  });
  it.runIf(native)("leaves an in-flight receipt unconfirmed and replays it after completion", async () => {
    const key = randomUUID(), body = payload();
    await database.exec("CREATE FUNCTION slow_expense_fixture() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN PERFORM pg_sleep(0.5); RETURN NEW; END; $$; CREATE TRIGGER slow_expense_fixture BEFORE INSERT ON operating_expense_entries FOR EACH ROW EXECUTE FUNCTION slow_expense_fixture();");
    try {
      const pending = post(key, body).then(result => result);
      // Wait for a native session to enter the business trigger, not a guessed delay.
      let active = false;
      for (let i = 0; i < 50 && !active; i++) {
        const result = await database.query("SELECT count(*) AS total FROM pg_stat_activity WHERE datname='financial_qa' AND wait_event='PgSleep'");
        active = Number(result.rows[0].total) > 0;
        if (!active) await new Promise(resolve => setTimeout(resolve, 10));
      }
      expect(active).toBe(true); expect((await lookup(key)).body.state).toBe("unconfirmed");
      const result = await pending; expect(result.status).toBe(201);
      expect((await post(key, body).expect(201)).body).toEqual(result.body);
    } finally { await database.exec("DROP TRIGGER slow_expense_fixture ON operating_expense_entries; DROP FUNCTION slow_expense_fixture();"); }
  });
  it.runIf(native)("recovers a committed result after the HTTP client disconnects during execution", async () => {
    const key = randomUUID(), body = payload(), before = await count("operating_expense_entries");
    await database.exec("CREATE FUNCTION lost_response_fixture() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN PERFORM pg_sleep(0.5); RETURN NEW; END; $$; CREATE TRIGGER lost_response_fixture BEFORE INSERT ON operating_expense_entries FOR EACH ROW EXECUTE FUNCTION lost_response_fixture();");
    const server = app.listen(0, "127.0.0.1"); await new Promise<void>(yes => server.once("listening", yes));
    try {
      const address = server.address(); if (!address || typeof address === "string") throw Error("No loopback listener");
      const controller = new AbortController();
      const lost = fetch(`http://127.0.0.1:${address.port}${path}`, { method: "POST", headers: { Cookie: cookie, "Idempotency-Key": key, "Content-Type": "application/json" }, body: JSON.stringify(body), signal: controller.signal }).catch(error => error);
      let active = false;
      for (let i = 0; i < 50 && !active; i++) {
        active = Number((await database.query("SELECT count(*) AS total FROM pg_stat_activity WHERE datname='financial_qa' AND wait_event='PgSleep'")).rows[0].total) > 0;
        if (!active) await new Promise(resolve => setTimeout(resolve, 10));
      }
      expect(active).toBe(true); controller.abort(); expect(await lost).toBeInstanceOf(Error);
      let receipt: any;
      for (let i = 0; i < 100; i++) {
        receipt = (await lookup(key)).body; if (receipt.state === "recorded") break;
        await new Promise(resolve => setTimeout(resolve, 10));
      }
      expect(receipt.state).toBe("recorded");
      expect((await post(key, body).expect(201)).body).toEqual(receipt.result);
      expect(await count("operating_expense_entries")).toBe(before + 1);
    } finally {
      await new Promise<void>(yes => server.close(() => yes()));
      await database.exec("DROP TRIGGER lost_response_fixture ON operating_expense_entries; DROP FUNCTION lost_response_fixture();");
    }
  });
});
