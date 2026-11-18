CREATE TABLE IF NOT EXISTS engineering_records (
 id varchar PRIMARY KEY DEFAULT gen_random_uuid(), owner_user_id varchar NOT NULL REFERENCES users(id),
 context varchar(24) NOT NULL CHECK(context IN ('personal','aothothe','sudern')),
 kind varchar(32) NOT NULL CHECK(kind IN ('diary','task','work_log','risk','decision','meeting','presentation','content','ai_review','asset','security_event','practice')),
 title varchar(200) NOT NULL, summary text NOT NULL DEFAULT '', work_date varchar(10) NOT NULL,
 due_date varchar(10), status varchar(24) NOT NULL DEFAULT 'draft' CHECK(status IN ('draft','planned','active','blocked','review','done','archived')),
 priority integer NOT NULL DEFAULT 2 CHECK(priority BETWEEN 1 AND 4), accountable varchar(160) NOT NULL,
 evidence text[] NOT NULL DEFAULT ARRAY[]::text[], details jsonb NOT NULL CHECK(jsonb_typeof(details)='object'),
 version integer NOT NULL DEFAULT 1 CHECK(version>0), created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS engineering_records_owner_context_idx ON engineering_records(owner_user_id,context,work_date);
CREATE INDEX IF NOT EXISTS engineering_records_queue_idx ON engineering_records(owner_user_id,context,kind,status,due_date);
CREATE TABLE IF NOT EXISTS engineering_versions (
 id varchar PRIMARY KEY DEFAULT gen_random_uuid(),record_id varchar NOT NULL REFERENCES engineering_records(id),
 version integer NOT NULL,snapshot jsonb NOT NULL,actor_user_id varchar NOT NULL REFERENCES users(id),created_at timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS engineering_versions_record_version_idx ON engineering_versions(record_id,version);
CREATE TABLE IF NOT EXISTS engineering_requests (
 id varchar PRIMARY KEY DEFAULT gen_random_uuid(),actor_user_id varchar NOT NULL REFERENCES users(id),request_key varchar(36) NOT NULL,
 fingerprint varchar(64) NOT NULL,response jsonb NOT NULL,created_at timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS engineering_requests_actor_key_idx ON engineering_requests(actor_user_id,request_key);
CREATE INDEX IF NOT EXISTS engineering_requests_actor_time_idx ON engineering_requests(actor_user_id,created_at);
CREATE TABLE IF NOT EXISTS engineering_publications (
 id varchar PRIMARY KEY DEFAULT gen_random_uuid(),record_id varchar NOT NULL REFERENCES engineering_records(id),version integer NOT NULL,
 slug varchar(180) NOT NULL UNIQUE,snapshot jsonb NOT NULL,published_by varchar NOT NULL REFERENCES users(id),
 published_at timestamptz NOT NULL DEFAULT now(),withdrawn_at timestamptz,
 CONSTRAINT engineering_publications_version_fk FOREIGN KEY(record_id,version) REFERENCES engineering_versions(record_id,version)
);
CREATE UNIQUE INDEX IF NOT EXISTS engineering_publications_record_version_idx ON engineering_publications(record_id,version);
CREATE INDEX IF NOT EXISTS engineering_publications_public_idx ON engineering_publications(withdrawn_at,published_at);
CREATE OR REPLACE FUNCTION engineering_history_immutable() RETURNS trigger AS $$
BEGIN RAISE EXCEPTION 'Engineering history is immutable'; END; $$ LANGUAGE plpgsql;
DO $$ BEGIN
 IF NOT EXISTS(SELECT 1 FROM pg_trigger WHERE tgname='engineering_versions_immutable') THEN
  CREATE TRIGGER engineering_versions_immutable BEFORE UPDATE OR DELETE ON engineering_versions FOR EACH ROW EXECUTE FUNCTION engineering_history_immutable();
 END IF;
END $$;
CREATE OR REPLACE FUNCTION engineering_publication_snapshot_immutable() RETURNS trigger AS $$
BEGIN
 IF NEW.id IS DISTINCT FROM OLD.id OR NEW.record_id IS DISTINCT FROM OLD.record_id OR NEW.version IS DISTINCT FROM OLD.version
 OR NEW.slug IS DISTINCT FROM OLD.slug OR NEW.snapshot IS DISTINCT FROM OLD.snapshot OR NEW.published_by IS DISTINCT FROM OLD.published_by
 OR NEW.published_at IS DISTINCT FROM OLD.published_at OR OLD.withdrawn_at IS NOT NULL THEN
  RAISE EXCEPTION 'Published snapshots are immutable';
 END IF;
 RETURN NEW;
END; $$ LANGUAGE plpgsql;
DO $$ BEGIN
 IF NOT EXISTS(SELECT 1 FROM pg_trigger WHERE tgname='engineering_publication_immutable') THEN
  CREATE TRIGGER engineering_publication_immutable BEFORE UPDATE ON engineering_publications FOR EACH ROW EXECUTE FUNCTION engineering_publication_snapshot_immutable();
 END IF;
END $$;
INSERT INTO permissions(key,description) VALUES
 ('engineering.read','Read own private engineering coordination records'),
 ('engineering.manage','Create and revise own engineering coordination records'),
 ('engineering.publish','Explicitly review and publish a sanitized engineering-journal snapshot')
ON CONFLICT(key) DO NOTHING;
INSERT INTO role_permissions(role_id,permission_id)
 SELECT r.id,p.id FROM roles r CROSS JOIN permissions p
 WHERE r.key IN ('super_administrator','administrator') AND p.key IN ('engineering.read','engineering.manage','engineering.publish')
ON CONFLICT DO NOTHING;

CREATE OR REPLACE FUNCTION engineering_record_identity_immutable() RETURNS trigger AS $$
BEGIN
 IF NEW.owner_user_id IS DISTINCT FROM OLD.owner_user_id OR NEW.context IS DISTINCT FROM OLD.context OR NEW.kind IS DISTINCT FROM OLD.kind
 OR NEW.created_at IS DISTINCT FROM OLD.created_at OR NEW.version <> OLD.version+1 THEN
  RAISE EXCEPTION 'Record identity is immutable and revisions must advance by one';
 END IF;
 RETURN NEW;
END; $$ LANGUAGE plpgsql;
DO $$ BEGIN
 IF NOT EXISTS(SELECT 1 FROM pg_trigger WHERE tgname='engineering_record_identity_immutable') THEN
  CREATE TRIGGER engineering_record_identity_immutable BEFORE UPDATE ON engineering_records FOR EACH ROW EXECUTE FUNCTION engineering_record_identity_immutable();
 END IF;
 IF NOT EXISTS(SELECT 1 FROM pg_trigger WHERE tgname='engineering_publication_no_delete') THEN
  CREATE TRIGGER engineering_publication_no_delete BEFORE DELETE ON engineering_publications FOR EACH ROW EXECUTE FUNCTION engineering_history_immutable();
 END IF;
END $$;
