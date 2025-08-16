CREATE TABLE IF NOT EXISTS users (
  id serial PRIMARY KEY,
  name text,
  created_at timestamp DEFAULT now()
);

CREATE TABLE IF NOT EXISTS flavors (
  id serial PRIMARY KEY,
  user_id integer REFERENCES users(id),
  name varchar(256),
  description text,
  created_at timestamp DEFAULT now()
);
