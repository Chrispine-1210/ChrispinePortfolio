CREATE TABLE IF NOT EXISTS leads (
  id varchar PRIMARY KEY DEFAULT gen_random_uuid(),
  contact_request_id varchar UNIQUE REFERENCES contact_requests(id) ON DELETE SET NULL,
  name varchar(180) NOT NULL, email varchar(320) NOT NULL, phone varchar(80), organization varchar(220),
  country varchar(120), industry varchar(160), lead_type varchar(80) NOT NULL DEFAULT 'contact_enquiry',
  service_interest varchar(180), budget_range varchar(120), expected_timeline varchar(120),
  source varchar(120) NOT NULL DEFAULT 'contact_form', campaign varchar(180), landing_page text, message text,
  assigned_owner_id varchar REFERENCES users(id) ON DELETE SET NULL,
  priority varchar(24) NOT NULL DEFAULT 'normal', qualification_score integer NOT NULL DEFAULT 0,
  stage varchar(32) NOT NULL DEFAULT 'new', estimated_value numeric(14,2), currency varchar(3) NOT NULL DEFAULT 'USD',
  probability integer NOT NULL DEFAULT 10, next_action text, follow_up_at timestamp, lost_reason text,
  consent_status varchar(32) NOT NULL DEFAULT 'unknown', created_at timestamp NOT NULL DEFAULT now(),
  updated_at timestamp NOT NULL DEFAULT now(), archived_at timestamp,
  CONSTRAINT leads_score_range CHECK (qualification_score BETWEEN 0 AND 100),
  CONSTRAINT leads_probability_range CHECK (probability BETWEEN 0 AND 100),
  CONSTRAINT leads_stage_valid CHECK (stage IN ('new','reviewing','qualified','discovery','proposal','negotiation','won','lost')),
  CONSTRAINT leads_priority_valid CHECK (priority IN ('low','normal','high','urgent'))
);
CREATE INDEX IF NOT EXISTS leads_stage_idx ON leads(stage, updated_at);
CREATE INDEX IF NOT EXISTS leads_follow_up_idx ON leads(follow_up_at, stage);
CREATE INDEX IF NOT EXISTS leads_owner_idx ON leads(assigned_owner_id, stage);
CREATE INDEX IF NOT EXISTS leads_email_idx ON leads(email);

CREATE TABLE IF NOT EXISTS lead_activities (
  id varchar PRIMARY KEY DEFAULT gen_random_uuid(), lead_id varchar NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
  actor_user_id varchar REFERENCES users(id) ON DELETE SET NULL, type varchar(48) NOT NULL, body text,
  metadata jsonb, created_at timestamp NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS lead_activities_lead_time_idx ON lead_activities(lead_id, created_at);

INSERT INTO leads (contact_request_id, name, email, lead_type, service_interest, source, landing_page, message, stage, probability)
SELECT id, name, lower(email),
  CASE WHEN project_type IS NULL THEN 'contact_enquiry' ELSE 'project_request' END,
  project_type, 'contact_form', '/contact', message, 'new', 10
FROM contact_requests
ON CONFLICT (contact_request_id) DO NOTHING;

INSERT INTO lead_activities (lead_id, type, body, metadata)
SELECT leads.id, 'created', 'Lead backfilled from an existing portfolio contact request.',
  jsonb_build_object('contactRequestId', leads.contact_request_id)
FROM leads
WHERE leads.contact_request_id IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM lead_activities WHERE lead_activities.lead_id = leads.id AND lead_activities.type = 'created');

INSERT INTO permissions (key, description) VALUES
  ('leads.export', 'Export lead and opportunity records'),
  ('pipeline.financial.read', 'View opportunity values and weighted pipeline forecasts')
ON CONFLICT (key) DO UPDATE SET description = EXCLUDED.description;

INSERT INTO role_permissions (role_id, permission_id)
SELECT roles.id, permissions.id FROM roles CROSS JOIN permissions
WHERE roles.key = 'super_administrator' AND permissions.key IN ('leads.export', 'pipeline.financial.read')
ON CONFLICT DO NOTHING;

INSERT INTO role_permissions (role_id, permission_id)
SELECT roles.id, permissions.id FROM roles CROSS JOIN permissions
WHERE roles.key = 'business_development_manager' AND permissions.key IN ('leads.export', 'pipeline.financial.read')
ON CONFLICT DO NOTHING;
