ALTER TABLE daily_reports
  ADD COLUMN summary text NOT NULL DEFAULT '',
  ADD COLUMN good text NOT NULL DEFAULT '[]',
  ADD COLUMN bad text NOT NULL DEFAULT '[]',
  ADD COLUMN observations text NOT NULL DEFAULT '[]';

ALTER TABLE daily_reports DROP COLUMN content;
