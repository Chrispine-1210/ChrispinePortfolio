-- Establish the Phase 1B identity, authorization, session, and audit foundation.
-- Existing portfolio tables are the production baseline, so this migration only
-- adds security columns and new tables. It is intentionally safe for the
-- already-provisioned Neon database.

-- Idempotent baseline definitions also make a fresh environment reproducible.
CREATE TABLE IF NOT EXISTS "users" (
  "id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "email" varchar UNIQUE,
  "first_name" varchar,
  "last_name" varchar,
  "profile_image_url" varchar,
  "is_premium" boolean DEFAULT false,
  "is_admin" boolean DEFAULT false,
  "stripe_customer_id" varchar,
  "stripe_subscription_id" varchar,
  "created_at" timestamp DEFAULT now(),
  "updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "blog_posts" (
  "id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "title" text NOT NULL,
  "slug" text NOT NULL UNIQUE,
  "excerpt" text NOT NULL,
  "content" text NOT NULL,
  "featured_image" text,
  "category" text NOT NULL,
  "tags" text[] DEFAULT ARRAY[]::text[],
  "is_premium" boolean DEFAULT false,
  "is_published" boolean DEFAULT true,
  "read_time_minutes" integer DEFAULT 5,
  "published_at" timestamp DEFAULT now(),
  "created_at" timestamp DEFAULT now(),
  "updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "portfolio_projects" (
  "id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "title" text NOT NULL,
  "slug" text NOT NULL UNIQUE,
  "description" text NOT NULL,
  "challenge" text,
  "solution" text,
  "outcome" text,
  "category" text NOT NULL,
  "tech_stack" text[] DEFAULT ARRAY[]::text[],
  "featured_image" text,
  "images" text[] DEFAULT ARRAY[]::text[],
  "live_url" text,
  "github_url" text,
  "featured" boolean DEFAULT false,
  "order" integer DEFAULT 0,
  "created_at" timestamp DEFAULT now(),
  "updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "newsletter_subscribers" (
  "id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "email" varchar NOT NULL UNIQUE,
  "name" text,
  "is_active" boolean DEFAULT true,
  "subscribed_at" timestamp DEFAULT now(),
  "unsubscribed_at" timestamp
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "contact_requests" (
  "id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "name" text NOT NULL,
  "email" varchar NOT NULL,
  "project_type" text,
  "message" text NOT NULL,
  "preferred_contact" text,
  "is_read" boolean DEFAULT false,
  "created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "blog_likes" (
  "id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "blog_post_id" varchar NOT NULL,
  "user_id" varchar NOT NULL,
  "created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "blog_comments" (
  "id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "blog_post_id" varchar NOT NULL,
  "user_id" varchar NOT NULL,
  "parent_id" varchar,
  "content" text NOT NULL,
  "created_at" timestamp DEFAULT now(),
  "updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "email_templates" (
  "id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "name" text NOT NULL,
  "subject" text NOT NULL,
  "html_content" text NOT NULL,
  "text_content" text,
  "template_image" text,
  "marketing_tips" text,
  "category" text,
  "is_active" boolean DEFAULT true,
  "created_at" timestamp DEFAULT now(),
  "updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "external_posts" (
  "id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "title" text NOT NULL,
  "source" text NOT NULL,
  "url" text NOT NULL,
  "excerpt" text,
  "featured_image" text,
  "published_at" timestamp,
  "category" text,
  "embed_code" text,
  "is_active" boolean DEFAULT true,
  "created_at" timestamp DEFAULT now(),
  "updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint

CREATE INDEX IF NOT EXISTS "blog_category_idx" ON "blog_posts" ("category");
CREATE INDEX IF NOT EXISTS "blog_published_idx" ON "blog_posts" ("is_published");
CREATE INDEX IF NOT EXISTS "blog_published_at_idx" ON "blog_posts" ("published_at");
CREATE INDEX IF NOT EXISTS "blog_slug_idx" ON "blog_posts" ("slug");
CREATE INDEX IF NOT EXISTS "portfolio_category_idx" ON "portfolio_projects" ("category");
CREATE INDEX IF NOT EXISTS "portfolio_featured_idx" ON "portfolio_projects" ("featured");
CREATE INDEX IF NOT EXISTS "portfolio_slug_idx" ON "portfolio_projects" ("slug");
CREATE INDEX IF NOT EXISTS "portfolio_order_idx" ON "portfolio_projects" ("order");
--> statement-breakpoint

ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "password_hash" text;
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "status" varchar(24) DEFAULT 'active' NOT NULL;
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "email_verified_at" timestamp;
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "last_login_at" timestamp;
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "failed_login_attempts" integer DEFAULT 0 NOT NULL;
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "locked_until" timestamp;
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "security_version" integer DEFAULT 1 NOT NULL;
--> statement-breakpoint

CREATE TABLE IF NOT EXISTS "roles" (
  "id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "key" varchar(80) NOT NULL UNIQUE,
  "name" varchar(120) NOT NULL,
  "description" text,
  "is_system" boolean DEFAULT false NOT NULL,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "permissions" (
  "id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "key" varchar(120) NOT NULL UNIQUE,
  "description" text,
  "created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "role_permissions" (
  "role_id" varchar NOT NULL REFERENCES "roles"("id") ON DELETE cascade,
  "permission_id" varchar NOT NULL REFERENCES "permissions"("id") ON DELETE cascade,
  "created_at" timestamp DEFAULT now() NOT NULL,
  CONSTRAINT "role_permissions_role_id_permission_id_pk" PRIMARY KEY("role_id", "permission_id")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "user_roles" (
  "user_id" varchar NOT NULL REFERENCES "users"("id") ON DELETE cascade,
  "role_id" varchar NOT NULL REFERENCES "roles"("id") ON DELETE cascade,
  "assigned_by" varchar REFERENCES "users"("id") ON DELETE set null,
  "assigned_at" timestamp DEFAULT now() NOT NULL,
  CONSTRAINT "user_roles_user_id_role_id_pk" PRIMARY KEY("user_id", "role_id")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "sessions" (
  "id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "user_id" varchar NOT NULL REFERENCES "users"("id") ON DELETE cascade,
  "token_hash" varchar(64) NOT NULL UNIQUE,
  "user_security_version" integer NOT NULL,
  "expires_at" timestamp NOT NULL,
  "idle_expires_at" timestamp NOT NULL,
  "last_seen_at" timestamp DEFAULT now() NOT NULL,
  "revoked_at" timestamp,
  "revoked_reason" text,
  "ip_hash" varchar(64),
  "user_agent" text,
  "created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "authentication_attempts" (
  "id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "account_key_hash" varchar(64) NOT NULL,
  "network_key_hash" varchar(64) NOT NULL,
  "successful" boolean DEFAULT false NOT NULL,
  "attempted_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "audit_events" (
  "id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "actor_user_id" varchar REFERENCES "users"("id") ON DELETE set null,
  "actor_session_id" varchar REFERENCES "sessions"("id") ON DELETE set null,
  "action" varchar(160) NOT NULL,
  "resource_type" varchar(100) NOT NULL,
  "resource_id" varchar,
  "result" varchar(24) NOT NULL,
  "justification" text,
  "request_id" varchar(100),
  "ip_hash" varchar(64),
  "user_agent" text,
  "previous_state" jsonb,
  "new_state" jsonb,
  "metadata" jsonb,
  "created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "security_events" (
  "id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "user_id" varchar REFERENCES "users"("id") ON DELETE set null,
  "session_id" varchar REFERENCES "sessions"("id") ON DELETE set null,
  "type" varchar(120) NOT NULL,
  "severity" varchar(24) NOT NULL,
  "request_id" varchar(100),
  "ip_hash" varchar(64),
  "metadata" jsonb,
  "created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint

CREATE INDEX IF NOT EXISTS "users_status_idx" ON "users" ("status");
CREATE INDEX IF NOT EXISTS "user_roles_role_idx" ON "user_roles" ("role_id");
CREATE INDEX IF NOT EXISTS "sessions_user_idx" ON "sessions" ("user_id");
CREATE INDEX IF NOT EXISTS "sessions_expiry_idx" ON "sessions" ("expires_at");
CREATE INDEX IF NOT EXISTS "sessions_active_idx" ON "sessions" ("user_id", "revoked_at");
CREATE INDEX IF NOT EXISTS "auth_attempts_account_time_idx" ON "authentication_attempts" ("account_key_hash", "attempted_at");
CREATE INDEX IF NOT EXISTS "auth_attempts_network_time_idx" ON "authentication_attempts" ("network_key_hash", "attempted_at");
CREATE INDEX IF NOT EXISTS "audit_events_actor_idx" ON "audit_events" ("actor_user_id", "created_at");
CREATE INDEX IF NOT EXISTS "audit_events_resource_idx" ON "audit_events" ("resource_type", "resource_id");
CREATE INDEX IF NOT EXISTS "audit_events_action_idx" ON "audit_events" ("action", "created_at");
CREATE INDEX IF NOT EXISTS "security_events_type_time_idx" ON "security_events" ("type", "created_at");
CREATE INDEX IF NOT EXISTS "security_events_user_time_idx" ON "security_events" ("user_id", "created_at");
--> statement-breakpoint

INSERT INTO "roles" ("key", "name", "description", "is_system") VALUES
  ('super_administrator', 'Super Administrator', 'Complete platform authority.', true),
  ('administrator', 'Administrator', 'Day-to-day platform administration.', true),
  ('content_manager', 'Content Manager', 'Content workflow and publication management.', true),
  ('editor', 'Editor', 'Drafting and editing without publication authority.', true),
  ('business_development_manager', 'Business Development Manager', 'Lead and opportunity management.', true),
  ('analyst', 'Analyst', 'Read-only business intelligence access.', true),
  ('media_manager', 'Media Manager', 'Media library administration.', true),
  ('security_auditor', 'Security Auditor', 'Read-only audit and security-event access.', true),
  ('viewer', 'Viewer', 'Limited authenticated read access.', true)
ON CONFLICT ("key") DO NOTHING;
--> statement-breakpoint

INSERT INTO "permissions" ("key", "description") VALUES
  ('content.read', 'Read administrative content records.'),
  ('content.create', 'Create draft content.'),
  ('content.update', 'Update content.'),
  ('content.delete', 'Delete or archive content.'),
  ('content.publish', 'Publish and unpublish content.'),
  ('content.approve', 'Approve content for publication.'),
  ('portfolio.read', 'Read internal projects and case studies.'),
  ('portfolio.manage', 'Manage projects and case studies.'),
  ('leads.read', 'Read lead and opportunity records.'),
  ('leads.view_sensitive', 'Read sensitive lead fields.'),
  ('leads.manage', 'Manage leads and opportunities.'),
  ('analytics.read', 'Read administrative analytics.'),
  ('media.read', 'Read media records.'),
  ('media.manage', 'Create, replace, classify, and delete media.'),
  ('users.manage', 'Invite and manage users and roles.'),
  ('integrations.manage', 'Configure external integrations.'),
  ('audit.read', 'Read immutable audit events.'),
  ('security.events.read', 'Read security events.'),
  ('security.settings.manage', 'Change security settings.')
ON CONFLICT ("key") DO NOTHING;
--> statement-breakpoint

-- A super administrator owns the complete capability set. Other role mappings
-- are intentionally explicit so the permission matrix remains reviewable.
INSERT INTO "role_permissions" ("role_id", "permission_id")
SELECT roles.id, permissions.id
FROM "roles" roles CROSS JOIN "permissions" permissions
WHERE roles.key = 'super_administrator'
ON CONFLICT DO NOTHING;
--> statement-breakpoint
INSERT INTO "role_permissions" ("role_id", "permission_id")
SELECT roles.id, permissions.id
FROM "roles" roles JOIN "permissions" permissions ON permissions.key = ANY (ARRAY[
  'content.read', 'content.create', 'content.update', 'content.delete',
  'content.publish', 'content.approve', 'portfolio.read', 'portfolio.manage',
  'leads.read', 'leads.view_sensitive', 'leads.manage', 'analytics.read',
  'media.read', 'media.manage', 'integrations.manage', 'audit.read'
]) WHERE roles.key = 'administrator'
ON CONFLICT DO NOTHING;
--> statement-breakpoint
INSERT INTO "role_permissions" ("role_id", "permission_id")
SELECT roles.id, permissions.id
FROM "roles" roles JOIN "permissions" permissions ON permissions.key = ANY (ARRAY[
  'content.read', 'content.create', 'content.update', 'content.delete',
  'content.publish', 'content.approve', 'portfolio.read', 'portfolio.manage', 'media.read'
]) WHERE roles.key = 'content_manager'
ON CONFLICT DO NOTHING;
--> statement-breakpoint
INSERT INTO "role_permissions" ("role_id", "permission_id")
SELECT roles.id, permissions.id
FROM "roles" roles JOIN "permissions" permissions ON permissions.key = ANY (ARRAY[
  'content.read', 'content.create', 'content.update', 'portfolio.read', 'media.read'
]) WHERE roles.key = 'editor'
ON CONFLICT DO NOTHING;
--> statement-breakpoint
INSERT INTO "role_permissions" ("role_id", "permission_id")
SELECT roles.id, permissions.id
FROM "roles" roles JOIN "permissions" permissions ON permissions.key = ANY (ARRAY[
  'content.read', 'portfolio.read', 'leads.read', 'leads.view_sensitive',
  'leads.manage', 'analytics.read'
]) WHERE roles.key = 'business_development_manager'
ON CONFLICT DO NOTHING;
--> statement-breakpoint
INSERT INTO "role_permissions" ("role_id", "permission_id")
SELECT roles.id, permissions.id
FROM "roles" roles JOIN "permissions" permissions ON permissions.key = ANY (ARRAY[
  'content.read', 'portfolio.read', 'leads.read', 'analytics.read'
]) WHERE roles.key = 'analyst'
ON CONFLICT DO NOTHING;
--> statement-breakpoint
INSERT INTO "role_permissions" ("role_id", "permission_id")
SELECT roles.id, permissions.id
FROM "roles" roles JOIN "permissions" permissions ON permissions.key = ANY (ARRAY[
  'content.read', 'media.read', 'media.manage'
]) WHERE roles.key = 'media_manager'
ON CONFLICT DO NOTHING;
--> statement-breakpoint
INSERT INTO "role_permissions" ("role_id", "permission_id")
SELECT roles.id, permissions.id
FROM "roles" roles JOIN "permissions" permissions ON permissions.key = ANY (ARRAY[
  'audit.read', 'security.events.read'
]) WHERE roles.key = 'security_auditor'
ON CONFLICT DO NOTHING;
--> statement-breakpoint
INSERT INTO "role_permissions" ("role_id", "permission_id")
SELECT roles.id, permissions.id
FROM "roles" roles JOIN "permissions" permissions ON permissions.key = ANY (ARRAY[
  'content.read', 'portfolio.read'
]) WHERE roles.key = 'viewer'
ON CONFLICT DO NOTHING;
