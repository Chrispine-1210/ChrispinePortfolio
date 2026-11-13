import { readFile, readdir } from "node:fs/promises";
import { PGlite } from "@electric-sql/pglite";
import { drizzle } from "drizzle-orm/pglite";
import type { Express } from "express";
import request from "supertest";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import * as schema from "../shared/schema.js";

const database = new PGlite();
vi.mock("./db.js", () => ({ db: drizzle(database, { schema }) }));

let app: Express;
let administrator: { cookie: string; userId: string; sessionId: string };
let manager: { cookie: string; userId: string; sessionId: string };
let viewer: { cookie: string; userId: string; sessionId: string };

beforeAll(async () => {
  vi.stubEnv("ADMIN_AUTH_MODE", "database");
  vi.stubEnv("DATABASE_URL", "postgresql://test:test@localhost/test");
  vi.stubEnv("AUTH_KEY_PEPPER", "isolated-portfolio-governance-test-pepper");
  const migrations = (await readdir("migrations")).filter((name) => /^\d{4}_.*\.sql$/.test(name)).sort();
  for (const migration of migrations) {
    await database.exec(await readFile(`migrations/${migration}`, "utf8"));
  }
  await database.exec(`
    insert into roles (key, name) values ('portfolio_test_manager', 'Test manager');
    insert into role_permissions (role_id, permission_id)
    select roles.id, permissions.id from roles, permissions
    where roles.key = 'portfolio_test_manager' and permissions.key in ('portfolio.read', 'portfolio.manage');
  `);
  const { getDatabaseAuthRuntime } = await import("./security/database-auth-routes.js");
  const { sessions } = getDatabaseAuthRuntime();

  async function provision(role: string) {
    const { rows: [user] } = await database.query<{ id: string; security_version: number }>(
      "insert into users (email) values ($1) returning id, security_version", [`${role}@test.invalid`],
    );
    await database.query(
      "insert into user_roles (user_id, role_id) select $1, id from roles where key = $2", [user.id, role],
    );
    const session = await sessions.issue({ userId: user.id, userSecurityVersion: user.security_version });
    return { cookie: `admin_session=${session.token}`, userId: user.id, sessionId: session.sessionId };
  }

  administrator = await provision("super_administrator");
  manager = await provision("portfolio_test_manager");
  viewer = await provision("viewer");
  ({ app } = await import("./app.js"));
});

afterAll(async () => {
  vi.unstubAllEnvs();
  await database.close();
});

const studyInput = {
  title: "Governed engineering delivery",
  slug: "governed-engineering-delivery",
  summary: "Public description approved for the portfolio",
  category: "Integration fixture",
  visibility: "public",
  featured: true,
};
const studies = "/api/admin/case-studies";
const projects = "/api/admin/projects";

