CREATE TABLE monthly_reports (
  id serial PRIMARY KEY,
  user_id integer NOT NULL REFERENCES users(id),
  start_date date NOT NULL,
  end_date date NOT NULL,
  summary text NOT NULL DEFAULT '',
  good text NOT NULL DEFAULT '[]',
  bad text NOT NULL DEFAULT '[]',
  observations text NOT NULL DEFAULT '[]',
  coach_tone text NOT NULL DEFAULT 'tone_medium',
  score integer NOT NULL,
  version integer NOT NULL DEFAULT 1,
  created_at timestamp DEFAULT now(),
  CONSTRAINT monthly_reports_user_month_version_unique UNIQUE (user_id, start_date, version)
);
