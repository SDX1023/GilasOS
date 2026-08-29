-- Shared Decks: add cards_json to store card data directly
-- Run this in Supabase SQL Editor

ALTER TABLE shared_decks ADD COLUMN IF NOT EXISTS cards_json jsonb default '[]'::jsonb;
