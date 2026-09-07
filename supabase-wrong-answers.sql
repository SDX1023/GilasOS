CREATE TABLE IF NOT EXISTS wrong_answers (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  front TEXT NOT NULL,
  back TEXT NOT NULL,
  hint TEXT DEFAULT '',
  source TEXT DEFAULT '',
  subject TEXT DEFAULT '',
  mastered BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE wrong_answers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own wrong answers" ON wrong_answers
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own wrong answers" ON wrong_answers
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own wrong answers" ON wrong_answers
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own wrong answers" ON wrong_answers
  FOR DELETE USING (auth.uid() = user_id);

CREATE INDEX idx_wrong_answers_user_id ON wrong_answers(user_id);
CREATE INDEX idx_wrong_answers_mastered ON wrong_answers(user_id, mastered);
