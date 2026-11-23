import { randomUUID } from "node:crypto";
import { readFile, readdir } from "node:fs/promises";
import { PGlite } from "@electric-sql/pglite";
import { drizzle } from "drizzle-orm/pglite";
import request from "supertest";
import type { Express } from "express";
import { beforeAll, afterAll, describe, expect, it, vi } from "vitest";
import * as schema from "../shared/schema.js";
import { contextualDatabase } from "./database-context.js";
let database: any,
  engine: any,
  app: Express,
  owner: { id: string; cookie: string };
const native = Boolean(process.env.EVOLUTION_NATIVE_PORT);
vi.mock("./db.js", () => ({ db: contextualDatabase(engine) }));
async function account(verified = true, role?: string) {
  const email = `${randomUUID()}@test.invalid`;
  const {
    rows: [user],
  } = await database.query(
    "INSERT INTO users(email,email_verified_at) VALUES($1,$2) RETURNING id,security_version",
    [email, verified ? new Date() : null],
  );
  if (role)
    await database.query(
      "INSERT INTO user_roles(user_id,role_id) SELECT $1,id FROM roles WHERE key=$2",
      [user.id, role],
    );
  const { getDatabaseAuthRuntime } = await import(
    "./security/database-auth-routes.js"
  );
  const session = await getDatabaseAuthRuntime().sessions.issue({
    userId: user.id,
    userSecurityVersion: user.security_version,
  });
  return { id: user.id, email, cookie: `admin_session=${session.token}` };
}
beforeAll(async () => {
  for (const [key, value] of Object.entries({
    TZ: "UTC",
    ADMIN_AUTH_MODE: "database",
    DATABASE_URL: "postgres://fixture:fixture@localhost/fixture",
    AUTH_KEY_PEPPER: "evolution-fixture-pepper-isolated-2026",
    EMAIL_PROVIDER: "postmark",
    POSTMARK_SERVER_TOKEN: "POSTMARK_API_TEST",
    POSTMARK_FROM_EMAIL: "sender@test.invalid",
    POSTMARK_WEBHOOK_USERNAME: "fixture",
    POSTMARK_WEBHOOK_PASSWORD: "fixture-webhook-password-32-characters",
    APP_BASE_URL: "https://acceptance.test.invalid",
    ACCOUNT_RECOVERY_MODE: "email",
    RECOVERY_EMAIL_ENCRYPTION_KEY: "23".repeat(32),
  }))
    vi.stubEnv(key, value);
  vi.spyOn(console, "error").mockImplementation(() => {});
  if (native) {
    if (process.env.EVOLUTION_NATIVE_QA !== "disposable-loopback")
      throw Error("QA boundary refused");
    const pg = (await import("pg")).default;
    const pool = new pg.Pool({
      host: "127.0.0.1",
      port: Number(process.env.EVOLUTION_NATIVE_PORT),
      user: "postgres",
      database: "evolution_qa",
      max: 8,
    });
    database = {
      query: pool.query.bind(pool),
      exec: pool.query.bind(pool),
      close: pool.end.bind(pool),
    };
    engine = (await import("drizzle-orm/node-postgres")).drizzle({
      client: pool,
      schema,
    });
  } else {
    database = new PGlite();
    engine = drizzle(database, { schema });
  }
  await database.exec("SET TIME ZONE 'UTC'");
  for (const name of (await readdir("migrations"))
    .filter((name) => /^\d{4}_.*\.sql$/.test(name))
    .sort())
    await database.exec(await readFile(`migrations/${name}`, "utf8"));
  ({ app } = await import("./app.js"));
  owner = await account(true, "super_administrator");
});
afterAll(async () => {
  await database?.close();
  vi.unstubAllEnvs();
});
async function recovery(user: { id: string; email: string }) {
  await request(app)
    .post("/api/auth/recovery/request")
    .send({ email: user.email })
    .expect(200);
  const {
    rows: [mail],
  } = await database.query(
    "SELECT * FROM email_outbox WHERE to_email=$1 AND idempotency_key LIKE 'recovery:%' ORDER BY created_at DESC LIMIT 1",
    [user.email],
  );
  const { hydrateSensitiveEmail } = await import(
    "./email/sensitive-content.js"
  );
  const opened = hydrateSensitiveEmail({
    id: mail.id,
    toEmail: mail.to_email,
    fromEmail: mail.from_email,
    fromName: null,
    replyTo: null,
    subject: mail.subject,
    htmlBody: mail.html_body,
    textBody: mail.text_body,
    messageType: "transactional",
    attemptCount: 0,
    maxAttempts: 5,
    metadata: mail.metadata,
  });
  const token = new URL(opened.textBody!.match(/https:\/\/\S+/)![0]).hash.slice(
    7,
  );
  return { mail, token };
}
const reset = (token: string, password = "a-strong-fixture-password") =>
  request(app)
    .post("/api/auth/recovery/complete")
    .send({ token, password, confirmation: password });
