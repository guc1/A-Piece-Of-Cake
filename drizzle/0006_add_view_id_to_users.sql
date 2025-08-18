ALTER TABLE users ADD COLUMN view_id text NOT NULL DEFAULT gen_random_uuid();
ALTER TABLE users ADD CONSTRAINT users_view_id_unique UNIQUE (view_id);
