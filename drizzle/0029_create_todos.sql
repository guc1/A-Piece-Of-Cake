CREATE TABLE IF NOT EXISTS "todos" (
  "id" serial PRIMARY KEY,
  "user_id" integer REFERENCES users(id) NOT NULL,
  "title" text NOT NULL,
  "description" text,
  "priority" integer,
  "icon" text,
  "visibility" text,
  "created_at" timestamptz DEFAULT now(),
  "updated_at" timestamptz DEFAULT now(),
  UNIQUE (user_id, title)
);

CREATE TABLE IF NOT EXISTS "todo_revisions" (
  "id" serial PRIMARY KEY,
  "todo_id" integer REFERENCES todos(id) NOT NULL,
  "snapshot_at" timestamptz DEFAULT now(),
  "payload" jsonb NOT NULL
);
