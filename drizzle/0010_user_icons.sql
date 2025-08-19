CREATE TABLE "user_icons" (
  "id" serial PRIMARY KEY,
  "user_id" integer NOT NULL REFERENCES "users"("id"),
  "icon" text NOT NULL,
  "created_at" timestamp DEFAULT now(),
  CONSTRAINT "user_icons_user_icon_unique" UNIQUE ("user_id", "icon")
);