describe("portfolio governance HTTP routes", () => {
  it("requires a session and evaluates database permissions on reads and writes", async () => {
    await request(app).get(projects).expect(401);
    await request(app).get(studies).set("Cookie", viewer.cookie).expect(200);
    await request(app).post(studies).set("Cookie", viewer.cookie).send(studyInput).expect(403);
    await request(app).patch("/api/admin/case-study-evidence/any")
      .set("Cookie", manager.cookie).send({}).expect(403);
  });

  it("returns safe errors for invalid and duplicate writes", async () => {
    const api = request(app);
    await api.post(projects).set("Cookie", manager.cookie).send({})
      .expect("Cache-Control", "no-store").expect(400);
    await api.post(studies).set("Cookie", manager.cookie)
      .send({ ...studyInput, liveUrl: "javascript:alert(1)" }).expect(400);
    const input = { projectCode: "DUPLICATE-FIXTURE", name: "Integration fixture" };
    await api.post(projects).set("Cookie", manager.cookie).send(input).expect(201);
    await api.post(projects).set("Cookie", manager.cookie).send(input)
      .expect(409, { message: "A record with this identifier already exists" });
  });

  it("requires fresh evidence approval after an edit and publishes only the approved public projection", async () => {
    const api = request(app);
    const project = await api.post(projects).set("Cookie", manager.cookie).send({
      projectCode: "PRIVATE-FIXTURE", name: "Private delivery record",
      internalSummary: "Internal-only project scope", commercialValue: "42000.00", confidentiality: "restricted",
    }).expect(201);
    const study = await api.post(studies).set("Cookie", manager.cookie)
      .send({ ...studyInput, projectId: project.body.id }).expect(201);
    const studyPath = `${studies}/${study.body.id}`;
    const publicPath = `/api/portfolio/${studyInput.slug}`;
    const transition = (action: string, cookie = administrator.cookie, justification?: string) =>
      api.post(`${studyPath}/transition`).set("Cookie", cookie).send({ action, justification });
    const evidence = await api.post(`${studyPath}/evidence`).set("Cookie", manager.cookie).send({
      claim: "Engineering delivery was independently reviewed",
      sourceType: "internal_record", sourceReference: "Confidential evidence reference",
    }).expect(201);
    expect(evidence.body.evidence.disclosureStatus).toBe("private");

    const verifyEvidence = () => api.patch(`/api/admin/case-study-evidence/${evidence.body.evidence.id}`)
      .set("Cookie", administrator.cookie)
      .send({ verificationStatus: "internally_verified", disclosureStatus: "approved_public" });
    await verifyEvidence().expect(200);
    await api.patch(studyPath).set("Cookie", manager.cookie).send({ outcome: "Approved delivery scope" }).expect(200);
    await transition("submit_review", manager.cookie).expect(200);
    await transition("approve", manager.cookie).expect(403);
    await transition("approve").expect(409);
    await api.get(publicPath).expect(404);

    await verifyEvidence().expect(200);
    await transition("approve").expect(200);
    await transition("publish", manager.cookie).expect(403);
    const published = await transition("publish").expect(200);
    await verifyEvidence().expect(409);
    await api.patch(studyPath).set("Cookie", manager.cookie).send({ outcome: "Unreviewed" }).expect(409);

    const detail = await api.get(publicPath).expect("Cache-Control", "no-store").expect(200);
    expect(detail.body).toMatchObject({ slug: studyInput.slug, outcome: "Approved delivery scope" });
    expect(detail.body).not.toHaveProperty("projectId");
    expect(detail.body).not.toHaveProperty("evidenceGateStatus");
    expect(detail.text).not.toMatch(/Internal-only project scope|Confidential evidence reference|42000/);
    expect((await api.get("/api/portfolio/featured").expect(200)).body).toEqual(
      expect.arrayContaining([expect.objectContaining({ slug: studyInput.slug })]),
    );
    expect((await api.get("/api/portfolio/search").query({ q: studyInput.title }).expect(200)).body.pagination.total).toBe(1);

    const { rows } = await database.query(
      "select actor_user_id, actor_session_id, request_id from audit_events where resource_id = $1 and action = 'case_study.publish'",
      [study.body.id],
    );
    expect(rows).toEqual([{
      actor_user_id: administrator.userId, actor_session_id: administrator.sessionId, request_id: published.headers["x-request-id"],
    }]);

    await transition("archive", administrator.cookie, "Withdraw approved publication").expect(200);
    await api.get(publicPath).expect("Cache-Control", "no-store").expect(404);
    expect((await api.get("/api/portfolio/search").query({ q: studyInput.title }).expect(200)).body.pagination.total).toBe(0);
    await transition("restore").expect(200);
    await api.get(publicPath).expect(404);
  });

  it("withdraws unsupported evidence with an audit trail and preserves valid publication", async () => {
    const api = request(app);
    const input = {
      ...studyInput,
      title: "Evidence withdrawal fixture",
      slug: "evidence-withdrawal-fixture",
      featured: false,
    };
    const study = await api.post(studies).set("Cookie", manager.cookie).send(input).expect(201);
    const studyPath = `${studies}/${study.body.id}`;

    const approved = await api.post(`${studyPath}/evidence`).set("Cookie", manager.cookie).send({
      claim: "Supported implementation claim",
      sourceType: "repository",
      sourceReference: "repo://supported-evidence",
    }).expect(201);
    const unsupported = await api.post(`${studyPath}/evidence`).set("Cookie", manager.cookie).send({
      claim: "Unsupported historical claim",
      sourceType: "internal_record",
      sourceReference: "record://unsupported-evidence",
    }).expect(201);

    await api.patch(`/api/admin/case-study-evidence/${approved.body.evidence.id}`)
      .set("Cookie", administrator.cookie)
      .send({ verificationStatus: "internally_verified", disclosureStatus: "approved_public" })
      .expect(200);
    await api.patch(`/api/admin/case-study-evidence/${unsupported.body.evidence.id}`)
      .set("Cookie", administrator.cookie)
      .send({ verificationStatus: "rejected", disclosureStatus: "rejected" })
      .expect(200);

    await api.post(`${studyPath}/transition`).set("Cookie", manager.cookie)
      .send({ action: "submit_review" }).expect(200);
    await api.post(`${studyPath}/transition`).set("Cookie", administrator.cookie)
      .send({ action: "approve" }).expect(409);

    const withdrawn = await api.post(`/api/admin/case-study-evidence/${unsupported.body.evidence.id}/withdraw`)
      .set("Cookie", manager.cookie)
      .send({ justification: "Unsupported claim removed from publication scope" })
      .expect(200);
    expect(withdrawn.body.evidence).toMatchObject({
      id: unsupported.body.evidence.id,
      verificationStatus: "rejected",
      disclosureStatus: "withdrawn",
    });
    expect(withdrawn.body.gate.status).toBe("approved");

    await api.post(`${studyPath}/transition`).set("Cookie", administrator.cookie)
      .send({ action: "approve" }).expect(200);
    await api.post(`${studyPath}/transition`).set("Cookie", administrator.cookie)
      .send({ action: "publish" }).expect(200);
    await api.get(`/api/portfolio/${input.slug}`).expect(200);

    const { rows } = await database.query(
      "select action, justification from audit_events where resource_id = $1 and action = 'case_study.evidence.withdraw'",
      [unsupported.body.evidence.id],
    );
    expect(rows).toEqual([{
      action: "case_study.evidence.withdraw",
      justification: "Unsupported claim removed from publication scope",
    }]);

    await api.post(`${studyPath}/transition`).set("Cookie", administrator.cookie)
      .send({ action: "archive", justification: "Test cleanup after evidence withdrawal verification" })
      .expect(200);
    await api.get(`/api/portfolio/${input.slug}`).expect(404);
  });

  it("keeps private studies inaccessible and unlisted studies out of discovery", async () => {
    await database.exec(`
      insert into case_studies (title, slug, summary, category, workflow_status, visibility, evidence_gate_status)
      values
        ('Hidden study', 'hidden-fixture', 'Confidential', 'Private category', 'published', 'private', 'approved'),
        ('Unlisted study', 'unlisted-fixture', 'Direct link', 'Unlisted category', 'published', 'unlisted', 'approved'),
        ('Blocked study', 'blocked-fixture', 'Unapproved', 'Blocked category', 'published', 'public', 'blocked');
    `);
    const api = request(app);
    await api.get("/api/portfolio/hidden-fixture").expect(404);
    await api.get("/api/portfolio/blocked-fixture").expect(404);
    await api.get("/api/portfolio/unlisted-fixture").expect("Cache-Control", "no-store").expect(200);
    expect((await api.get("/api/portfolio").expect(200)).body.map((study: { slug: string }) => study.slug))
      .toEqual(["mtendere-education-platform", "aothothe-enterprise-os-commercial-foundation"]);
    expect((await api.get("/api/categories/portfolio").expect(200)).body.categories)
      .toEqual(["Enterprise Systems", "Full-Stack Delivery"]);
  });
});

