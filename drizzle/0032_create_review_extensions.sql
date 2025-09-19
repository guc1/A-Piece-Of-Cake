CREATE TABLE IF NOT EXISTS "review_extensions" (
    "id" serial PRIMARY KEY,
    "user_id" integer NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
    "target_date" date NOT NULL,
    "reason" text NOT NULL,
    "expires_at" timestamp NOT NULL,
    "created_at" timestamp DEFAULT now() NOT NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS "review_extensions_user_target_unique"
    ON "review_extensions" ("user_id", "target_date");
