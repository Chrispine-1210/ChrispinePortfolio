import { readFile } from "node:fs/promises";
import { PGlite } from "@electric-sql/pglite";
import { describe, expect, it } from "vitest";
import { casebooksSql, type CasebookCatalogue } from "../scripts/portfolio-casebooks-sql.js";

describe("reviewed portfolio casebook publication", () => {
  it("publishes atomically, preserves prior evidence, respects editorial leases and is idempotent", async () => {
    const db = new PGlite();
    try {
      for (const name of ["0000_secure_foundation", "0001_email_delivery_foundation", "0002_notification_platform", "0003_crm_pipeline", "0004_content_workflow", "0005_project_case_study_evidence", "0006_case_study_evidence_withdrawal"]) {
        await db.exec(await readFile(`migrations/${name}.sql`, "utf8"));
      }
      const original = await db.query<{slug:string;updated_at:string}>("select slug, updated_at::text from case_studies");
      const expected = Object.fromEntries(original.rows.map(r=>[r.slug,r.updated_at]));
      const catalogue: CasebookCatalogue = JSON.parse(await readFile("docs/portfolio/casebooks-2026-11-18.json","utf8"));
      const sql = casebooksSql(catalogue, expected);
      // An intervening editor must prevent the entire batch, including inserts.
      await db.exec("update case_studies set updated_at = updated_at + interval '1 second' where slug='aothothe-enterprise-os-commercial-foundation'");
      await expect(db.exec(sql)).rejects.toThrow(/Concurrent or unapproved/);
      expect((await db.query("select count(*)::int as count from case_studies")).rows).toEqual([{count:2}]);
      expect((await db.query("select count(*)::int as count from audit_events where action='case_study.reviewed_import_publish'")).rows).toEqual([{count:0}]);
      await db.query("update case_studies set updated_at=$1::timestamp where slug=$2", [expected["aothothe-enterprise-os-commercial-foundation"],"aothothe-enterprise-os-commercial-foundation"]);
      await db.exec(sql);
      await db.exec(sql);
      expect((await db.query("select count(*)::int as count from case_studies where workflow_status='published' and visibility='public' and evidence_gate_status='approved'")).rows).toEqual([{count:16}]);
      expect((await db.query("select count(*)::int as count from audit_events where action='case_study.reviewed_import_publish'")).rows).toEqual([{count:16}]);
      expect((await db.query("select count(*)::int as count from case_study_evidence where disclosure_status='withdrawn'")).rows).toEqual([{count:2}]);
      expect((await db.query("select count(*)::int as count from case_study_evidence where disclosure_status='approved_public' and verification_status='internally_verified'")).rows).toEqual([{count:16}]);
      expect((await db.query("select count(*)::int as count from audit_events where action='case_study.reviewed_import_publish' and previous_state->'caseStudy'->>'slug' is not null")).rows).toEqual([{count:2}]);
      // Reusing a revision for edited content must not silently skip the edit.
      catalogue.caseStudies[0]!.record.summary = "Changed without a fresh review revision";
      await expect(db.exec(casebooksSql(catalogue, expected))).rejects.toThrow(/different content/);
    } finally { await db.close(); }
  }, 60_000);
});
