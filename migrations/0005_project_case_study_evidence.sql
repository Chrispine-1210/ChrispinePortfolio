CREATE TABLE IF NOT EXISTS projects (
  id varchar PRIMARY KEY DEFAULT gen_random_uuid(),
  project_code varchar(80) NOT NULL UNIQUE,
  name varchar(240) NOT NULL,
  organization_name varchar(240),
  sector varchar(160),
  country varchar(120),
  status varchar(32) NOT NULL DEFAULT 'active',
  confidentiality varchar(32) NOT NULL DEFAULT 'internal',
  internal_summary text,
  commercial_value numeric(14,2),
  currency varchar(3) NOT NULL DEFAULT 'USD',
  start_date timestamp,
  target_date timestamp,
  repository_url text,
  deployment_url text,
  owner_id varchar REFERENCES users(id) ON DELETE SET NULL,
  legacy_portfolio_project_id varchar UNIQUE REFERENCES portfolio_projects(id) ON DELETE SET NULL,
  archived_at timestamp,
  created_at timestamp NOT NULL DEFAULT now(),
  updated_at timestamp NOT NULL DEFAULT now()
);

DO $$ BEGIN
  ALTER TABLE projects ADD CONSTRAINT projects_status_valid
    CHECK (status IN ('planned','active','hold','completed','cancelled','legacy'));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  ALTER TABLE projects ADD CONSTRAINT projects_confidentiality_valid
    CHECK (confidentiality IN ('internal','confidential','restricted'));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE INDEX IF NOT EXISTS projects_status_idx ON projects(status, updated_at);
CREATE INDEX IF NOT EXISTS projects_owner_idx ON projects(owner_id, status);
CREATE INDEX IF NOT EXISTS projects_confidentiality_idx ON projects(confidentiality);

CREATE TABLE IF NOT EXISTS case_studies (
  id varchar PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id varchar REFERENCES projects(id) ON DELETE SET NULL,
  title varchar(300) NOT NULL,
  slug varchar(240) NOT NULL UNIQUE,
  summary text NOT NULL,
  challenge text,
  constraints text,
  objectives text,
  solution text,
  architecture text,
  technologies text[] NOT NULL DEFAULT ARRAY[]::text[],
  security_controls text,
  integrations text,
  role_description text,
  team_description text,
  timeline text,
  outcome text,
  lessons text,
  next_phase text,
  category varchar(160) NOT NULL,
  featured_image text,
  images text[] NOT NULL DEFAULT ARRAY[]::text[],
  live_url text,
  github_url text,
  workflow_status varchar(24) NOT NULL DEFAULT 'draft',
  visibility varchar(24) NOT NULL DEFAULT 'private',
  evidence_gate_status varchar(24) NOT NULL DEFAULT 'blocked',
  featured boolean NOT NULL DEFAULT false,
  "order" integer NOT NULL DEFAULT 0,
  seo_title varchar(70),
  seo_description varchar(170),
  canonical_url text,
  og_image text,
  approved_at timestamp,
  published_at timestamp,
  archived_at timestamp,
  created_by varchar REFERENCES users(id) ON DELETE SET NULL,
  updated_by varchar REFERENCES users(id) ON DELETE SET NULL,
  created_at timestamp NOT NULL DEFAULT now(),
  updated_at timestamp NOT NULL DEFAULT now()
);

DO $$ BEGIN
  ALTER TABLE case_studies ADD CONSTRAINT case_studies_workflow_valid
    CHECK (workflow_status IN ('draft','in_review','approved','published','archived'));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  ALTER TABLE case_studies ADD CONSTRAINT case_studies_visibility_valid
    CHECK (visibility IN ('public','unlisted','private'));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  ALTER TABLE case_studies ADD CONSTRAINT case_studies_evidence_gate_valid
    CHECK (evidence_gate_status IN ('blocked','approved'));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE UNIQUE INDEX IF NOT EXISTS case_studies_slug_idx ON case_studies(slug);
CREATE INDEX IF NOT EXISTS case_studies_publication_idx
  ON case_studies(workflow_status, visibility, evidence_gate_status, "order");
CREATE INDEX IF NOT EXISTS case_studies_project_idx ON case_studies(project_id);

