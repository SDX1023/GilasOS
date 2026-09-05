-- Run this in Supabase SQL Editor to add course/category support to My Decks

CREATE TABLE IF NOT EXISTS deck_courses (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id),
  title TEXT NOT NULL,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE deck_courses ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own deck courses" ON deck_courses FOR ALL USING (auth.uid() = user_id);

ALTER TABLE custom_decks ADD COLUMN IF NOT EXISTS course_id UUID REFERENCES deck_courses(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_deck_courses_user ON deck_courses(user_id);
CREATE INDEX IF NOT EXISTS idx_custom_decks_course ON custom_decks(course_id);
