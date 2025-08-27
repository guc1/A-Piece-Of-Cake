ALTER TABLE daily_reports
  ADD COLUMN version integer NOT NULL DEFAULT 1;

DROP INDEX IF EXISTS daily_reports_user_date_unique;
CREATE UNIQUE INDEX daily_reports_user_date_version_unique
  ON daily_reports (user_id, date, version);
