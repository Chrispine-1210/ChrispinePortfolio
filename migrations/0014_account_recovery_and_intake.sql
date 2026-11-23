-- Additive. Recovery is disabled until separately configured and accepted.
CREATE TABLE account_recovery_tokens (
  id varchar PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id varchar NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token_hash varchar(64) NOT NULL UNIQUE,
  user_security_version integer NOT NULL,
  expires_at timestamp NOT NULL,
  consumed_at timestamp,
  created_at timestamp NOT NULL DEFAULT now()
);
CREATE INDEX account_recovery_user_time_idx ON account_recovery_tokens(user_id,created_at);
CREATE TABLE public_request_limits (
  key_hash varchar(64) NOT NULL,
  bucket_start timestamp NOT NULL,
  hits integer NOT NULL DEFAULT 1 CHECK(hits>0),
  expires_at timestamp NOT NULL,
  PRIMARY KEY(key_hash,bucket_start)
);
CREATE INDEX public_request_limits_expiry_idx ON public_request_limits(expires_at);
