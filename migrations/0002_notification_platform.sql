CREATE TABLE IF NOT EXISTS notification_campaigns (
  id varchar PRIMARY KEY DEFAULT gen_random_uuid(), name varchar(180) NOT NULL,
  subject text, html_content text, text_content text,
  channels text[] NOT NULL DEFAULT ARRAY['email']::text[], audience jsonb NOT NULL DEFAULT '{}'::jsonb,
  status varchar(24) NOT NULL DEFAULT 'draft', scheduled_at timestamp, started_at timestamp,
  completed_at timestamp, created_by varchar REFERENCES users(id) ON DELETE SET NULL,
  created_at timestamp NOT NULL DEFAULT now(), updated_at timestamp NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS notification_campaigns_schedule_idx ON notification_campaigns(status, scheduled_at);

CREATE TABLE IF NOT EXISTS notification_inbox (
  id varchar PRIMARY KEY DEFAULT gen_random_uuid(), user_id varchar NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  category varchar(80) NOT NULL DEFAULT 'system', title varchar(240) NOT NULL, body text NOT NULL,
  action_url text, metadata jsonb, read_at timestamp, archived_at timestamp, created_at timestamp NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS notification_inbox_unread_idx ON notification_inbox(user_id, read_at, created_at);

CREATE TABLE IF NOT EXISTS notification_action_tokens (
  id varchar PRIMARY KEY DEFAULT gen_random_uuid(), token_hash varchar(64) NOT NULL UNIQUE,
  purpose varchar(48) NOT NULL, email varchar(320) NOT NULL,
  subscriber_id varchar REFERENCES newsletter_subscribers(id) ON DELETE CASCADE,
  expires_at timestamp NOT NULL, consumed_at timestamp, created_at timestamp NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS notification_action_tokens_lookup_idx ON notification_action_tokens(token_hash, purpose);

CREATE TABLE IF NOT EXISTS push_subscriptions (
  id varchar PRIMARY KEY DEFAULT gen_random_uuid(), user_id varchar NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  endpoint text NOT NULL UNIQUE, p256dh text NOT NULL, auth text NOT NULL, user_agent text,
  expires_at timestamp, revoked_at timestamp, created_at timestamp NOT NULL DEFAULT now(), updated_at timestamp NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS push_subscriptions_user_idx ON push_subscriptions(user_id, revoked_at);

CREATE TABLE IF NOT EXISTS channel_outbox (
  id varchar PRIMARY KEY DEFAULT gen_random_uuid(), channel varchar(24) NOT NULL, recipient text NOT NULL,
  payload jsonb NOT NULL, status varchar(24) NOT NULL DEFAULT 'pending', provider varchar(80),
  provider_message_id varchar(255), idempotency_key varchar(255) NOT NULL UNIQUE,
  attempt_count integer NOT NULL DEFAULT 0, max_attempts integer NOT NULL DEFAULT 5,
  available_at timestamp NOT NULL DEFAULT now(), locked_at timestamp, locked_by varchar(120),
  last_error text, sent_at timestamp, created_at timestamp NOT NULL DEFAULT now(), updated_at timestamp NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS channel_outbox_dispatch_idx ON channel_outbox(channel, status, available_at);

INSERT INTO permissions (key, description) VALUES
  ('campaigns.manage', 'Create, schedule, and cancel notification campaigns'),
  ('notifications.manage', 'Manage notification delivery channels and subscriptions'),
  ('notifications.read', 'Read the authenticated user notification inbox')
ON CONFLICT (key) DO UPDATE SET description = EXCLUDED.description;

INSERT INTO role_permissions (role_id, permission_id)
SELECT roles.id, permissions.id FROM roles CROSS JOIN permissions
WHERE roles.key = 'super_administrator' AND permissions.key IN ('campaigns.manage', 'notifications.manage', 'notifications.read')
ON CONFLICT DO NOTHING;
