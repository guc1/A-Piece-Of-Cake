CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Add column if missing and ensure uuid type
ALTER TABLE users ADD COLUMN IF NOT EXISTS view_id uuid;
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'users'
      AND column_name = 'view_id'
      AND data_type <> 'uuid'
  ) THEN
    ALTER TABLE users ALTER COLUMN view_id TYPE uuid USING view_id::uuid;
  END IF;
END $$;

-- Backfill nulls
UPDATE users
SET view_id = gen_random_uuid()
WHERE view_id IS NULL;

-- Enforce NOT NULL if nullable
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'users'
      AND column_name = 'view_id'
      AND is_nullable = 'YES'
  ) THEN
    ALTER TABLE users ALTER COLUMN view_id SET NOT NULL;
  END IF;
END $$;

-- Add UNIQUE constraint if missing
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'users_view_id_unique'
      AND conrelid = 'users'::regclass
  ) THEN
    ALTER TABLE users ADD CONSTRAINT users_view_id_unique UNIQUE (view_id);
  END IF;
END $$;
