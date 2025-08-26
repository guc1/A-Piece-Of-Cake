CREATE TABLE daily_reports (
  id serial PRIMARY KEY,
  user_id integer NOT NULL REFERENCES users(id),
  date date NOT NULL,
  content text NOT NULL,
  score integer NOT NULL,
  created_at timestamp DEFAULT now(),
  CONSTRAINT daily_reports_user_date_unique UNIQUE (user_id, date)
);
