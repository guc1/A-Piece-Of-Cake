CREATE TABLE IF NOT EXISTS plan_revisions (
  id serial PRIMARY KEY,
  user_id integer REFERENCES users(id) NOT NULL,
  plan_date date NOT NULL,
  payload jsonb NOT NULL,
  snapshot_at timestamp DEFAULT now()
);
CREATE INDEX IF NOT EXISTS plan_revisions_user_date_snapshot_idx ON plan_revisions(user_id, plan_date, snapshot_at);
