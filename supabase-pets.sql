-- Pixel Pet system
CREATE TABLE IF NOT EXISTS user_pets (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  name TEXT DEFAULT 'Buddy',
  pet_type TEXT DEFAULT 'cat',
  color TEXT DEFAULT '#f59e0b',
  sprite_url TEXT,
  level INT DEFAULT 1,
  xp INT DEFAULT 0,
  hunger INT DEFAULT 80,
  happiness INT DEFAULT 80,
  energy INT DEFAULT 80,
  mood TEXT DEFAULT 'happy',
  last_fed_at TIMESTAMPTZ DEFAULT now(),
  last_played_at TIMESTAMPTZ DEFAULT now(),
  last_slept_at TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE user_pets ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "Users can read their own pet"
    ON user_pets FOR SELECT USING (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE POLICY "Users can insert their own pet"
    ON user_pets FOR INSERT WITH CHECK (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE POLICY "Users can update their own pet"
    ON user_pets FOR UPDATE USING (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE POLICY "Users can delete their own pet"
    ON user_pets FOR DELETE USING (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN null;
END $$;
