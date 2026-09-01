-- Migration: Add cards_json and shared_with_user_id to shared_decks
-- Run in Supabase SQL Editor if you have an existing shared_decks table

-- Add missing columns
ALTER TABLE shared_decks ADD COLUMN IF NOT EXISTS shared_with_user_id uuid default null;
ALTER TABLE shared_decks ADD COLUMN IF NOT EXISTS cards_json jsonb default '[]'::jsonb;

-- Index for looking up decks shared with a user
CREATE INDEX IF NOT EXISTS idx_shared_decks_with ON shared_decks(shared_with_user_id);

-- Update policies: only sharer and recipient can see
DROP POLICY IF EXISTS "Anyone can read shared decks" ON shared_decks;
DROP POLICY IF EXISTS "Users can read their own shared decks" ON shared_decks;
DO $$ BEGIN
  create policy "Users can read their own shared decks"
    on shared_decks for select using (
      auth.uid() = user_id OR auth.uid() = shared_with_user_id OR shared_with_user_id is null
    );
EXCEPTION WHEN duplicate_object THEN null;
END $$;
