CREATE TABLE IF NOT EXISTS tracking_overrides (
  id serial PRIMARY KEY,
  user_id integer REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  target_type varchar(20) NOT NULL,
  target_id text NOT NULL,
  override_date date NOT NULL,
  state varchar(10) NOT NULL,
  created_at timestamp DEFAULT now(),
  updated_at timestamp DEFAULT now(),
  CONSTRAINT tracking_overrides_user_target_date_unique UNIQUE (user_id, target_type, target_id, override_date)
);

CREATE INDEX IF NOT EXISTS tracking_overrides_user_date_idx
  ON tracking_overrides (user_id, override_date);
