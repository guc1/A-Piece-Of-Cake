CREATE TABLE IF NOT EXISTS "subflavors" (
  "id" text PRIMARY KEY NOT NULL,
  "user_id" integer REFERENCES users(id),
  "flavor_id" text REFERENCES flavors(id),
  "slug" text NOT NULL,
  "name" varchar(40),
  "description" text,
  "color" varchar(10),
  "icon" varchar(10),
  "importance" integer,
  "target_mix" integer,
  "visibility" varchar(20),
  "order_index" integer,
  "created_at" timestamp DEFAULT NOW(),
  "updated_at" timestamp DEFAULT NOW()
);
