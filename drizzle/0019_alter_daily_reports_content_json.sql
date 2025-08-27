ALTER TABLE daily_reports
  ALTER COLUMN content TYPE json
  USING CASE
    WHEN content IS NULL OR content = '' THEN '{}'::json
    ELSE json_build_object('raw', content)
  END;
