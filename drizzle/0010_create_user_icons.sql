CREATE TABLE "user_icons" (
  "id" serial PRIMARY KEY,
  "user_id" integer REFERENCES "users"("id") ON DELETE CASCADE,
  "icon" text NOT NULL,
  "created_at" timestamp DEFAULT now()
);
CREATE UNIQUE INDEX "user_icons_user_id_icon_unique" ON "user_icons" ("user_id", "icon");
