CREATE TABLE IF NOT EXISTS plans (
  id serial PRIMARY KEY,
  user_id integer REFERENCES users(id) NOT NULL,
  date date NOT NULL,
  created_at timestamp DEFAULT now(),
  updated_at timestamp DEFAULT now(),
  CONSTRAINT plans_user_date_unique UNIQUE(user_id, date)
);

CREATE TABLE IF NOT EXISTS plan_blocks (
  id text PRIMARY KEY,
  plan_id integer REFERENCES plans(id) NOT NULL,
  start timestamp NOT NULL,
  "end" timestamp NOT NULL,
  title varchar(60),
  description text,
  color varchar(10),
  created_at timestamp DEFAULT now(),
  updated_at timestamp DEFAULT now()
);
