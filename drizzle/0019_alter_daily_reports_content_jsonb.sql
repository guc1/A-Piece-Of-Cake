ALTER TABLE "daily_reports" ALTER COLUMN "content" TYPE jsonb USING "content"::jsonb;
