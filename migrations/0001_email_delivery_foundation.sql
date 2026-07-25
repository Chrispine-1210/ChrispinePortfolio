CREATE TABLE IF NOT EXISTS "email_outbox" (
  "id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "template_id" varchar REFERENCES "email_templates"("id") ON DELETE set null,
  "message_type" varchar(24) DEFAULT 'transactional' NOT NULL,
  "to_email" varchar(320) NOT NULL,
  "from_email" varchar(320) NOT NULL,
  "from_name" varchar(160),
  "reply_to" varchar(320),
  "subject" text NOT NULL,
  "html_body" text NOT NULL,
  "text_body" text,
  "status" varchar(24) DEFAULT 'pending' NOT NULL,
  "provider" varchar(80),
  "provider_message_id" varchar(255),
  "idempotency_key" varchar(255) NOT NULL UNIQUE,
  "attempt_count" integer DEFAULT 0 NOT NULL,
  "max_attempts" integer DEFAULT 5 NOT NULL,
  "available_at" timestamp DEFAULT now() NOT NULL,
  "locked_at" timestamp,
  "locked_by" varchar(120),
  "last_error" text,
  "metadata" jsonb,
  "sent_at" timestamp,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS "email_outbox_dispatch_idx" ON "email_outbox" ("status", "available_at");
CREATE INDEX IF NOT EXISTS "email_outbox_recipient_idx" ON "email_outbox" ("to_email", "created_at");
CREATE INDEX IF NOT EXISTS "email_outbox_provider_message_idx" ON "email_outbox" ("provider", "provider_message_id");

CREATE TABLE IF NOT EXISTS "email_delivery_events" (
  "id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "outbox_id" varchar NOT NULL REFERENCES "email_outbox"("id") ON DELETE cascade,
  "event_type" varchar(40) NOT NULL,
  "provider" varchar(80),
  "provider_event_id" varchar(255) UNIQUE,
  "occurred_at" timestamp DEFAULT now() NOT NULL,
  "payload" jsonb,
  "created_at" timestamp DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS "email_delivery_events_outbox_time_idx" ON "email_delivery_events" ("outbox_id", "occurred_at");
CREATE INDEX IF NOT EXISTS "email_delivery_events_type_time_idx" ON "email_delivery_events" ("event_type", "occurred_at");

CREATE TABLE IF NOT EXISTS "email_suppressions" (
  "id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "email" varchar(320) NOT NULL UNIQUE,
  "reason" varchar(80) NOT NULL,
  "source" varchar(80) NOT NULL,
  "notes" text,
  "expires_at" timestamp,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS "email_suppressions_active_idx" ON "email_suppressions" ("email", "expires_at");

INSERT INTO "permissions" ("key", "description") VALUES
  ('email.templates.manage', 'Create and manage email templates'),
  ('email.send', 'Enqueue and process outbound email'),
  ('email.delivery.read', 'View email outbox and delivery history'),
  ('email.suppressions.manage', 'Manage email suppressions')
ON CONFLICT ("key") DO UPDATE SET "description" = EXCLUDED."description";

INSERT INTO "role_permissions" ("role_id", "permission_id")
SELECT r."id", p."id"
FROM "roles" r
CROSS JOIN "permissions" p
WHERE r."key" = 'super_administrator'
  AND p."key" IN (
    'email.templates.manage',
    'email.send',
    'email.delivery.read',
    'email.suppressions.manage'
  )
ON CONFLICT DO NOTHING;

INSERT INTO "role_permissions" ("role_id", "permission_id")
SELECT r."id", p."id"
FROM "roles" r
CROSS JOIN "permissions" p
WHERE (r."key", p."key") IN (
  ('content_administrator', 'email.templates.manage'),
  ('content_administrator', 'email.send'),
  ('analyst', 'email.delivery.read'),
  ('auditor', 'email.delivery.read')
)
ON CONFLICT DO NOTHING;
