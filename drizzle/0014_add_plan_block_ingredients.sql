ALTER TABLE plan_blocks ADD COLUMN ingredient_ids integer[] DEFAULT '{}'::integer[];
