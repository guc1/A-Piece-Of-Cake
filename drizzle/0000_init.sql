CREATE TABLE IF NOT EXISTS users (
  id serial PRIMARY KEY,
  email text NOT NULL UNIQUE,
  name text,
  password_hash text NOT NULL,
  created_at timestamp DEFAULT now()
);

CREATE TABLE IF NOT EXISTS flavors (
  id text PRIMARY KEY,
  user_id integer REFERENCES users(id),
  slug text NOT NULL,
  name varchar(40),
  description text,
  color varchar(10),
  icon varchar(10),
  importance integer,
  target_mix integer,
  visibility varchar(20),
  order_index integer,
  created_at timestamp DEFAULT now(),
  updated_at timestamp DEFAULT now()
);
