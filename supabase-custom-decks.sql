CREATE TABLE IF NOT EXISTS custom_decks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id),
  title TEXT NOT NULL,
  description TEXT DEFAULT '',
  card_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS custom_deck_cards (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  deck_id UUID NOT NULL REFERENCES custom_decks(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id),
  front TEXT NOT NULL,
  back TEXT NOT NULL,
  hint TEXT DEFAULT '',
  card_type TEXT DEFAULT 'standard',
  image_url TEXT DEFAULT '',
  labels JSONB DEFAULT '[]'::jsonb,
  card_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE custom_decks ENABLE ROW LEVEL SECURITY;
ALTER TABLE custom_deck_cards ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own decks" ON custom_decks FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users manage own deck cards" ON custom_deck_cards FOR ALL USING (auth.uid() = user_id);
