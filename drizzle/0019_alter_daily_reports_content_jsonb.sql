ALTER TABLE daily_reports
  ALTER COLUMN content TYPE jsonb
  USING CASE
    -- keep existing JSON, default empty JSON, or wrap legacy text
    WHEN content IS NULL OR trim(content) = '' THEN '{}'::jsonb
    WHEN content ~ '^\\s*[\\[{]' THEN content::jsonb
    ELSE to_jsonb(content)
  END;
