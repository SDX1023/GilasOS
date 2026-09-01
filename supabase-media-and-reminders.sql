ALTER TABLE flashcards ADD COLUMN IF NOT EXISTS card_type TEXT DEFAULT 'standard';
ALTER TABLE flashcards ADD COLUMN IF NOT EXISTS image_url TEXT;
ALTER TABLE flashcards ADD COLUMN IF NOT EXISTS labels JSONB DEFAULT '[]'::jsonb;

CREATE TABLE IF NOT EXISTS study_reminders (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id),
  title TEXT NOT NULL,
  remind_at TIMESTAMPTZ NOT NULL,
  recurrence TEXT DEFAULT 'none',
  enabled BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE study_reminders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own reminders" ON study_reminders FOR ALL USING (auth.uid() = user_id);
