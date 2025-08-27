DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'account_visibility') THEN
    CREATE TYPE "account_visibility" AS ENUM ('open','closed','private');
  END IF;
END $$;

ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "handle" varchar(50) NOT NULL;
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "display_name" text;
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "avatar_url" text;
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "account_visibility" "account_visibility" NOT NULL DEFAULT 'open';
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "updated_at" timestamp DEFAULT now();
DO $$
BEGIN
  ALTER TABLE "users" ADD CONSTRAINT "users_handle_unique" UNIQUE("handle");
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'follow_status') THEN
    CREATE TYPE "follow_status" AS ENUM ('pending','accepted');
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS "follows" (
  "id" serial PRIMARY KEY,
  "follower_id" integer NOT NULL REFERENCES "users"("id"),
  "following_id" integer NOT NULL REFERENCES "users"("id"),
  "status" "follow_status" NOT NULL DEFAULT 'pending',
  "created_at" timestamp DEFAULT now(),
  "updated_at" timestamp DEFAULT now(),
  CONSTRAINT "follows_follower_following_unique" UNIQUE("follower_id","following_id")
);

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'notification_type') THEN
    CREATE TYPE "notification_type" AS ENUM ('follow_request','follow_accepted');
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS "notifications" (
  "id" serial PRIMARY KEY,
  "to_user_id" integer NOT NULL REFERENCES "users"("id"),
  "from_user_id" integer NOT NULL REFERENCES "users"("id"),
  "type" "notification_type" NOT NULL,
  "created_at" timestamp DEFAULT now(),
  "read_at" timestamp
);
