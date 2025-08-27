ALTER TABLE daily_reports
  ALTER COLUMN content TYPE json USING content::json;
