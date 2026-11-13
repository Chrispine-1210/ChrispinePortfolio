import { readFile } from "node:fs/promises";
import { PGlite } from "@electric-sql/pglite";
import { describe, expect, it } from "vitest";
import { evaluateEvidenceGate } from "./portfolio/policy.js";

describe("case study evidence policy", () => {
  it("blocks publication without evidence", () => {
    expect(evaluateEvidenceGate([])).toMatchObject({
      status: "blocked",
      approvedPublicClaims: 0,
    });
  });

  it("blocks unresolved evidence even when another claim is public-approved", () => {
    const result = evaluateEvidenceGate([
      { verificationStatus: "internally_verified", disclosureStatus: "approved_public" },
      { verificationStatus: "unverified", disclosureStatus: "review" },
    ] as any);
    expect(result.status).toBe("blocked");
    expect(result.approvedPublicClaims).toBe(1);
    expect(result.reasons.join(" ")).toMatch(/not verified/i);
  });

  it("approves only when evidence is verified and disclosure is resolved", () => {
    expect(evaluateEvidenceGate([
      { verificationStatus: "internally_verified", disclosureStatus: "approved_public" },
      { verificationStatus: "externally_verified", disclosureStatus: "private" },
    ] as any)).toEqual({
      status: "approved",
      reasons: [],
      approvedPublicClaims: 1,
    });
  });

  it("retains withdrawn evidence for audit without letting it block publication", () => {
    expect(evaluateEvidenceGate([
      { verificationStatus: "internally_verified", disclosureStatus: "approved_public" },
      { verificationStatus: "rejected", disclosureStatus: "withdrawn" },
    ] as any)).toEqual({
      status: "approved",
      reasons: [],
      approvedPublicClaims: 1,
    });
  });
});

describe("project and case-study separation migration", () => {
  it("is idempotent, keeps legacy CMS rows internal, and seeds only the approved public studies", async () => {
    const database = new PGlite();
    try {
      for (const file of [
        "migrations/0000_secure_foundation.sql",
        "migrations/0001_email_delivery_foundation.sql",
        "migrations/0002_notification_platform.sql",
        "migrations/0003_crm_pipeline.sql",
        "migrations/0004_content_workflow.sql",
      ]) {
        await database.exec(await readFile(file, "utf8"));
      }

      await database.exec(`
        insert into portfolio_projects
          (title, slug, description, category, outcome, featured)
        values
          ('Legacy Unsupported Claim', 'legacy-unsupported-claim',
           'This legacy row must never be published automatically.',
           'Legacy', 'Unsupported outcome', true)
      `);

      const migration = await readFile(
        "migrations/0005_project_case_study_evidence.sql",
        "utf8",
      );
      await database.exec(migration);
      await database.exec(migration);

      const legacyInternal = await database.query<{ count: number }>(`
        select count(*)::int as count from projects
        where legacy_portfolio_project_id is not null
      `);
      const legacyPublic = await database.query<{ count: number }>(`
        select count(*)::int as count from case_studies
        where slug = 'legacy-unsupported-claim'
      `);
      const publicStudies = await database.query<{
        slug: string;
        workflow_status: string;
        visibility: string;
        evidence_gate_status: string;
      }>(`
        select slug, workflow_status, visibility, evidence_gate_status
        from case_studies order by "order", slug
      `);
      const evidence = await database.query<{ count: number }>(`
        select count(*)::int as count from case_study_evidence
      `);
      const approvalPermission = await database.query<{ count: number }>(`
        select count(*)::int as count
        from permissions
        where "key" = 'portfolio.approve'
      `);
      const approvalRoleMappings = await database.query<{ count: number }>(`
        select count(*)::int as count
        from role_permissions rp
        join permissions p on p.id = rp.permission_id
        join roles r on r.id = rp.role_id
        where p."key" = 'portfolio.approve'
          and r."key" in ('super_administrator', 'administrator', 'content_manager')
      `);

      expect(legacyInternal.rows[0]?.count).toBe(1);
      expect(legacyPublic.rows[0]?.count).toBe(0);
      expect(publicStudies.rows.map((row) => row.slug)).toEqual([
        "mtendere-education-platform",
        "aothothe-enterprise-os-commercial-foundation",
      ]);
      expect(publicStudies.rows.every((row) =>
        row.workflow_status === "published" &&
        row.visibility === "public" &&
        row.evidence_gate_status === "approved"
      )).toBe(true);
      expect(evidence.rows[0]?.count).toBe(2);
      expect(approvalPermission.rows[0]?.count).toBe(1);
      expect(approvalRoleMappings.rows[0]?.count).toBe(3);

      await database.exec(`
        update case_studies set slug = 'retitled-approved-study'
        where slug = 'mtendere-education-platform';
        insert into case_studies (title, slug, summary, category)
        values ('Editorial draft', 'mtendere-education-platform', 'Editorial copy', 'Draft');
      `);
      await database.exec(migration);
      const editorialDraft = await database.query(`
        select workflow_status, evidence_gate_status, count(case_study_evidence.id)::int as evidence_count
        from case_studies left join case_study_evidence on case_studies.id = case_study_evidence.case_study_id
        where slug = 'mtendere-education-platform'
        group by case_studies.id
      `);
      expect(editorialDraft.rows).toEqual([{
        workflow_status: "draft", evidence_gate_status: "blocked", evidence_count: 0,
      }]);
    } finally {
      await database.close();
    }
  }, 60_000);

  it("enforces workflow and evidence status constraints", async () => {
    const database = new PGlite();
    try {
      for (const file of [
        "migrations/0000_secure_foundation.sql",
        "migrations/0001_email_delivery_foundation.sql",
        "migrations/0002_notification_platform.sql",
        "migrations/0003_crm_pipeline.sql",
        "migrations/0004_content_workflow.sql",
        "migrations/0005_project_case_study_evidence.sql",
      ]) {
        await database.exec(await readFile(file, "utf8"));
      }

      await expect(database.exec(`
        insert into case_studies (title, slug, summary, category, workflow_status)
        values ('Bad Workflow', 'bad-workflow', 'x', 'Test', 'invented')
      `)).rejects.toThrow();

      const study = await database.query<{ id: string }>(
        "select id from case_studies limit 1",
      );

      await database.exec(`
        insert into case_study_evidence
          (case_study_id, claim, source_type, source_reference)
        values
          ('${study.rows[0]!.id}', 'Default private evidence', 'test', 'test-default')
      `);
      const defaultEvidence = await database.query<{
        verification_status: string;
        disclosure_status: string;
      }>(`
        select verification_status, disclosure_status
        from case_study_evidence
        where claim = 'Default private evidence'
      `);
      expect(defaultEvidence.rows[0]).toMatchObject({
        verification_status: "unverified",
        disclosure_status: "private",
      });

      await expect(database.exec(`
        insert into case_study_evidence
          (case_study_id, claim, source_type, source_reference, verification_status)
        values
          ('${study.rows[0]!.id}', 'Bad evidence', 'test', 'test', 'invented')
      `)).rejects.toThrow();
    } finally {
      await database.close();
    }
  }, 60_000);
});
