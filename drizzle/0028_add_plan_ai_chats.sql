ALTER TABLE plans ADD COLUMN IF NOT EXISTS planning_chat jsonb DEFAULT '{}'::jsonb;
ALTER TABLE plans ADD COLUMN IF NOT EXISTS live_chat jsonb DEFAULT '{}'::jsonb;
