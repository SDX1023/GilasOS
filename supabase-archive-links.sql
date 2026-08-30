-- Add links JSONB array to archive_entries for multiple links per entry
DO $$ BEGIN
  ALTER TABLE archive_entries ADD COLUMN IF NOT EXISTS links JSONB DEFAULT '[]'::jsonb;
EXCEPTION WHEN duplicate_column THEN null;
END $$;