CREATE TABLE IF NOT EXISTS case_study_evidence (
  id varchar PRIMARY KEY DEFAULT gen_random_uuid(),
  case_study_id varchar NOT NULL REFERENCES case_studies(id) ON DELETE CASCADE,
  claim text NOT NULL,
  claim_type varchar(80) NOT NULL DEFAULT 'delivery',
  source_type varchar(80) NOT NULL,
  source_reference text NOT NULL,
  measurement_period varchar(160),
  calculation_method text,
  verification_status varchar(32) NOT NULL DEFAULT 'unverified',
  disclosure_status varchar(32) NOT NULL DEFAULT 'private',
  verified_by varchar REFERENCES users(id) ON DELETE SET NULL,
  verified_at timestamp,
  notes text,
  created_by varchar REFERENCES users(id) ON DELETE SET NULL,
  created_at timestamp NOT NULL DEFAULT now(),
  updated_at timestamp NOT NULL DEFAULT now(),
  CONSTRAINT case_study_evidence_unique_claim UNIQUE (case_study_id, claim)
);

DO $$ BEGIN
  ALTER TABLE case_study_evidence ADD CONSTRAINT case_study_evidence_verification_valid
    CHECK (verification_status IN ('unverified','internally_verified','externally_verified','rejected'));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  ALTER TABLE case_study_evidence ADD CONSTRAINT case_study_evidence_disclosure_valid
    CHECK (disclosure_status IN ('private','review','approved_public','rejected'));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE INDEX IF NOT EXISTS case_study_evidence_case_study_idx
  ON case_study_evidence(case_study_id, created_at);
CREATE INDEX IF NOT EXISTS case_study_evidence_verification_idx
  ON case_study_evidence(case_study_id, verification_status, disclosure_status);

-- Legacy portfolio records become internal projects only. They are deliberately
-- not copied into case_studies, preventing old CMS content from becoming public.
INSERT INTO projects (
  project_code, name, status, confidentiality, internal_summary,
  repository_url, deployment_url, legacy_portfolio_project_id
)
SELECT
  'LEGACY-' || substr(md5(id), 1, 12),
  title,
  'legacy',
  'internal',
  description,
  github_url,
  live_url,
  id
FROM portfolio_projects
ON CONFLICT (legacy_portfolio_project_id) DO NOTHING;

-- Curated project anchors for the two evidence-approved public studies.
INSERT INTO projects (
  project_code, name, organization_name, sector, country, status,
  confidentiality, internal_summary, repository_url
) VALUES
(
  'MEC-PUBLIC-CASE',
  'Mtendere Education Consult',
  'Mtendere Education Consult',
  'Education Technology',
  'Malawi',
  'active',
  'internal',
  'Portfolio evidence anchor. Public disclosure is controlled through case_studies and case_study_evidence.',
  'https://github.com/Chrispine-1210/MEC'
),
(
  'AOTHOTHE-EOS-PUBLIC-CASE',
  'Aöthothe Enterprise OS',
  'Aöthothe Technologies',
  'Enterprise Software',
  'Malawi',
  'active',
  'internal',
  'Portfolio evidence anchor for a controlled draft engineering release. Public disclosure is controlled separately.',
  NULL
)
ON CONFLICT (project_code) DO NOTHING;

INSERT INTO case_studies (
  project_id, title, slug, summary, challenge, solution, outcome, category,
  technologies, github_url, workflow_status, visibility, evidence_gate_status,
  featured, "order", approved_at, published_at
)
SELECT
  p.id,
  'Mtendere Education Consult - Full-Stack Platform Delivery',
  'mtendere-education-platform',
  'A public education-consultancy platform and administrative workspace. This study is limited to inspectable engineering evidence; it makes no client adoption, revenue, or operational-impact claim.',
  'Deliver a maintainable web platform for public information and operational workflows while keeping data, role boundaries, and release work under control. Client performance metrics and acceptance records are not public evidence and are deliberately excluded.',
  $$## Evidence scope
This case study is based on the project's source repository, migration history, and automated tests. It does not present private client data, public-service availability, or unsupported business outcomes.

## Engineering contribution
- React and TypeScript client with a Node.js and Express service layer.
- PostgreSQL and Drizzle-backed data model with recorded migrations.
- Public content and application flows alongside protected administration, role, and MFA-related test coverage.
- Test suites for unit, integration, end-to-end, and smoke scenarios are maintained in the repository.