describe("account recovery", () => {
  it("sends the same generic response only after the minimum interval for unknown, unverified and known addresses",async()=>{
    const known=await account(),unverified=await account(false),responses=[];
    const server=app.listen(0,"127.0.0.1");await new Promise<void>(resolve=>server.once("listening",resolve));
    try{
      const address=server.address();if(!address||typeof address==="string")throw Error("No local QA listener");
      for(const email of ["unknown@test.invalid",unverified.email,known.email]){
        const began=performance.now();
        const response=await fetch(`http://127.0.0.1:${address.port}/api/auth/recovery/request`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({email})});
        responses.push(await response.json());expect(response.status).toBe(200);expect(performance.now()-began).toBeGreaterThanOrEqual(450);
      }
    }finally{await new Promise<void>(resolve=>server.close(()=>resolve()));}
    expect(responses[0]).toEqual(responses[1]);expect(responses[1]).toEqual(responses[2]);
    expect((await database.query("SELECT count(*)::int AS n FROM account_recovery_tokens WHERE user_id=$1",[unverified.id])).rows[0].n).toBe(0);
  });
  it("stores hashes and encrypted mail, reuses an open request and binds decryption to recipient", async () => {
    const user = await account(),
      { mail, token } = await recovery(user);
    expect(mail.html_body).not.toContain(token);
    expect(JSON.stringify(mail.metadata)).not.toContain(token);
    const rows = (
      await database.query(
        "SELECT token_hash FROM account_recovery_tokens WHERE user_id=$1",
        [user.id],
      )
    ).rows;
    expect(rows[0].token_hash).not.toBe(token);
    expect(rows[0].token_hash).toHaveLength(64);
    const { hydrateSensitiveEmail } = await import(
      "./email/sensitive-content.js"
    );
    expect(() =>
      hydrateSensitiveEmail({
        id: mail.id,
        toEmail: "other@test.invalid",
        metadata: mail.metadata,
      } as any),
    ).toThrow("could not be opened");
    await request(app)
      .post("/api/auth/recovery/request")
      .send({ email: user.email })
      .expect(200);
    expect(
      (
        await database.query(
          "SELECT count(*)::int AS n FROM account_recovery_tokens WHERE user_id=$1",
          [user.id],
        )
      ).rows[0].n,
    ).toBe(1);
  });
  it("changes a password once and invalidates prior sessions and recovery links", async () => {
    const user = await account(),
      { token } = await recovery(user);
    await reset(token).expect(200);
    await request(app)
      .get("/api/auth/user")
      .set("Cookie", user.cookie)
      .expect(401);
    await reset(token).expect(400);
    await request(app)
      .post("/api/auth/login")
      .send({ email: user.email, password: "a-strong-fixture-password" })
      .expect(200);
    const {
      rows: [row],
    } = await database.query(
      "SELECT security_version,password_hash FROM users WHERE id=$1",
      [user.id],
    );
    expect(row.security_version).toBe(2);
    expect(row.password_hash).toMatch(/^\$argon2id\$/);
  });
  it("rejects expired links and mismatched confirmation without changing account state", async () => {
    const user = await account(),
      { token } = await recovery(user);
    await request(app)
      .post("/api/auth/recovery/complete")
      .send({
        token,
        password: "a-strong-fixture-password",
        confirmation: "another-strong-password",
      })
      .expect(400);
    await database.query(
      "UPDATE account_recovery_tokens SET expires_at=now()-interval '1 second' WHERE user_id=$1",
      [user.id],
    );
    await reset(token).expect(400);
    expect(
      (
        await database.query("SELECT security_version FROM users WHERE id=$1", [
          user.id,
        ])
      ).rows[0].security_version,
    ).toBe(1);
  });
  it("rolls back password, token, sessions and confirmation when audit persistence fails",async()=>{
    const user=await account(),{token}=await recovery(user);
    await database.exec("CREATE FUNCTION reject_recovery_audit() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN IF NEW.action='identity.recovery.completed' THEN RAISE EXCEPTION 'fixture audit failure'; END IF; RETURN NEW; END; $$; CREATE TRIGGER reject_recovery_audit BEFORE INSERT ON audit_events FOR EACH ROW EXECUTE FUNCTION reject_recovery_audit()");
    try{await reset(token).expect(500);}finally{await database.exec("DROP TRIGGER reject_recovery_audit ON audit_events; DROP FUNCTION reject_recovery_audit()");}
    expect((await database.query("SELECT security_version,password_hash FROM users WHERE id=$1",[user.id])).rows[0]).toEqual({security_version:1,password_hash:null});
    expect((await database.query("SELECT consumed_at FROM account_recovery_tokens WHERE user_id=$1",[user.id])).rows[0].consumed_at).toBeNull();
    await request(app).get("/api/auth/user").set("Cookie",user.cookie).expect(200);
    expect((await database.query("SELECT count(*)::int AS n FROM email_outbox WHERE to_email=$1 AND idempotency_key LIKE 'recovery-confirmed:%'",[user.email])).rows[0].n).toBe(0);
  });
  it.runIf(native)(
    "allows only one completion under independent simultaneous sessions",
    async () => {
      const user = await account(),
        { token } = await recovery(user);
      const results = await Promise.all([reset(token), reset(token)]);
      expect(results.map((row) => row.status).sort()).toEqual([200, 400]);
    },
  );
});

