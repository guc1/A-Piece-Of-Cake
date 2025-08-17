ALTER TABLE users
  ADD COLUMN handle text NOT NULL UNIQUE,
  ADD COLUMN display_name text,
  ADD COLUMN avatar_url text,
  ADD COLUMN account_visibility varchar(10) NOT NULL DEFAULT 'open',
  ADD COLUMN updated_at timestamp DEFAULT now();

CREATE TABLE IF NOT EXISTS "follows" (
  "id" serial PRIMARY KEY,
  "follower_id" integer NOT NULL REFERENCES users(id),
  "following_id" integer NOT NULL REFERENCES users(id),
  "status" varchar(10) NOT NULL,
  "created_at" timestamp DEFAULT now(),
  "updated_at" timestamp DEFAULT now(),
  UNIQUE("follower_id", "following_id")
);

CREATE TABLE IF NOT EXISTS "notifications" (
  "id" serial PRIMARY KEY,
  "to_user_id" integer NOT NULL REFERENCES users(id),
  "from_user_id" integer NOT NULL REFERENCES users(id),
  "type" varchar(20) NOT NULL,
  "created_at" timestamp DEFAULT now(),
  "read_at" timestamp
);
