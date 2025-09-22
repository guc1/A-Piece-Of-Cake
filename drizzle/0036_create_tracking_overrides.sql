CREATE TYPE tracking_override_target AS ENUM ('flavor', 'subflavor', 'ingredient');
CREATE TYPE tracking_override_state AS ENUM ('done', 'missed');

CREATE TABLE IF NOT EXISTS tracking_overrides (
  id serial PRIMARY KEY,
  user_id integer REFERENCES users(id) NOT NULL,
  target_type tracking_override_target NOT NULL,
  target_id text NOT NULL,
  date date NOT NULL,
  state tracking_override_state NOT NULL,
  created_at timestamp DEFAULT now(),
  updated_at timestamp DEFAULT now(),
  CONSTRAINT tracking_overrides_user_target_date_unique UNIQUE (user_id, target_type, target_id, date)
);

CREATE INDEX tracking_overrides_user_date_idx
  ON tracking_overrides (user_id, date);
