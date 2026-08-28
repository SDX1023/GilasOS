-- Run this in Supabase SQL Editor to add username change tracking

ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS username_changed_at TIMESTAMPTZ;
