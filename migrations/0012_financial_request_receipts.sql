-- Business mutation, audit and receipt commit together. No expiry/reuse window.
CREATE TABLE financial_request_receipts (
  id varchar PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_user_id varchar NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  request_key varchar(100) NOT NULL CHECK (request_key ~ '^[A-Za-z0-9_-]{20,100}$'),
  fingerprint varchar(64) NOT NULL CHECK (fingerprint ~ '^[a-f0-9]{64}$'),
  method varchar(10) NOT NULL,
  path text NOT NULL,
  required_permission varchar(160) NOT NULL,
  response_status integer NOT NULL CHECK (response_status BETWEEN 200 AND 499),
  response_body jsonb NOT NULL,
  original_request_id varchar(100) NOT NULL,
  created_at timestamp NOT NULL DEFAULT now(),
  CONSTRAINT financial_request_receipts_actor_key_unique UNIQUE(actor_user_id, request_key)
);
CREATE FUNCTION reject_financial_receipt_mutation() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN RAISE EXCEPTION 'Financial request receipts are immutable'; END;
$$;
CREATE TRIGGER financial_request_receipts_immutable
  BEFORE UPDATE OR DELETE ON financial_request_receipts
  FOR EACH ROW EXECUTE FUNCTION reject_financial_receipt_mutation();
