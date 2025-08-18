CREATE TABLE plans (
  id serial PRIMARY KEY,
  user_id integer NOT NULL REFERENCES users(id),
  date date NOT NULL,
  created_at timestamp DEFAULT now(),
  updated_at timestamp DEFAULT now()
);
CREATE UNIQUE INDEX plans_user_date_idx ON plans (user_id, date);

CREATE TABLE plan_blocks (
  id serial PRIMARY KEY,
  plan_id integer NOT NULL REFERENCES plans(id) ON DELETE CASCADE,
  start timestamp NOT NULL,
  "end" timestamp NOT NULL,
  title varchar(60),
  description text,
  color varchar(10),
  created_at timestamp DEFAULT now(),
  updated_at timestamp DEFAULT now()
);
