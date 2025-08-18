ALTER TABLE users ADD COLUMN view_id text;
UPDATE users SET view_id = gen_random_uuid();
ALTER TABLE users ALTER COLUMN view_id SET NOT NULL;
ALTER TABLE users ADD CONSTRAINT users_view_id_unique UNIQUE (view_id);
