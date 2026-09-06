-- Simple card tracking table
-- Tracks known/forgot/dontKnow counts per card

CREATE TABLE IF NOT EXISTS card_schedules (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  deck_id TEXT NOT NULL,
  card_front TEXT NOT NULL,
  card_back TEXT NOT NULL,
  known INTEGER DEFAULT 0,
  forgot INTEGER DEFAULT 0,
  dont_know INTEGER DEFAULT 0,
  reps INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, deck_id, card_front, card_back)
);

CREATE INDEX IF NOT EXISTS idx_card_schedules_user_deck ON card_schedules(user_id, deck_id);
