-- FSRS card scheduling table
-- Stores per-card spaced repetition state for each user

CREATE TABLE IF NOT EXISTS card_schedules (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  deck_id UUID NOT NULL REFERENCES custom_decks(id) ON DELETE CASCADE,
  card_front TEXT NOT NULL,
  card_back TEXT NOT NULL,
  stability DOUBLE PRECISION DEFAULT 0,
  difficulty DOUBLE PRECISION DEFAULT 0,
  due TIMESTAMPTZ DEFAULT now(),
  last_review TIMESTAMPTZ,
  reps INTEGER DEFAULT 0,
  lapses INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, deck_id, card_front, card_back)
);

-- Index for due card queries
CREATE INDEX IF NOT EXISTS idx_card_schedules_due ON card_schedules(user_id, deck_id, due);
CREATE INDEX IF NOT EXISTS idx_card_schedules_user_deck ON card_schedules(user_id, deck_id);
