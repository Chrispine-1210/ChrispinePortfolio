ALTER TABLE blog_posts ADD COLUMN IF NOT EXISTS workflow_status varchar(24) NOT NULL DEFAULT 'draft';
ALTER TABLE blog_posts ADD COLUMN IF NOT EXISTS scheduled_at timestamp;
ALTER TABLE blog_posts ADD COLUMN IF NOT EXISTS approved_at timestamp;
ALTER TABLE blog_posts ADD COLUMN IF NOT EXISTS author_id varchar REFERENCES users(id) ON DELETE SET NULL;
ALTER TABLE blog_posts ADD COLUMN IF NOT EXISTS editor_id varchar REFERENCES users(id) ON DELETE SET NULL;
ALTER TABLE blog_posts ADD COLUMN IF NOT EXISTS approver_id varchar REFERENCES users(id) ON DELETE SET NULL;
ALTER TABLE blog_posts ADD COLUMN IF NOT EXISTS seo_title varchar(70);
ALTER TABLE blog_posts ADD COLUMN IF NOT EXISTS seo_description varchar(170);
ALTER TABLE blog_posts ADD COLUMN IF NOT EXISTS canonical_url text;
ALTER TABLE blog_posts ADD COLUMN IF NOT EXISTS og_image text;
ALTER TABLE blog_posts ADD COLUMN IF NOT EXISTS visibility varchar(24) NOT NULL DEFAULT 'public';
ALTER TABLE blog_posts ADD COLUMN IF NOT EXISTS current_version integer NOT NULL DEFAULT 1;
ALTER TABLE blog_posts ADD COLUMN IF NOT EXISTS archived_at timestamp;
ALTER TABLE blog_posts ALTER COLUMN is_published SET DEFAULT false;
ALTER TABLE blog_posts ALTER COLUMN published_at DROP DEFAULT;

UPDATE blog_posts SET workflow_status = CASE WHEN is_published THEN 'published' ELSE 'draft' END
WHERE workflow_status = 'draft' AND is_published = true;

DO $$ BEGIN
  ALTER TABLE blog_posts ADD CONSTRAINT blog_workflow_status_valid
    CHECK (workflow_status IN ('draft','in_review','approved','scheduled','published','archived'));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  ALTER TABLE blog_posts ADD CONSTRAINT blog_visibility_valid
    CHECK (visibility IN ('public','unlisted','private'));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE INDEX IF NOT EXISTS blog_workflow_idx ON blog_posts(workflow_status, scheduled_at);

CREATE TABLE IF NOT EXISTS content_versions (
  id varchar PRIMARY KEY DEFAULT gen_random_uuid(), post_id varchar NOT NULL REFERENCES blog_posts(id) ON DELETE CASCADE,
  version integer NOT NULL, snapshot jsonb NOT NULL, change_summary varchar(500),
  created_by varchar REFERENCES users(id) ON DELETE SET NULL, created_at timestamp NOT NULL DEFAULT now(),
  CONSTRAINT content_versions_post_version_unique UNIQUE (post_id, version)
);
CREATE UNIQUE INDEX IF NOT EXISTS content_versions_post_version_idx ON content_versions(post_id, version);
CREATE INDEX IF NOT EXISTS content_versions_post_time_idx ON content_versions(post_id, created_at);

CREATE OR REPLACE FUNCTION prevent_content_version_mutation() RETURNS trigger AS $$
BEGIN
  RAISE EXCEPTION 'content version history is immutable';
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS content_versions_immutable ON content_versions;
CREATE TRIGGER content_versions_immutable
BEFORE UPDATE OR DELETE ON content_versions
FOR EACH ROW EXECUTE FUNCTION prevent_content_version_mutation();

INSERT INTO content_versions (post_id, version, snapshot, change_summary)
SELECT id, current_version, to_jsonb(blog_posts), 'Baseline version created during workflow migration'
FROM blog_posts
ON CONFLICT (post_id, version) DO NOTHING;
