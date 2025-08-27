ALTER TABLE users
  ALTER COLUMN view_id TYPE text USING view_id::text;
