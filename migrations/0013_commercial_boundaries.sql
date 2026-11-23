-- Additive, reviewed in isolation. No provider sends or financial seeds.
CREATE TABLE billing_subscriptions (
  id varchar PRIMARY KEY,
  user_id varchar NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  customer_id varchar NOT NULL,
  price_id varchar NOT NULL,
  status varchar(40) NOT NULL,
  entitled_until timestamp,
  observed_at timestamp NOT NULL DEFAULT now(),
  livemode boolean NOT NULL DEFAULT false
);
CREATE INDEX billing_subscriptions_user_idx ON billing_subscriptions(user_id);
CREATE TABLE billing_event_receipts (
  id varchar PRIMARY KEY,
  event_type varchar NOT NULL,
  fingerprint varchar(64) NOT NULL,
  subscription_id varchar,
  received_at timestamp NOT NULL DEFAULT now()
);
CREATE FUNCTION reject_billing_receipt_mutation() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN RAISE EXCEPTION 'Billing event receipts are immutable'; END;
$$;
CREATE TRIGGER billing_event_receipts_immutable BEFORE UPDATE OR DELETE ON billing_event_receipts
FOR EACH ROW EXECUTE FUNCTION reject_billing_receipt_mutation();
CREATE TABLE billing_checkout_requests (
  id varchar PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id varchar NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  request_key varchar(100) NOT NULL,
  price_id varchar NOT NULL,
  status varchar(24) NOT NULL DEFAULT 'creating' CHECK (status IN ('creating','created','uncertain','completed')),
  session_id varchar UNIQUE,
  checkout_url text,
  created_at timestamp NOT NULL DEFAULT now(),
  updated_at timestamp NOT NULL DEFAULT now(),
  UNIQUE(user_id,request_key)
);
CREATE UNIQUE INDEX billing_checkout_open_user_idx ON billing_checkout_requests(user_id)
WHERE status IN ('creating','created','uncertain');
ALTER TABLE email_outbox ADD CONSTRAINT email_outbox_delivery_state_valid CHECK (
  status IN ('pending','retry','processing','uncertain','sent','delivered','suppressed','failed','bounced','complained')
);
INSERT INTO permissions(key,description) VALUES ('email.delivery.reconcile','Reconcile uncertain provider acceptance with evidence') ON CONFLICT DO NOTHING;
INSERT INTO role_permissions(role_id,permission_id)
SELECT r.id,p.id FROM roles r CROSS JOIN permissions p
WHERE r.key='super_administrator' AND p.key='email.delivery.reconcile' ON CONFLICT DO NOTHING;