describe("editorial concurrency and operations evidence", () => {
  const draft = () => ({
    title: "Fixture",
    slug: `fixture-${randomUUID()}`,
    excerpt: "Fixture summary",
    content: "A synthetic draft body",
    category: "Engineering",
  });
  const create = async () => {
    const body = draft();
    const result = await request(app)
      .post("/api/admin/content/posts")
      .set("Cookie", owner.cookie)
      .send(body)
      .expect(201);
    return { body, record: result.body };
  };
  it("requires an expected version and rejects stale saves without losing the newer revision", async () => {
    const { body, record } = await create();
    const patch = (value: object) =>
      request(app)
        .patch(`/api/admin/content/posts/${record.id}`)
        .set("Cookie", owner.cookie)
        .send(value);
    await patch({ ...body, content: "Missing version" }).expect(400);
    await patch({
      ...body,
      content: "Newer saved draft",
      expectedVersion: 1,
    }).expect(200);
    const rejected = await patch({
      ...body,
      content: "Old browser draft",
      expectedVersion: 1,
    }).expect(409);
    expect(rejected.body.code).toBe("EDITORIAL_VERSION_CONFLICT");
    expect(
      (
        await database.query(
          "SELECT content,current_version FROM blog_posts WHERE id=$1",
          [record.id],
        )
      ).rows[0],
    ).toEqual({ content: "Newer saved draft", current_version: 2 });
    await request(app)
      .post(`/api/admin/content/posts/${record.id}/transition`)
      .set("Cookie", owner.cookie)
      .send({ action: "submit_review", expectedVersion: 1 })
      .expect(409);
  });
  it.runIf(native)(
    "serializes two editors and accepts only the first revision",
    async () => {
      const { body, record } = await create();
      const patch = (content: string) =>
        request(app)
          .patch(`/api/admin/content/posts/${record.id}`)
          .set("Cookie", owner.cookie)
          .send({ ...body, content, expectedVersion: 1 });
      const results = await Promise.all([
        patch("Editor A draft"),
        patch("Editor B draft"),
      ]);
      expect(results.map((row) => row.status).sort()).toEqual([200, 409]);
    },
  );
  it("reports configuration separately from acceptance and protects private response caching", async () => {
    const denied = await request(app)
      .get("/api/admin/operations/status")
      .expect(401);
    expect(denied.headers["cache-control"]).toBe("no-store");
    const result = await request(app)
      .get("/api/admin/operations/status")
      .set("Cookie", owner.cookie)
      .expect(200);
    expect(result.body.integrations.email).toEqual({
      configured: true,
      acceptance: "external_evidence_required",
    });
    expect(
      result.body.releaseGates.every((gate: any) => gate.state !== "ready"),
    ).toBe(true);
    expect(result.body).not.toHaveProperty("credentials");
  });
  it("applies shared intake limits and stores no plaintext network identity", async () => {
    const { withinPublicLimit } = await import(
      "./security/public-request-limits.js"
    );
    for (let i = 0; i < 3; i++)
      expect(
        await withinPublicLimit("fixture", "private-network", 3, 60000),
      ).toBe(true);
    expect(
      await withinPublicLimit("fixture", "private-network", 3, 60000),
    ).toBe(false);
    const serialized = JSON.stringify(
      (await database.query("SELECT * FROM public_request_limits")).rows,
    );
    expect(serialized).not.toContain("private-network");
  });
});
