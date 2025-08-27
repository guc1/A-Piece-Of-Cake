-- Account visibility enum
DO $$ BEGIN
  CREATE TYPE "account_visibility" AS ENUM ('open','closed','private');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "handle" varchar(50) NOT NULL;
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "display_name" text;
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "avatar_url" text;
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "account_visibility" "account_visibility" NOT NULL DEFAULT 'open';
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "updated_at" timestamp DEFAULT now();
DO $$ BEGIN
  ALTER TABLE "users" ADD CONSTRAINT "users_handle_unique" UNIQUE("handle");
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Follow status enum
DO $$ BEGIN
  CREATE TYPE "follow_status" AS ENUM ('pending','accepted');
EXCEPTION WHEN duplicate_object THEN NULL;
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

-- Notification type enum
DO $$ BEGIN
  CREATE TYPE "notification_type" AS ENUM ('follow_request','follow_accepted');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS "notifications" (
  "id" serial PRIMARY KEY,
  "to_user_id" integer NOT NULL REFERENCES "users"("id"),
  "from_user_id" integer NOT NULL REFERENCES "users"("id"),
  "type" "notification_type" NOT NULL,
  "created_at" timestamp DEFAULT now(),
  "read_at" timestamp
);
