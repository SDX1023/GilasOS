-- Add bg and stage_override columns to user_pets
DO $$ BEGIN
  ALTER TABLE user_pets ADD COLUMN IF NOT EXISTS bg text DEFAULT 'night';
EXCEPTION WHEN duplicate_column THEN null;
END $$;

DO $$ BEGIN
  ALTER TABLE user_pets ADD COLUMN IF NOT EXISTS stage_override text DEFAULT null;
EXCEPTION WHEN duplicate_column THEN null;
END $$;
