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
    expect(detail.body.evidence).toEqual([
      expect.objectContaining({
        claim: "Engineering delivery was independently reviewed",
        sourceType: "internal_record",
        verificationStatus: "internally_verified",
      }),
    ]);
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

  it("captures a structured consultation as a qualified CRM intake without inventing qualification", async () => {
    const api = request(app);
    const attributionNow = new Date().toISOString();
    await api.post("/api/consultation").send({
      name: "Commercial lead fixture",
      email: "buyer@test.invalid",
      organization: "Example Institution",
      industry: "Education",
      serviceInterest: "enterprise-software",
      challenge: "We need one governed system to replace disconnected operational spreadsheets.",
      currentTech: "Spreadsheets and email approvals",
      budgetRange: "MWK 5,000,000 – 15,000,000",
      expectedTimeline: "3–6 months",
      consent: true,
      attribution: {
        firstTouch: {
          source: "",
          medium: "",
          campaign: "",
          term: "",
          content: "",
          referrer: "",
          landingPage: "/",
          capturedAt: attributionNow,
        },
        lastTouch: {
          source: "linkedin",
          medium: "social",
          campaign: "enterprise-proof",
          term: "",
          content: "case-study-cta",
          referrer: "https://www.linkedin.com/",
          landingPage: "/hire?utm_source=linkedin&utm_medium=social&utm_campaign=enterprise-proof",
          capturedAt: attributionNow,
        },
      },
    }).expect(201);

    const leads = await api.get("/api/admin/leads").set("Cookie", administrator.cookie)
      .query({ search: "buyer@test.invalid" }).expect(200);
    expect(leads.body).toEqual([expect.objectContaining({
      organization: "Example Institution",
      industry: "Education",
      leadType: "consultation_request",
      serviceInterest: "enterprise-software",
      budgetRange: "MWK 5,000,000 – 15,000,000",
      expectedTimeline: "3–6 months",
      source: "portfolio_consultation",
      stage: "new",
      qualificationScore: 0,
      consentStatus: "granted",
    })]);
    const { rows: touches } = await database.query(
      "select touch_type, channel, source, medium, campaign from lead_attribution_touches where lead_id = $1 order by touch_type",
      [leads.body[0].id],
    );
    expect(touches).toEqual([
      expect.objectContaining({ touch_type: "first", channel: "direct", source: "direct" }),
      expect.objectContaining({ touch_type: "last", channel: "social", source: "linkedin", medium: "social", campaign: "enterprise-proof" }),
    ]);
  });

  it("rejects attribution timestamps outside the accepted acquisition lookback", async () => {
    const api = request(app);
    const tooOld = new Date(Date.now() - 181 * 24 * 60 * 60 * 1000).toISOString();
    const invalid = await api.post("/api/consultation").send({
      name: "Attribution boundary fixture",
      email: "attribution-boundary@test.invalid",
      organization: "Example Institution",
      industry: "Education",
      serviceInterest: "enterprise-software",
      challenge: "We need acquisition attribution without allowing stale client timestamps to distort reporting.",
      budgetRange: "MWK 1,000,000 – 5,000,000",
      expectedTimeline: "1–3 months",
      consent: true,
      attribution: {
        firstTouch: {
          source: "linkedin",
          medium: "social",
          campaign: "stale-campaign",
          term: "",
          content: "",
          referrer: "https://www.linkedin.com/",
          landingPage: "/hire",
          capturedAt: tooOld,
        },
      },
    }).expect(400);
    expect(invalid.body.errors).toEqual(expect.arrayContaining([
      expect.objectContaining({ path: ["attribution", "firstTouch", "capturedAt"] }),
    ]));
  });

  it("rejects consultation values outside the controlled commercial taxonomy", async () => {
    const api = request(app);
    const invalid = await api.post("/api/consultation").send({
      name: "Taxonomy fixture",
      email: "taxonomy@test.invalid",
      organization: "Example Institution",
      industry: "Education",
      serviceInterest: "anything-a-client-types",
      challenge: "We need a controlled service taxonomy for reliable funnel reporting.",
      budgetRange: "MWK 5,000,000 – 15,000,000",
      expectedTimeline: "3–6 months",
      consent: true,
    }).expect(400);
    expect(invalid.body.errors).toEqual(expect.arrayContaining([
      expect.objectContaining({ path: ["serviceInterest"] }),
    ]));
  });

  it("measures service funnel history and enforces late-stage commercial economics", async () => {
    const api = request(app);

    const createConsultation = (
      email: string,
      serviceInterest: string,
      attribution?: {
        firstTouch?: Record<string, string>;
        lastTouch?: Record<string, string>;
      },
    ) =>
      api.post("/api/consultation").send({
        name: `Funnel fixture ${serviceInterest}`,
        email,
        organization: "Funnel Verification Ltd",
        industry: "Professional Services",
        serviceInterest,
        challenge: "We need a measurable commercial funnel from enquiry through proposal and final outcome.",
        currentTech: "Manual follow-up and spreadsheets",
        budgetRange: "MWK 1,000,000 – 5,000,000",
        expectedTimeline: "1–3 months",
        consent: true,
        attribution,
      }).expect(201);

    await createConsultation("funnel-lost@test.invalid", "managed-it");
    const lostLeadSearch = await api.get("/api/admin/leads").set("Cookie", administrator.cookie)
      .query({ search: "funnel-lost@test.invalid" }).expect(200);
    const lostLeadPath = `/api/admin/leads/${lostLeadSearch.body[0].id}`;
    expect(lostLeadSearch.body[0]).toMatchObject({ currency: "MWK", stage: "new" });

    await api.patch(lostLeadPath).set("Cookie", administrator.cookie)
      .send({ stage: "proposal" })
      .expect(409, { message: "Estimated commercial value is required before proposal, negotiation, or won stages" });
    await api.patch(lostLeadPath).set("Cookie", administrator.cookie)
      .send({ stage: "qualified", qualificationScore: 80 }).expect(200);
    await api.patch(lostLeadPath).set("Cookie", administrator.cookie)
      .send({ stage: "proposal", estimatedValue: 2500000, currency: "MWK", probability: 60 }).expect(200);
    const lost = await api.patch(lostLeadPath).set("Cookie", administrator.cookie)
      .send({ stage: "lost", lostReason: "Budget deferred", probability: 70 }).expect(200);
    expect(lost.body).toMatchObject({ stage: "lost", probability: 0, lostReason: "Budget deferred" });
    const reopened = await api.patch(lostLeadPath).set("Cookie", administrator.cookie)
      .send({ stage: "qualified", lostReason: "Budget deferred", probability: 50 }).expect(200);
    expect(reopened.body).toMatchObject({ stage: "qualified", lostReason: null, probability: 50 });
    const relost = await api.patch(lostLeadPath).set("Cookie", administrator.cookie)
      .send({ stage: "lost", lostReason: "Budget deferred", probability: 90 }).expect(200);
    expect(relost.body).toMatchObject({ stage: "lost", probability: 0, lostReason: "Budget deferred" });

    const funnelAttributionNow = new Date().toISOString();
    await createConsultation("funnel-won@test.invalid", "network-infrastructure", {
      firstTouch: {
        source: "google",
        medium: "organic",
        campaign: "",
        term: "network support malawi",
        content: "",
        referrer: "https://www.google.com/",
        landingPage: "/software-consulting-malawi",
        capturedAt: funnelAttributionNow,
      },
      lastTouch: {
        source: "linkedin",
        medium: "social",
        campaign: "managed-infrastructure",
        term: "",
        content: "network-case-study",
        referrer: "https://www.linkedin.com/",
        landingPage: "/hire?utm_source=linkedin&utm_medium=social&utm_campaign=managed-infrastructure",
        capturedAt: funnelAttributionNow,
      },
    });
    const wonLeadSearch = await api.get("/api/admin/leads").set("Cookie", administrator.cookie)
      .query({ search: "funnel-won@test.invalid" }).expect(200);
    const wonLeadPath = `/api/admin/leads/${wonLeadSearch.body[0].id}`;
    await api.patch(wonLeadPath).set("Cookie", administrator.cookie)
      .send({ stage: "qualified", qualificationScore: 90 }).expect(200);
    await api.patch(wonLeadPath).set("Cookie", administrator.cookie)
      .send({ stage: "proposal", estimatedValue: 3500000, currency: "MWK", probability: 70 }).expect(200);
    const won = await api.patch(wonLeadPath).set("Cookie", administrator.cookie)
      .send({ stage: "won", probability: 40 }).expect(200);
    expect(won.body).toMatchObject({ stage: "won", probability: 100 });

    const invalidWindow = await api.get("/api/admin/pipeline/funnel").set("Cookie", administrator.cookie)
      .query({ window: "unsupported" }).expect(200);
    expect(invalidWindow.body.window).toBe("90d");

    const funnel = await api.get("/api/admin/pipeline/funnel").set("Cookie", administrator.cookie)
      .query({ window: "all" }).expect(200);
    expect(funnel.body.byService).toEqual(expect.arrayContaining([
      expect.objectContaining({
        key: "managed-it",
        enquiries: 1,
        qualified: 1,
        proposals: 1,
        won: 0,
        lost: 1,
        qualificationRate: 100,
        proposalRate: 100,
      }),
      expect.objectContaining({
        key: "network-infrastructure",
        enquiries: 1,
        qualified: 1,
        proposals: 1,
        won: 1,
        lost: 0,
        proposalWinRate: 100,
      }),
    ]));
    expect(funnel.body.financialByCurrency).toEqual(expect.arrayContaining([
      expect.objectContaining({
        currency: "MWK",
        wonValue: 3500000,
        lostValue: 2500000,
      }),
    ]));

    await api.post("/api/admin/acquisition/spend")
      .set("Cookie", administrator.cookie)
      .send({
        channel: "social",
        source: "linkedin",
        campaign: "managed-infrastructure",
        currency: "MWK",
        amount: "0",
        occurredAt: new Date().toISOString(),
      })
      .expect(400);

    await api.post("/api/admin/acquisition/spend")
      .set("Cookie", viewer.cookie)
      .send({
        channel: "social",
        source: "linkedin",
        campaign: "managed-infrastructure",
        currency: "MWK",
        amount: 500000,
        occurredAt: new Date().toISOString(),
      })
      .expect(403);

    const spend = await api.post("/api/admin/acquisition/spend")
      .set("Cookie", administrator.cookie)
      .send({
        channel: "social",
        source: "linkedin",
        campaign: "managed-infrastructure",
        currency: "MWK",
        amount: 500000,
        occurredAt: new Date().toISOString(),
        notes: "LinkedIn campaign spend fixture",
      })
      .expect(201);
    const voidedSpend = await api.post("/api/admin/acquisition/spend")
      .set("Cookie", administrator.cookie)
      .send({
        channel: "social",
        source: "linkedin",
        campaign: "managed-infrastructure",
        currency: "MWK",
        amount: 100000,
        occurredAt: new Date().toISOString(),
        notes: "Incorrect duplicate spend fixture",
      })
      .expect(201);
    await api.post(`/api/admin/acquisition/spend/${voidedSpend.body.id}/void`)
      .set("Cookie", administrator.cookie)
      .send({ reason: "Duplicate spend record entered during verification" })
      .expect(200);
    expect(spend.body).toMatchObject({
      channel: "social",
      source: "linkedin",
      campaign: "managed-infrastructure",
      currency: "MWK",
      amount: "500000.00",
    });

    const intelligence = await api.get("/api/admin/acquisition/intelligence")
      .set("Cookie", administrator.cookie)
      .query({ window: "all" })
      .expect(200);
    expect(intelligence.body.byLastTouchChannel).toEqual(expect.arrayContaining([
      expect.objectContaining({
        key: "social",
        enquiries: 2,
        won: 1,
        wonRevenueByCurrency: expect.arrayContaining([
          expect.objectContaining({ currency: "MWK", revenue: 3500000, averageWonValue: 3500000 }),
        ]),
        economicsByCurrency: expect.arrayContaining([
          expect.objectContaining({
            currency: "MWK",
            spend: 500000,
            wonRevenue: 3500000,
            wins: 1,
            cac: 500000,
            roas: 7,
          }),
        ]),
      }),
      expect.objectContaining({
        key: "unattributed",
        proposals: 1,
        lost: 1,
      }),
    ]));
    expect(intelligence.body.byLastTouchSource).toEqual(expect.arrayContaining([
      expect.objectContaining({
        key: "linkedin",
        enquiries: 2,
        won: 1,
        economicsByCurrency: expect.arrayContaining([
          expect.objectContaining({ currency: "MWK", spend: 500000, roas: 7 }),
        ]),
      }),
    ]));
    expect(intelligence.body.byCampaign).toEqual(expect.arrayContaining([
      expect.objectContaining({
        key: "managed-infrastructure",
        won: 1,
        economicsByCurrency: expect.arrayContaining([
          expect.objectContaining({ currency: "MWK", cac: 500000, roas: 7 }),
        ]),
      }),
    ]));
    expect(intelligence.body.byChannelService).toEqual(expect.arrayContaining([
      expect.objectContaining({
        channel: "social",
        service: "network-infrastructure",
        won: 1,
        wonRevenueByCurrency: expect.arrayContaining([
          expect.objectContaining({ currency: "MWK", revenue: 3500000 }),
        ]),
      }),
    ]));
    expect(intelligence.body.spendEconomics).toMatchObject({
      status: "available",
      spendByCurrency: expect.arrayContaining([
        expect.objectContaining({ currency: "MWK", spend: 500000 }),
      ]),
      paybackDays: null,
    });
    expect(intelligence.body.velocityDays.samples).toMatchObject({
      qualified: expect.any(Number),
      proposal: expect.any(Number),
      won: expect.any(Number),
    });

  });

  it("builds evidence-gated revenue intelligence and deterministic capital allocation", async () => {
    const api = request(app);
    const attributionNow = new Date().toISOString();

    const createConsultation = async (
      email: string,
      serviceInterest: string,
      channel: string,
      source: string,
      campaign: string,
    ) => {
      await api.post("/api/consultation").send({
        name: `Revenue intelligence ${email}`,
        email,
        organization: "Revenue Intelligence Verification Ltd",
        industry: "Professional Services",
        serviceInterest,
        challenge: "We need evidence-backed revenue intelligence and capital allocation without invented commercial assumptions.",
        currentTech: "CRM and finance evidence fixtures",
        budgetRange: "MWK 1,000,000 – 5,000,000",
        expectedTimeline: "1–3 months",
        consent: true,
        attribution: {
          firstTouch: {
            source,
            medium: channel,
            campaign,
            term: "",
            content: "",
            referrer: "",
            landingPage: "/hire",
            capturedAt: attributionNow,
          },
          lastTouch: {
            source,
            medium: channel,
            campaign,
            term: "",
            content: "capital-allocation-test",
            referrer: "",
            landingPage: "/hire",
            capturedAt: attributionNow,
          },
        },
      }).expect(201);
      const search = await api.get("/api/admin/leads")
        .set("Cookie", administrator.cookie)
        .query({ search: email })
        .expect(200);
      return search.body[0] as { id: string; stage: string; serviceInterest: string };
    };

    const notWon = await createConsultation(
      "revenue-not-won@test.invalid",
      "business-systems",
      "paid",
      "google-ads",
      "capital-scale",
    );
    await api.post("/api/admin/revenue/events")
      .set("Cookie", administrator.cookie)
      .send({
        leadId: notWon.id,
        serviceInterest: "business-systems",
        revenueKind: "one_time",
        currency: "MWK",
        amount: 100000,
        occurredAt: new Date().toISOString(),
        sourceReference: "invoice-not-won",
      })
      .expect(409, { message: "Revenue can only be recognized against a won opportunity" });

    const scaleLeads: Array<{ id: string }> = [];
    for (let index = 0; index < 5; index += 1) {
      const lead = index === 0
        ? notWon
        : await createConsultation(
            `capital-scale-${index}@test.invalid`,
            "business-systems",
            "paid",
            "google-ads",
            "capital-scale",
          );
      scaleLeads.push(lead);
      const leadPath = `/api/admin/leads/${lead.id}`;
      if (index <= 3) {
        await api.patch(leadPath).set("Cookie", administrator.cookie)
          .send({ stage: "qualified", qualificationScore: 90 }).expect(200);
      }
      if (index <= 2) {
        await api.patch(leadPath).set("Cookie", administrator.cookie)
          .send({ stage: "proposal", estimatedValue: 4000000, currency: "MWK", probability: 70 }).expect(200);
      }
      if (index <= 1) {
        await api.patch(leadPath).set("Cookie", administrator.cookie)
          .send({ stage: "won", probability: 60 }).expect(200);
      }
    }

    await api.post("/api/admin/acquisition/spend")
      .set("Cookie", administrator.cookie)
      .send({
        channel: "paid",
        source: "google-ads",
        campaign: "capital-scale",
        serviceInterest: "business-systems",
        currency: "MWK",
        amount: 500000,
        occurredAt: new Date().toISOString(),
        notes: "Service-tagged scale test spend",
      })
      .expect(201);

    for (const lead of scaleLeads.slice(0, 2)) {
      await api.post("/api/admin/revenue/events")
        .set("Cookie", administrator.cookie)
        .send({
          leadId: lead.id,
          serviceInterest: "business-systems",
          revenueKind: "recurring",
          currency: "MWK",
          amount: 2000000,
          occurredAt: new Date().toISOString(),
          periodStart: new Date(Date.now() - 30 * 86_400_000).toISOString(),
          periodEnd: new Date().toISOString(),
          sourceReference: `invoice-${lead.id}`,
        }).expect(201);
      await api.post("/api/admin/revenue/costs")
        .set("Cookie", administrator.cookie)
        .send({
          leadId: lead.id,
          serviceInterest: "business-systems",
          category: "delivery_labour",
          costScope: "recurring",
          currency: "MWK",
          amount: 1000000,
          occurredAt: new Date().toISOString(),
          sourceReference: `cost-ledger-${lead.id}`,
        }).expect(201);
      await api.post("/api/admin/revenue/cost-attestations")
        .set("Cookie", administrator.cookie)
        .send({
          leadId: lead.id,
          serviceInterest: "business-systems",
          currency: "MWK",
          throughAt: new Date().toISOString(),
          sourceReference: `cost-complete-${lead.id}`,
          notes: "All recurring direct costs through this revenue date are captured.",
        }).expect(201);
      await api.post("/api/admin/revenue/agreements")
        .set("Cookie", administrator.cookie)
        .send({
          leadId: lead.id,
          serviceInterest: "business-systems",
          currency: "MWK",
          monthlyRecurringRevenue: 500000,
          startedAt: new Date(Date.now() - 60 * 86_400_000).toISOString(),
          sourceReference: `support-agreement-${lead.id}`,
        }).expect(201);
    }

    await api.post("/api/admin/revenue/events")
      .set("Cookie", viewer.cookie)
      .send({
        leadId: scaleLeads[0].id,
        serviceInterest: "business-systems",
        revenueKind: "one_time",
        currency: "MWK",
        amount: 1,
        occurredAt: new Date().toISOString(),
        sourceReference: "viewer-denied",
      })
      .expect(403);

    for (const lead of scaleLeads.slice(0, 2)) {
      await database.query(
        `update lead_activities
         set created_at = case
           when metadata->>'stage' = 'qualified' then now() - interval '14 days'
           when metadata->>'stage' = 'proposal' then now() - interval '10 days'
           when metadata->>'stage' = 'won' then now() - interval '2 days'
           else created_at end
         where lead_id = $1 and type = 'stage_changed'`,
        [lead.id],
      );
    }
    await database.query(
      `update lead_activities
       set created_at = case
         when metadata->>'stage' = 'qualified' then now() - interval '40 days'
         when metadata->>'stage' = 'proposal' then now() - interval '30 days'
         else created_at end
       where lead_id = $1 and type = 'stage_changed'`,
      [scaleLeads[2].id],
    );

    const directLead = async (
      email: string,
      stage: string,
      service: string,
      channel: string,
      source: string,
    ) => {
      const { rows: [lead] } = await database.query<{ id: string }>(
        `insert into leads
          (name, email, lead_type, service_interest, source, stage, estimated_value, currency, probability, consent_status)
         values ($1, $2, 'consultation_request', $3, 'portfolio_consultation', $4, 2000000, 'MWK', 60, 'granted')
         returning id`,
        [email, email, service, stage],
      );
      await database.query(
        `insert into lead_attribution_touches
          (lead_id, touch_type, channel, source, medium, campaign, landing_page, captured_at)
         values ($1, 'last', $2, $3, $2, 'allocation-fixture', '/hire', now())`,
        [lead.id, channel, source],
      );
      return lead.id;
    };

    for (let index = 0; index < 5; index += 1) {
      await directLead(
        `capital-cut-${index}@test.invalid`,
        "proposal",
        "technology-advisory",
        "email",
        "outbound-email",
      );
    }
    await database.query(
      `insert into acquisition_spend_entries
        (channel, source, campaign, service_interest, currency, amount, occurred_at)
       values ('email', 'outbound-email', 'allocation-cut', 'technology-advisory', 'MWK', 200000, now())`,
    );

    const maintainWon: string[] = [];
    for (let index = 0; index < 5; index += 1) {
      const stage = index < 2 ? "won" : index === 2 ? "proposal" : "qualified";
      const id = await directLead(
        `capital-maintain-${index}@test.invalid`,
        stage,
        "data-analytics",
        "referral",
        "partner-referral",
      );
      if (stage === "won") maintainWon.push(id);
    }
    await database.query(
      `insert into acquisition_spend_entries
        (channel, source, campaign, service_interest, currency, amount, occurred_at)
       values ('referral', 'partner-referral', 'allocation-maintain', 'data-analytics', 'MWK', 1000000, now())`,
    );
    for (const id of maintainWon) {
      await database.query(
        `insert into revenue_events
          (lead_id, service_interest, revenue_kind, currency, amount, occurred_at, source_reference)
         values ($1, 'data-analytics', 'one_time', 'MWK', 1000000, now(), 'maintain-revenue')`,
        [id],
      );
      await database.query(
        `insert into direct_cost_entries
          (lead_id, service_interest, category, cost_scope, currency, amount, occurred_at, source_reference)
         values ($1, 'data-analytics', 'delivery_labour', 'one_time', 'MWK', 250000, now(), 'maintain-cost')`,
        [id],
      );
      await database.query(
        `insert into cost_evidence_attestations
          (lead_id, service_interest, currency, through_at, source_reference)
         values ($1, 'data-analytics', 'MWK', now() + interval '1 second', 'maintain-cost-complete')`,
        [id],
      );
    }

    for (let index = 0; index < 2; index += 1) {
      await directLead(
        `capital-unknown-${index}@test.invalid`,
        "proposal",
        "managed-it",
        "organic_search",
        "google",
      );
    }

    await database.query(
      `insert into acquisition_spend_entries
        (channel, source, campaign, service_interest, currency, amount, occurred_at)
       values ('direct', 'field-sales', 'zero-enquiry-cut', 'enterprise-software', 'MWK', 300000,
               now() - interval '20 days')`,
    );

    const intelligence = await api.get("/api/admin/revenue/intelligence")
      .set("Cookie", administrator.cookie)
      .query({ window: "all" })
      .expect(200);

    const findDecision = (channel: string, service: string) =>
      intelligence.body.allocationRecommendations.find(
        (row: any) => row.channel === channel && row.service === service && row.currency === "MWK",
      );

    expect(findDecision("paid", "business-systems")).toMatchObject({
      decision: "scale",
      confidence: "medium",
      metrics: {
        enquiries: 5,
        proposals: 3,
        wins: 2,
        proposalWinRate: 66.7,
        spend: 500000,
        recognizedRevenue: 4000000,
        directCost: 2000000,
        grossProfit: 2000000,
        grossMarginPct: 50,
        grossProfitRoas: 4,
        mrr: 1000000,
        arr: 12000000,
        paybackDays: 30.4,
        revenueCoveragePct: 100,
        costCoveragePct: 100,
        observedRevenueLtv: 2000000,
        observedGrossProfitLtv: 1000000,
      },
    });
    expect(findDecision("email", "technology-advisory")).toMatchObject({
      decision: "cut",
      metrics: { proposals: 5, wins: 0, spend: 200000 },
    });
    expect(findDecision("referral", "data-analytics")).toMatchObject({
      decision: "maintain",
      metrics: {
        enquiries: 5,
        proposals: 3,
        wins: 2,
        grossMarginPct: 75,
        grossProfitRoas: 1.5,
      },
    });
    expect(findDecision("organic_search", "managed-it")).toMatchObject({
      decision: "insufficient_data",
      confidence: "low",
    });
    expect(findDecision("direct", "enterprise-software")).toMatchObject({
      decision: "cut",
      metrics: {
        enquiries: 0,
        proposals: 0,
        wins: 0,
        spend: 300000,
        spendAgeDays: expect.any(Number),
      },
    });

    expect(intelligence.body.proposalVelocityDays.proposalToWon).toEqual(expect.any(Number));
    expect(intelligence.body.proposalVelocityDays.proposalToWon).toBeGreaterThan(0);
    expect(intelligence.body.proposalVelocityDays.samples.won).toBeGreaterThanOrEqual(2);
    expect(intelligence.body.proposalVelocityDays.samples.open).toBeGreaterThanOrEqual(1);
    expect(intelligence.body.pipelineAging.stalled).toEqual(expect.arrayContaining([
      expect.objectContaining({ id: scaleLeads[2].id, stage: "proposal", ageDays: expect.any(Number) }),
    ]));
    expect(intelligence.body.cohorts[0]).toEqual(expect.objectContaining({
      cohort: expect.stringMatching(/^\d{4}-\d{2}$/),
      enquiries: expect.any(Number),
      proposals: expect.any(Number),
    }));
    expect(intelligence.body.recurringRevenue.activeMrrByCurrency).toEqual(expect.arrayContaining([
      expect.objectContaining({ currency: "MWK", mrr: 1000000, arr: 12000000 }),
    ]));
    expect(intelligence.body.recurringRevenue.projectedLtvStatus)
      .toBe("insufficient_ended_agreements");
  });

  it("operates cash realization, retention and governed reinvestment from evidence", async () => {
    const api = request(app);
    const now = Date.now();
    const dayMs = 86_400_000;
    const attributionNow = new Date(now).toISOString();

    const createLead = async (email: string, serviceInterest: string, channel: string) => {
      await api.post("/api/consultation").send({
        name: `Capital operating ${email}`,
        email,
        organization: "Capital Operating Verification Ltd",
        industry: "Professional Services",
        serviceInterest,
        challenge: "We need invoice-to-cash, retention, utilization and reinvestment controls with auditable evidence.",
        currentTech: "Capital operating verification",
        budgetRange: "MWK 1,000,000 – 5,000,000",
        expectedTimeline: "1–3 months",
        consent: true,
        attribution: {
          firstTouch: {
            source: channel === "social" ? "linkedin" : "google",
            medium: channel,
            campaign: "capital-operating-test",
            term: "",
            content: "",
            referrer: "",
            landingPage: "/hire",
            capturedAt: attributionNow,
          },
          lastTouch: {
            source: channel === "social" ? "linkedin" : "google",
            medium: channel,
            campaign: "capital-operating-test",
            term: "",
            content: "cash-control",
            referrer: "",
            landingPage: "/hire",
            capturedAt: attributionNow,
          },
        },
      }).expect(201);
      const result = await api.get("/api/admin/leads")
        .set("Cookie", administrator.cookie)
        .query({ search: email })
        .expect(200);
      return result.body[0] as { id: string; serviceInterest: string; stage: string };
    };

    const notWon = await createLead("cash-not-won@test.invalid", "managed-it", "social");
    await api.post("/api/admin/capital/invoices")
      .set("Cookie", administrator.cookie)
      .send({
        leadId: notWon.id,
        serviceInterest: "managed-it",
        invoiceNumber: "CAP-NOT-WON-001",
        currency: "MWK",
        amount: 100000,
        issuedAt: new Date(now - dayMs).toISOString(),
        dueAt: new Date(now + 30 * dayMs).toISOString(),
        sourceReference: "invoice-not-won",
      })
      .expect(409, { message: "Invoices can only be attached to a won opportunity" });

    const lead = await createLead("cash-realization@test.invalid", "managed-it", "social");
    const leadPath = `/api/admin/leads/${lead.id}`;
    await api.patch(leadPath).set("Cookie", administrator.cookie)
      .send({ stage: "qualified", qualificationScore: 90 }).expect(200);
    await api.patch(leadPath).set("Cookie", administrator.cookie)
      .send({ stage: "proposal", estimatedValue: 2400000, currency: "MWK", probability: 70 }).expect(200);
    await api.patch(leadPath).set("Cookie", administrator.cookie)
      .send({ stage: "won", probability: 70 }).expect(200);

    const revenue = await api.post("/api/admin/revenue/events")
      .set("Cookie", administrator.cookie)
      .send({
        leadId: lead.id,
        serviceInterest: "managed-it",
        revenueKind: "recurring",
        currency: "MWK",
        amount: 600000,
        occurredAt: new Date(now - dayMs).toISOString(),
        periodStart: new Date(now - 31 * dayMs).toISOString(),
        periodEnd: new Date(now - dayMs).toISOString(),
        sourceReference: "cap-revenue-001",
      })
      .expect(201);

    await api.post("/api/admin/revenue/costs")
      .set("Cookie", administrator.cookie)
      .send({
        leadId: lead.id,
        serviceInterest: "managed-it",
        category: "support",
        costScope: "recurring",
        currency: "MWK",
        amount: 300000,
        occurredAt: new Date(now - dayMs).toISOString(),
        sourceReference: "cap-cost-001",
      })
      .expect(201);

    const agreement = await api.post("/api/admin/revenue/agreements")
      .set("Cookie", administrator.cookie)
      .send({
        leadId: lead.id,
        serviceInterest: "managed-it",
        currency: "MWK",
        monthlyRecurringRevenue: 500000,
        startedAt: new Date(now - 120 * dayMs).toISOString(),
        sourceReference: "cap-agreement-001",
      })
      .expect(201);

    await api.post("/api/admin/capital/retention-movements")
      .set("Cookie", administrator.cookie)
      .send({
        agreementId: agreement.body.id,
        movementType: "expansion",
        mrrDelta: 100000,
        effectiveAt: new Date(now - 20 * dayMs).toISOString(),
        sourceReference: "cap-expansion-001",
      })
      .expect(201);

    await api.post("/api/admin/capital/retention-movements")
      .set("Cookie", administrator.cookie)
      .send({
        agreementId: agreement.body.id,
        movementType: "contraction",
        mrrDelta: -50000,
        effectiveAt: new Date(now - 10 * dayMs).toISOString(),
        sourceReference: "cap-contraction-001",
      })
      .expect(201);

    await api.post("/api/admin/capital/retention-movements")
      .set("Cookie", administrator.cookie)
      .send({
        agreementId: agreement.body.id,
        movementType: "churn",
        mrrDelta: -100000,
        effectiveAt: new Date(now - 5 * dayMs).toISOString(),
        sourceReference: "invalid-partial-churn",
      })
      .expect(409);

    const invoice = await api.post("/api/admin/capital/invoices")
      .set("Cookie", administrator.cookie)
      .send({
        leadId: lead.id,
        revenueEventId: revenue.body.id,
        serviceInterest: "managed-it",
        invoiceNumber: "CAP-CASH-001",
        currency: "MWK",
        amount: 600000,
        issuedAt: new Date(now - 20 * dayMs).toISOString(),
        dueAt: new Date(now - 5 * dayMs).toISOString(),
        sourceReference: "cap-invoice-001",
      })
      .expect(201);

    await api.post("/api/admin/capital/collections")
      .set("Cookie", viewer.cookie)
      .send({
        invoiceId: invoice.body.id,
        amount: 100000,
        receivedAt: new Date(now - 3 * dayMs).toISOString(),
        paymentMethod: "bank_transfer",
        sourceReference: "viewer-denied",
      })
      .expect(403);

    await api.post("/api/admin/capital/collections")
      .set("Cookie", administrator.cookie)
      .send({
        invoiceId: invoice.body.id,
        amount: 200000,
        receivedAt: new Date(now - 3 * dayMs).toISOString(),
        paymentMethod: "bank_transfer",
        sourceReference: "cap-bank-001",
      })
      .expect(201);

    await api.post("/api/admin/capital/collections")
      .set("Cookie", administrator.cookie)
      .send({
        invoiceId: invoice.body.id,
        amount: 400000,
        receivedAt: new Date(now - 2 * dayMs).toISOString(),
        paymentMethod: "mobile_money",
        sourceReference: "cap-mobile-002",
      })
      .expect(201);

    await api.post("/api/admin/capital/collections")
      .set("Cookie", administrator.cookie)
      .send({
        invoiceId: invoice.body.id,
        amount: 1,
        receivedAt: new Date(now - dayMs).toISOString(),
        paymentMethod: "cash",
        sourceReference: "over-collection",
      })
      .expect(409);

    await api.post("/api/admin/revenue/cost-attestations")
      .set("Cookie", administrator.cookie)
      .send({
        leadId: lead.id,
        serviceInterest: "managed-it",
        currency: "MWK",
        throughAt: new Date(now - 4 * dayMs).toISOString(),
        sourceReference: "cap-cost-complete-001",
        notes: "All direct costs through the latest collection date are captured.",
      })
      .expect(201);

    const staleCostIntelligence = await api.get("/api/admin/capital/intelligence")
      .set("Cookie", administrator.cookie)
      .query({ window: "90d" })
      .expect(200);
    const staleCash = staleCostIntelligence.body.realizedCapitalReturn.find(
      (row: any) => row.channel === "social" && row.service === "managed-it" && row.currency === "MWK",
    );
    expect(staleCash).toMatchObject({
      cashCollected: 600000,
      directCost: 300000,
      costCoveragePct: 0,
      cashGrossContribution: null,
      reinvestmentSignal: "insufficient_data",
    });

    await api.post("/api/admin/revenue/cost-attestations")
      .set("Cookie", administrator.cookie)
      .send({
        leadId: lead.id,
        serviceInterest: "managed-it",
        currency: "MWK",
        throughAt: new Date(now + 1000).toISOString(),
        sourceReference: "cap-cost-complete-002",
        notes: "All direct costs through the latest collection date are captured.",
      })
      .expect(201);

    await api.post("/api/admin/acquisition/spend")
      .set("Cookie", administrator.cookie)
      .send({
        channel: "social",
        source: "linkedin",
        campaign: "capital-operating-test",
        serviceInterest: "managed-it",
        currency: "MWK",
        amount: 200000,
        occurredAt: new Date(now - 30 * dayMs).toISOString(),
        notes: "Service-tagged acquisition capital",
      })
      .expect(201);

    await api.post("/api/admin/capital/capacity")
      .set("Cookie", administrator.cookie)
      .send({
        serviceInterest: "managed-it",
        capacityScope: "managed-services-team",
        periodStart: new Date(now - 30 * dayMs).toISOString(),
        periodEnd: new Date(now).toISOString(),
        availableHours: 160,
        deliveryHours: 120,
        billableHours: 100,
        sourceReference: "cap-timesheet-001",
      })
      .expect(201);

    const overdueLead = await createLead("cash-overdue@test.invalid", "technology-advisory", "referral");
    const overduePath = `/api/admin/leads/${overdueLead.id}`;
    await api.patch(overduePath).set("Cookie", administrator.cookie)
      .send({ stage: "qualified", qualificationScore: 80 }).expect(200);
    await api.patch(overduePath).set("Cookie", administrator.cookie)
      .send({ stage: "proposal", estimatedValue: 400000, currency: "MWK", probability: 60 }).expect(200);
    await api.patch(overduePath).set("Cookie", administrator.cookie)
      .send({ stage: "won", probability: 60 }).expect(200);
    await api.post("/api/admin/capital/invoices")
      .set("Cookie", administrator.cookie)
      .send({
        leadId: overdueLead.id,
        serviceInterest: "technology-advisory",
        invoiceNumber: "CAP-AGING-001",
        currency: "MWK",
        amount: 400000,
        issuedAt: new Date(now - 60 * dayMs).toISOString(),
        dueAt: new Date(now - 45 * dayMs).toISOString(),
        sourceReference: "cap-aging-invoice",
      })
      .expect(201);

    const budget = await api.post("/api/admin/capital/budgets")
      .set("Cookie", administrator.cookie)
      .send({
        periodStart: new Date(now - 31 * dayMs).toISOString(),
        periodEnd: new Date(now + 30 * dayMs).toISOString(),
        currency: "MWK",
        envelopeAmount: 500000,
        sourceReference: "board-capital-envelope-001",
        notes: "Controlled test capital envelope.",
      })
      .expect(201);

    await api.post(`/api/admin/capital/budgets/${budget.body.id}/allocations`)
      .set("Cookie", administrator.cookie)
      .send({
        channel: "social",
        serviceInterest: "managed-it",
        recommendationDecision: "scale",
        recommendationConfidence: "medium",
        recommendedAmount: 300000,
        approvedAmount: 250000,
        sourceWindow: "90d",
        recommendationSnapshot: { version: "capital-allocation-v1" },
        rationale: "Upstream economics are strong; approve less than the recommendation pending realized-cash proof.",
      })
      .expect(200);

    await api.post(`/api/admin/capital/budgets/${budget.body.id}/approve`)
      .set("Cookie", viewer.cookie)
      .send({})
      .expect(403);

    await api.post(`/api/admin/capital/budgets/${budget.body.id}/approve`)
      .set("Cookie", administrator.cookie)
      .send({})
      .expect(200);

    const exceptionBudget = await api.post("/api/admin/capital/budgets")
      .set("Cookie", administrator.cookie)
      .send({
        periodStart: new Date(now - 31 * dayMs).toISOString(),
        periodEnd: new Date(now + 30 * dayMs).toISOString(),
        currency: "USD",
        envelopeAmount: 1000,
        sourceReference: "board-capital-exception-001",
        notes: "Exception governance fixture.",
      })
      .expect(201);

    await api.post(`/api/admin/capital/budgets/${exceptionBudget.body.id}/allocations`)
      .set("Cookie", administrator.cookie)
      .send({
        channel: "email",
        serviceInterest: "technology-advisory",
        recommendationDecision: "cut",
        recommendationConfidence: "medium",
        recommendedAmount: 0,
        approvedAmount: 500,
        sourceWindow: "90d",
        recommendationSnapshot: { version: "capital-allocation-v1", decision: "cut" },
        rationale: "Deliberately exercise accountable exception governance.",
      })
      .expect(200);

    const blockedExceptionApproval = await api.post(
      `/api/admin/capital/budgets/${exceptionBudget.body.id}/approve`,
    )
      .set("Cookie", administrator.cookie)
      .send({})
      .expect(409);
    expect(blockedExceptionApproval.body).toEqual(expect.objectContaining({
      message: "Approving capital for CUT or INSUFFICIENT_DATA segments requires an explicit exception reason",
      segments: expect.arrayContaining([
        expect.objectContaining({
          channel: "email",
          serviceInterest: "technology-advisory",
          decision: "cut",
          approvedAmount: "500.00",
        }),
      ]),
    }));

    const exceptionReason = "Executive exception approved for controlled learning with a hard USD 500 ceiling.";
    await api.post(`/api/admin/capital/budgets/${exceptionBudget.body.id}/approve`)
      .set("Cookie", administrator.cookie)
      .send({ exceptionReason })
      .expect(200);

    const { rows: exceptionAudit } = await database.query<{ justification: string | null }>(
      `select justification from audit_events
       where resource_id = $1 and action = 'capital.budget.approve'
       order by created_at desc limit 1`,
      [exceptionBudget.body.id],
    );
    expect(exceptionAudit[0]?.justification).toBe(exceptionReason);

    const intelligence = await api.get("/api/admin/capital/intelligence")
      .set("Cookie", administrator.cookie)
      .query({ window: "90d" })
      .expect(200);

    expect(intelligence.body.basis).toMatchObject({
      cashRealization: "invoice_cohort",
      capitalReturn: "lead_acquisition_cohort",
      retention: "trailing_period",
      deliveryUtilization: "activity_window",
    });

    const managedCash = intelligence.body.realizedCapitalReturn.find(
      (row: any) => row.channel === "social" && row.service === "managed-it" && row.currency === "MWK",
    );
    expect(managedCash).toMatchObject({
      cashCollected: 600000,
      directCost: 300000,
      acquisitionSpend: 200000,
      costCoveragePct: 100,
      cashGrossContribution: 300000,
      netCapitalReturn: 100000,
      cashReturnMultiple: 1.5,
      capitalRoiPct: 50,
      grr: 90,
      nrr: 110,
      retentionEvidenceComplete: true,
      reinvestmentSignal: "increase_candidate",
    });

    expect(intelligence.body.retention).toEqual(expect.arrayContaining([
      expect.objectContaining({
        service: "managed-it",
        currency: "MWK",
        beginningMrr: 500000,
        expansionMrr: 100000,
        contractionMrr: 50000,
        churnMrr: 0,
        grrPct: 90,
        nrrPct: 110,
        evidenceComplete: true,
      }),
    ]));

    expect(intelligence.body.deliveryUtilization).toEqual(expect.arrayContaining([
      expect.objectContaining({
        service: "managed-it",
        availableHours: 160,
        deliveryHours: 120,
        billableHours: 100,
        utilizationPct: 75,
        billableUtilizationPct: 62.5,
        scopeCount: 1,
      }),
    ]));

    expect(intelligence.body.cashRealization.currentReceivablesAging).toEqual(expect.arrayContaining([
      expect.objectContaining({
        key: "31-60",
        count: expect.any(Number),
        valueByCurrency: expect.arrayContaining([
          expect.objectContaining({ currency: "MWK", value: 400000 }),
        ]),
      }),
    ]));

    const budgetResult = intelligence.body.budgetPerformance.find((row: any) => row.id === budget.body.id);
    expect(budgetResult).toMatchObject({
      status: "approved",
      currency: "MWK",
      allocations: expect.arrayContaining([
        expect.objectContaining({
          channel: "social",
          serviceInterest: "managed-it",
          actualSpend: 200000,
          remainingApproved: 50000,
          approvedUtilizationPct: 80,
          recommendedVariance: -100000,
          approvedVariance: -50000,
        }),
      ]),
    });

    const invoices = await api.get("/api/admin/capital/invoices")
      .set("Cookie", administrator.cookie)
      .expect(200);
    expect(invoices.body).toEqual(expect.arrayContaining([
      expect.objectContaining({
        id: invoice.body.id,
        status: "paid",
        invoiceNumber: "CAP-CASH-001",
      }),
    ]));
  });

  it("preserves newsletter subscription validation and duplicate detection", async () => {
    const api = request(app);
    const url = "/api/newsletter/subscribe";
    await api.post(url).send({}).expect(400);
    await api.post(url).send({ email: "newsletter@test.invalid" }).expect(200);
    await api.post(url).send({ email: "newsletter@test.invalid" }).expect(400, { message: "Already subscribed" });
  });
});