describe("public form and CRM compatibility", () => {
  it("retains validation errors and captures a contact that an administrator can qualify", async () => {
    const api = request(app);
    const invalid = await api.post("/api/contact").send({}).expect(400);
    expect(invalid.body.errors).toEqual(expect.arrayContaining([expect.objectContaining({ path: ["email"] })]));
    const contact = await api.post("/api/contact").send({
      name: "Portfolio contact fixture",
      email: "contact@test.invalid",
      projectType: "Software consulting",
      message: "Requesting a discovery call for a client portal.",
    }).expect(200);

    const leads = await api.get("/api/admin/leads").set("Cookie", administrator.cookie)
      .query({ search: "contact@test.invalid" }).expect(200);
    expect(leads.body).toEqual([expect.objectContaining({
      contactRequestId: contact.body.id, source: "contact_form", stage: "new",
    })]);
    const leadPath = `/api/admin/leads/${leads.body[0].id}`;
    const qualified = await api.patch(leadPath).set("Cookie", administrator.cookie)
      .send({ stage: "qualified", qualificationScore: 70 }).expect(200);
    expect(qualified.body).toMatchObject({ stage: "qualified", qualificationScore: 70 });
  });

  it("preserves newsletter subscription validation and duplicate detection", async () => {
    const api = request(app);
    const url = "/api/newsletter/subscribe";
    await api.post(url).send({}).expect(400);
    await api.post(url).send({ email: "newsletter@test.invalid" }).expect(200);
    await api.post(url).send({ email: "newsletter@test.invalid" }).expect(400, { message: "Already subscribed" });
  });
});
