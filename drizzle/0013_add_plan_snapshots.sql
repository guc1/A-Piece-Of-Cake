CREATE TABLE "plan_snapshots" (
    "id" serial PRIMARY KEY,
    "user_id" integer NOT NULL REFERENCES "users"("id"),
    "snapshot_date" date NOT NULL,
    "plan_date" date NOT NULL,
    "blocks" jsonb NOT NULL,
    "created_at" timestamptz DEFAULT now()
);

CREATE UNIQUE INDEX "plan_snapshots_user_snap_plan_unique"
ON "plan_snapshots" ("user_id", "snapshot_date", "plan_date");

