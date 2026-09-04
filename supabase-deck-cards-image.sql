ALTER TABLE custom_deck_cards ADD COLUMN IF NOT EXISTS image_url text;
ALTER TABLE custom_deck_cards ADD COLUMN IF NOT EXISTS card_type text DEFAULT 'standard';
ALTER TABLE custom_deck_cards ADD COLUMN IF NOT EXISTS labels jsonb;
