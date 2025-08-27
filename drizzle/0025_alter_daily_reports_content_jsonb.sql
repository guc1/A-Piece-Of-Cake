ALTER TABLE daily_reports
  ALTER COLUMN content TYPE jsonb
  USING CASE
    WHEN content IS NULL OR trim(content) = '' THEN '{}'::jsonb
    WHEN left(trim(content), 1) IN ('{', '[') THEN content::jsonb
    ELSE jsonb_build_object('raw', content)
  END;
