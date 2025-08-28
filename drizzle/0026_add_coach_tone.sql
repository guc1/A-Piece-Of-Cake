-- Coach tone enum
DO $$ BEGIN
  CREATE TYPE "coach_tone" AS ENUM ('tone_soft','tone_medium','tone_hard','tone_superhard');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "coach_tone" "coach_tone" NOT NULL DEFAULT 'tone_medium';
