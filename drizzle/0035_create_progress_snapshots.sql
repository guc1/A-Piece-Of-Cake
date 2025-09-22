CREATE TABLE IF NOT EXISTS progress_snapshots (
  id serial PRIMARY KEY,
  user_id integer REFERENCES users(id) NOT NULL,
  snapshot_date date NOT NULL,
  data jsonb NOT NULL,
  created_at timestamp DEFAULT now(),
  CONSTRAINT progress_snapshots_user_date_unique UNIQUE(user_id, snapshot_date)
);
