ALTER TABLE daily_reports
  ALTER COLUMN content TYPE jsonb
  USING CASE
    WHEN content IS NULL OR content = '' THEN '{}'::jsonb
    ELSE jsonb_build_object('raw', content)
  END;