## Release evidence
- The portfolio release records the exact verification commands and outcomes in its release note.
- The public source repository is linked for direct inspection.
- Operational adoption, turnaround-time, engagement, and partner claims remain out of scope until a client-approved evidence record exists.$$,
  'Evidence status: source-backed delivery case study. Client outcome metrics and public-service availability are not published as verified facts.',
  'Full-Stack Delivery',
  ARRAY['React','TypeScript','Node.js','Express','PostgreSQL','Drizzle ORM','Tailwind CSS','Vite'],
  'https://github.com/Chrispine-1210/MEC',
  'published',
  'public',
  'approved',
  true,
  1,
  timestamp '2026-08-31 00:00:00',
  timestamp '2026-08-31 00:00:00'
FROM projects p
WHERE p.project_code = 'MEC-PUBLIC-CASE'
ON CONFLICT (slug) DO NOTHING;

INSERT INTO case_studies (
  project_id, title, slug, summary, challenge, solution, outcome, category,
  technologies, workflow_status, visibility, evidence_gate_status,
  featured, "order", approved_at, published_at
)
SELECT
  p.id,
  'Aöthothe Enterprise OS - Governed Commercial Foundation',
  'aothothe-enterprise-os-commercial-foundation',
  'An internal enterprise operating-system slice for governed catalogues, pricing, proposals, and quotations. It is presented as a draft engineering release, not as a deployed product or customer deployment.',
  'Create controlled commercial workflows that preserve price history, prevent unauthorized changes, and retain decision evidence before any client or financial activity is enabled.',
  $$## Delivered in the recorded draft
- Governed catalogue, pricing, proposal, and quotation workflows with evidence-backed price overrides and maker-checker approval.
- Versioned templates, immutable approved history, database-enforced lifecycle controls, protected commercial UI, and audit/evidence views.
- Clean and populated migration checks, strict TypeScript and production-build checks, security review, secret scan, licence policy, and dependency audit.

## Verification record
The draft pull request records 37/37 integration and service tests and 18/18 Playwright desktop/mobile journeys. It also records a successful production build and zero high-severity production dependency vulnerabilities.

## Release boundary
The pull request remains a draft and its recorded decision is HOLD. GitHub Actions startup failure is unresolved; the work is not merged to the protected release line, deployed, connected to live pricing/taxes, or used for contracts, collections, or client operations.$$,
  'Evidence status: draft engineering release with recorded local verification. No production deployment, client usage, revenue, security-certification, or operational-outcome claim is made.',
  'Enterprise Systems',
  ARRAY['Next.js','TypeScript','PostgreSQL','Playwright','RBAC','Audit Evidence'],
  'published',
  'public',
  'approved',
  true,
  2,
  timestamp '2026-08-31 00:00:00',
  timestamp '2026-08-31 00:00:00'
FROM projects p
WHERE p.project_code = 'AOTHOTHE-EOS-PUBLIC-CASE'
ON CONFLICT (slug) DO NOTHING;

INSERT INTO case_study_evidence (
  case_study_id, claim, claim_type, source_type, source_reference,
  verification_status, disclosure_status, verified_at, notes
)
SELECT
  cs.id,
  'Source-backed engineering delivery case study; no client adoption, revenue, service-availability, or operational-impact metric is asserted.',
  'delivery',
  'repository',
  'https://github.com/Chrispine-1210/MEC',
  'internally_verified',
  'approved_public',
  timestamp '2026-08-31 00:00:00',
  'Approved public evidence boundary from the proof-driven portfolio release.'
FROM case_studies cs
WHERE cs.slug = 'mtendere-education-platform'
ON CONFLICT (case_study_id, claim) DO NOTHING;

INSERT INTO case_study_evidence (
  case_study_id, claim, claim_type, source_type, source_reference,
  verification_status, disclosure_status, verified_at, notes
)
SELECT
  cs.id,
  'Draft engineering release with recorded verification and an explicit HOLD boundary; no production, customer, revenue, or operational-use claim is asserted.',
  'release_state',
  'release_record',
  'docs/releases/2026-08-31-proof-driven-portfolio.md',
  'internally_verified',
  'approved_public',
  timestamp '2026-08-31 00:00:00',
  'Approved public evidence boundary from the proof-driven portfolio release.'
FROM case_studies cs
WHERE cs.slug = 'aothothe-enterprise-os-commercial-foundation'
ON CONFLICT (case_study_id, claim) DO NOTHING;
