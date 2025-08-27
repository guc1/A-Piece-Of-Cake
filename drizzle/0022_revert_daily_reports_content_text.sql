ALTER TABLE daily_reports
  ALTER COLUMN content TYPE text USING content::text;
