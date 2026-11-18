import { createHash } from "node:crypto";

type Casebook = { record: Record<string, unknown>; review: Record<string, unknown> };
export type CasebookCatalogue = { revision: string; caseStudies: Casebook[] };
const fields = {
  title: "title", slug: "slug", summary: "summary", challenge: "challenge",
  constraints: "constraints", objectives: "objectives", solution: "solution",
  architecture: "architecture", technologies: "technologies", securityControls: "security_controls",
  integrations: "integrations", roleDescription: "role_description", teamDescription: "team_description",
  timeline: "timeline", outcome: "outcome", lessons: "lessons", nextPhase: "next_phase",
  category: "category", featuredImage: "featured_image", images: "images", liveUrl: "live_url",
  githubUrl: "github_url", visibility: "visibility", featured: "featured", order: "order",
} as const;
const literal = (value: string) => "'" + value.replaceAll("'", "''") + "'";

// An audited editorial data import, never an application startup migration.
// Expected timestamps make an old review incapable of overwriting newer edits.
export function casebooksSql(catalogue: CasebookCatalogue, expected: Record<string, string>) {
  if (!/^[a-z0-9-]+$/.test(catalogue.revision)) throw new Error("Invalid review revision");
  const slugs = catalogue.caseStudies.map(({ record }) => record.slug);
  if (new Set(slugs).size !== slugs.length) throw new Error("Duplicate case-study slug");
  for (const { record, review } of catalogue.caseStudies) {
    if (typeof record.slug !== "string" || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(record.slug)) throw new Error("Invalid slug");
    if (!record.title || !record.summary || !record.category || record.visibility !== "public") throw new Error("Incomplete public record");
    if (review.status !== "internally_verified" || review.disclosure !== "approved_public" || !review.claim) throw new Error("Unreviewed case study");
    for (const url of [record.liveUrl, record.githubUrl, record.featuredImage, ...(record.images as string[] ?? [])]) {
      if (url && !/^https:\/\//.test(String(url))) throw new Error("Only HTTPS publication URLs are accepted");
    }
  }
  const data = catalogue.caseStudies.map(({ record, review }) => ({
    record: Object.fromEntries(Object.entries(fields).map(([key, column]) => [column, record[key] ?? null])), review,
  }));
  const digest = createHash("sha256").update(JSON.stringify(catalogue)).digest("hex");
  const names = Object.values(fields).map(column => `"${column}"`).join(", ");
  const values = Object.values(fields).map(column => `incoming."${column}"`).join(", ");
  const setters = Object.values(fields).filter(column => column !== "slug").map(column => `"${column}" = incoming."${column}"`).join(", ");
  return `DO $portfolio_review$
DECLARE
  item jsonb;
  prior case_studies%ROWTYPE;
  incoming case_studies%ROWTYPE;
  saved case_studies%ROWTYPE;
  expected_versions jsonb := ${literal(JSON.stringify(expected))}::jsonb;
  evidence_previous jsonb;
  unresolved integer;
BEGIN
  FOR item IN SELECT value FROM jsonb_array_elements(${literal(JSON.stringify(data))}::jsonb) LOOP
    SELECT * INTO prior FROM case_studies WHERE slug = item->'record'->>'slug' FOR UPDATE;
    IF EXISTS (SELECT 1 FROM audit_events WHERE resource_id = prior.id
      AND action = 'case_study.reviewed_import_publish'
      AND metadata->>'revision' = ${literal(catalogue.revision)}) THEN
      IF EXISTS (SELECT 1 FROM audit_events WHERE resource_id = prior.id
        AND action = 'case_study.reviewed_import_publish'
        AND metadata->>'revision' = ${literal(catalogue.revision)}
        AND metadata->>'catalogueSha256' = ${literal(digest)}) THEN CONTINUE; END IF;
      RAISE EXCEPTION 'Review revision has different content; create a fresh review revision';
    END IF;
    IF prior.id IS NOT NULL AND (
      NOT expected_versions ? prior.slug OR
      prior.updated_at <> (expected_versions->>prior.slug)::timestamp OR
      prior.workflow_status <> 'published' OR prior.evidence_gate_status <> 'approved'
    ) THEN RAISE EXCEPTION 'Concurrent or unapproved editorial state for %', prior.slug; END IF;
    IF prior.id IS NULL AND expected_versions ? (item->'record'->>'slug') THEN
      RAISE EXCEPTION 'Expected existing case study was removed';
    END IF;
    incoming := jsonb_populate_record(NULL::case_studies, item->'record');
    IF prior.id IS NULL THEN
      INSERT INTO case_studies (${names}) VALUES (${values}) RETURNING * INTO saved;
    ELSE
      UPDATE case_studies SET ${setters}, workflow_status = 'draft', evidence_gate_status = 'blocked',
        updated_at = now() WHERE id = prior.id RETURNING * INTO saved;
    END IF;
    SELECT coalesce(jsonb_agg(to_jsonb(e)), '[]'::jsonb) INTO evidence_previous
      FROM case_study_evidence e WHERE case_study_id = saved.id;
    -- Preserve superseded claims and their exact prior state in the audit trail.
    UPDATE case_study_evidence SET disclosure_status = 'withdrawn',
      notes = coalesce(notes || E'\\n', '') || 'Superseded by dated casebook review ${catalogue.revision}',
      updated_at = now() WHERE case_study_id = saved.id AND disclosure_status <> 'withdrawn';
    INSERT INTO case_study_evidence (case_study_id, claim, claim_type, source_type, source_reference,
      verification_status, disclosure_status, verified_at, measurement_period, notes)
    VALUES (saved.id, item->'review'->>'claim', 'implementation_scope', 'source_and_public_surface_review',
      (item->'review')::text, 'internally_verified', 'approved_public', now(), '2026-11-18',
      'User-authorized portfolio documentation. No client endorsement, collected revenue, measured savings or production certification is inferred.');
    SELECT count(*) INTO unresolved FROM case_study_evidence
      WHERE case_study_id = saved.id AND disclosure_status <> 'withdrawn'
      AND (verification_status NOT IN ('internally_verified', 'externally_verified')
           OR disclosure_status NOT IN ('private', 'approved_public'));
    IF unresolved <> 0 OR NOT EXISTS (SELECT 1 FROM case_study_evidence
      WHERE case_study_id = saved.id AND disclosure_status = 'approved_public'
      AND verification_status IN ('internally_verified', 'externally_verified')) THEN
      RAISE EXCEPTION 'Evidence gate did not pass';
    END IF;
    UPDATE case_studies SET workflow_status = 'published', evidence_gate_status = 'approved',
      approved_at = now(), published_at = coalesce(published_at, now()), updated_at = now()
      WHERE id = saved.id RETURNING * INTO saved;
    INSERT INTO audit_events (action, resource_type, resource_id, result, justification,
      request_id, previous_state, new_state, metadata)
    VALUES ('case_study.reviewed_import_publish', 'case_study', saved.id, 'success',
      'User requested comprehensive documentation of implemented and deployed projects in the portfolio; source/surface scope reviewed and approved for public disclosure.',
      ${literal(catalogue.revision)},
      jsonb_build_object('caseStudy', CASE WHEN prior.id IS NULL THEN NULL ELSE to_jsonb(prior) END, 'evidence', evidence_previous),
      to_jsonb(saved), jsonb_build_object('revision', ${literal(catalogue.revision)},
        'catalogueSha256', ${literal(digest)}, 'actorType', 'authorized_workspace_editorial_import', 'review', item->'review'));
  END LOOP;
END $portfolio_review$;`;
}
