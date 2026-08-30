-- Add shared_with_user_id to saved_quizzes for per-user/friend sharing
DO $$ BEGIN
  ALTER TABLE saved_quizzes ADD COLUMN IF NOT EXISTS shared_with_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
EXCEPTION WHEN duplicate_column THEN null;
END $$;

-- Update RLS: recipient can also read the shared quiz
DO $$ BEGIN
  DROP POLICY IF EXISTS "Users can read shared quizzes" ON saved_quizzes;
  CREATE POLICY "Users can read shared quizzes" ON saved_quizzes
    FOR SELECT USING (
      shared = true
      OR shared_with_user_id = auth.uid()
      OR user_id = auth.uid()
    );
EXCEPTION WHEN duplicate_object THEN null;
END $$;

-- Index for shared lookups
CREATE INDEX IF NOT EXISTS idx_saved_quizzes_shared_with ON saved_quizzes(shared_with_user_id) WHERE shared_with_user_id IS NOT NULL;
