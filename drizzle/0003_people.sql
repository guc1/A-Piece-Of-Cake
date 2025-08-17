-- Account visibility enum
CREATE TYPE "account_visibility" AS ENUM ('open','closed','private');

ALTER TABLE "users" ADD COLUMN "handle" varchar(50) NOT NULL;
ALTER TABLE "users" ADD COLUMN "display_name" text;
ALTER TABLE "users" ADD COLUMN "avatar_url" text;
ALTER TABLE "users" ADD COLUMN "account_visibility" "account_visibility" NOT NULL DEFAULT 'open';
ALTER TABLE "users" ADD COLUMN "updated_at" timestamp DEFAULT now();
ALTER TABLE "users" ADD CONSTRAINT "users_handle_unique" UNIQUE("handle");

-- Follow status enum
CREATE TYPE "follow_status" AS ENUM ('pending','accepted');

CREATE TABLE "follows" (
  "id" serial PRIMARY KEY,
  "follower_id" integer NOT NULL REFERENCES "users"("id"),
  "following_id" integer NOT NULL REFERENCES "users"("id"),
  "status" "follow_status" NOT NULL DEFAULT 'pending',
  "created_at" timestamp DEFAULT now(),
  "updated_at" timestamp DEFAULT now(),
  CONSTRAINT "follows_follower_following_unique" UNIQUE("follower_id","following_id")
);

-- Notification type enum
CREATE TYPE "notification_type" AS ENUM ('follow_request','follow_accepted');

CREATE TABLE "notifications" (
  "id" serial PRIMARY KEY,
  "to_user_id" integer NOT NULL REFERENCES "users"("id"),
  "from_user_id" integer NOT NULL REFERENCES "users"("id"),
  "type" "notification_type" NOT NULL,
  "created_at" timestamp DEFAULT now(),
  "read_at" timestamp
);
