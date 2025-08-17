CREATE TABLE IF NOT EXISTS users (
  id serial PRIMARY KEY,
  name text,
  created_at timestamp DEFAULT now()
);

CREATE TYPE visibility AS ENUM ('private','friends','followers','public');

CREATE TABLE IF NOT EXISTS flavors (
  id serial PRIMARY KEY,
  user_id text NOT NULL,
  slug varchar(64) NOT NULL,
  name varchar(40) NOT NULL,
  description varchar(280),
  color varchar(7) NOT NULL,
  icon varchar(64) NOT NULL,
  importance integer NOT NULL,
  target_mix integer NOT NULL,
  visibility visibility NOT NULL DEFAULT 'public',
  order_index integer NOT NULL DEFAULT 0,
  created_at timestamp DEFAULT now(),
  updated_at timestamp DEFAULT now()
);
