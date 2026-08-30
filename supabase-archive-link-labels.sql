DO $$ BEGIN
  ALTER TABLE archive_entries ADD COLUMN IF NOT EXISTS link_labels JSONB DEFAULT '[]'::jsonb;
EXCEPTION WHEN duplicate_column THEN null;
END $$;
