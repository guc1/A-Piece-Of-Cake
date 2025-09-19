ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "coach_tone_custom" text NOT NULL DEFAULT '';
ALTER TABLE "daily_reports" ADD COLUMN IF NOT EXISTS "coach_tone_custom" text NOT NULL DEFAULT '';
ALTER TABLE "weekly_reports" ADD COLUMN IF NOT EXISTS "coach_tone_custom" text NOT NULL DEFAULT '';
ALTER TABLE "monthly_reports" ADD COLUMN IF NOT EXISTS "coach_tone_custom" text NOT NULL DEFAULT '';
ALTER TABLE "yearly_reports" ADD COLUMN IF NOT EXISTS "coach_tone_custom" text NOT NULL DEFAULT '';
ALTER TABLE "heading_reports" ADD COLUMN IF NOT EXISTS "coach_tone_custom" text NOT NULL DEFAULT '';
