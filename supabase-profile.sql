-- Profile page: add avatar, bio, and mood columns to user_profiles
-- Run this in Supabase SQL Editor

-- Add new columns (safe to run multiple times)
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS avatar_url text default '';
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS bio text default '';
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS mood_text text default '';
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS mood_emoji text default '';
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS spotify_url text default '';

-- Create storage bucket for avatars
INSERT INTO storage.buckets (id, name, public) VALUES ('avatars', 'avatars', true) ON CONFLICT (id) DO NOTHING;

-- Storage policies
CREATE POLICY "Avatar images are publicly accessible"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'avatars');

CREATE POLICY "Anyone can upload an avatar"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'avatars' AND auth.role() = 'authenticated');

CREATE POLICY "Users can update their own avatar"
  ON storage.objects FOR UPDATE
  USING (bucket_id = 'avatars' AND auth.role() = 'authenticated');

CREATE POLICY "Users can delete their own avatar"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'avatars' AND auth.role() = 'authenticated');
