CREATE TABLE IF NOT EXISTS review_extra_time (
  id serial PRIMARY KEY,
  user_id integer NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  reason text NOT NULL,
  frozen_date date NOT NULL,
  activated_at timestamp DEFAULT now(),
  expires_at timestamp NOT NULL
);

CREATE INDEX IF NOT EXISTS review_extra_time_user_expires_idx
  ON review_extra_time (user_id, expires_at DESC);

CREATE INDEX IF NOT EXISTS review_extra_time_user_frozen_idx
  ON review_extra_time (user_id, frozen_date DESC);
