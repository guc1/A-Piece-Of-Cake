DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_enum e
    JOIN pg_type t ON e.enumtypid = t.oid
    WHERE t.typname = 'notification_type'
      AND e.enumlabel = 'follow_declined'
  ) THEN
    ALTER TYPE "notification_type" ADD VALUE 'follow_declined';
  END IF;
END $$;
