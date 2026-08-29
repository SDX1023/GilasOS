-- Shared Decks table
-- Run this in Supabase SQL Editor

create table if not exists shared_decks (
  id uuid default gen_random_uuid() primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  reviewer_id text not null,
  course_id text not null default '',
  module_id text not null default '',
  title text not null,
  card_count integer not null default 0,
  created_at timestamp with time zone default now()
);

-- Indexes
create index if not exists idx_shared_decks_user on shared_decks(user_id);
create index if not exists idx_shared_decks_created on shared_decks(created_at desc);

-- Enable RLS
alter table shared_decks enable row level security;

-- Anyone can read shared decks
create policy "Anyone can read shared decks"
  on shared_decks for select using (true);

-- Authenticated users can insert their own
create policy "Authenticated users can insert shared decks"
  on shared_decks for insert with check (auth.role() = 'authenticated' and auth.uid() = user_id);

-- Users can delete their own shared decks
create policy "Users can delete their own shared decks"
  on shared_decks for delete using (auth.role() = 'authenticated' and auth.uid() = user_id);
