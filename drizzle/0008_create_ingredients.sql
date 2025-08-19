CREATE TABLE IF NOT EXISTS "ingredients" (
  "id" serial PRIMARY KEY,
  "user_id" integer REFERENCES users(id) NOT NULL,
  "title" text NOT NULL,
  "short_description" text,
  "description" text,
  "why_used" text,
  "when_used" text,
  "tips" text,
  "usefulness" integer,
  "image_url" text,
  "tags" text[],
  "visibility" text,
  "created_at" timestamptz DEFAULT now(),
  "updated_at" timestamptz DEFAULT now(),
  UNIQUE (user_id, title)
);

CREATE TABLE IF NOT EXISTS "ingredient_revisions" (
  "id" serial PRIMARY KEY,
  "ingredient_id" integer REFERENCES ingredients(id) NOT NULL,
  "snapshot_at" timestamptz DEFAULT now(),
  "payload" jsonb NOT NULL
);
