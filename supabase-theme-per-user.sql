-- Add wallpaper and accent columns to user_profiles for per-user theme persistence
DO $$ BEGIN
  ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS wallpaper text default '';
EXCEPTION WHEN duplicate_column THEN null;
END $$;

DO $$ BEGIN
  ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS accent text default '';
EXCEPTION WHEN duplicate_column THEN null;
END $$;
