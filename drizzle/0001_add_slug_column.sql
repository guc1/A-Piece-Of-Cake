-- Add slug column to flavors for existing databases
ALTER TABLE flavors ADD COLUMN IF NOT EXISTS slug text;

UPDATE flavors
SET slug = regexp_replace(lower(coalesce(name, '')), '[^a-z0-9]+', '-', 'g')
WHERE slug IS NULL OR slug = '';

ALTER TABLE flavors ALTER COLUMN slug SET NOT NULL;
