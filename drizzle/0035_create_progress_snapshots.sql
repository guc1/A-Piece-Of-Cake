CREATE TABLE IF NOT EXISTS "progress_snapshots" (
  "id" serial PRIMARY KEY NOT NULL,
  "user_id" integer NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "snapshot_date" date NOT NULL,
  "data" jsonb NOT NULL,
  "created_at" timestamp DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS "progress_snapshots_user_date_unique"
  ON "progress_snapshots" ("user_id", "snapshot_date");
