-- Friends system: search, send requests, accept/reject, friends list
DO $$ BEGIN
  CREATE TABLE user_friends (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    requester_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    addressee_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected')),
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(requester_id, addressee_id)
  );
EXCEPTION WHEN duplicate_object THEN null;
END $$;

ALTER TABLE user_friends ENABLE ROW LEVEL SECURITY;

-- Users can see their own sent/received requests
DO $$ BEGIN
  CREATE POLICY "Users see own friendships" ON user_friends
    FOR SELECT USING (
      auth.uid() = requester_id OR auth.uid() = addressee_id
    );
EXCEPTION WHEN duplicate_object THEN null;
END $$;

-- Users can send friend requests
DO $$ BEGIN
  CREATE POLICY "Users can send requests" ON user_friends
    FOR INSERT WITH CHECK (
      auth.uid() = requester_id AND requester_id != addressee_id
    );
EXCEPTION WHEN duplicate_object THEN null;
END $$;

-- Users can update their own received or sent requests (accept/reject/cancel)
DO $$ BEGIN
  CREATE POLICY "Users can update own requests" ON user_friends
    FOR UPDATE USING (
      auth.uid() = requester_id OR auth.uid() = addressee_id
    );
EXCEPTION WHEN duplicate_object THEN null;
END $$;

-- Users can delete (unfriend or cancel) their own friendships
DO $$ BEGIN
  CREATE POLICY "Users can delete own friendships" ON user_friends
    FOR DELETE USING (
      auth.uid() = requester_id OR auth.uid() = addressee_id
    );
EXCEPTION WHEN duplicate_object THEN null;
END $$;

-- Index for fast lookups
CREATE INDEX IF NOT EXISTS idx_user_friends_requester ON user_friends(requester_id);
CREATE INDEX IF NOT EXISTS idx_user_friends_addressee ON user_friends(addressee_id);
CREATE INDEX IF NOT EXISTS idx_user_friends_status ON user_friends(status);
