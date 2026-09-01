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
  cards_json jsonb default '[]'::jsonb,
  shared_with_user_id uuid default null,
  created_at timestamp with time zone default now()
);

-- Indexes
create index if not exists idx_shared_decks_user on shared_decks(user_id);
create index if not exists idx_shared_decks_created on shared_decks(created_at desc);
create index if not exists idx_shared_decks_with on shared_decks(shared_with_user_id);

-- Enable RLS
alter table shared_decks enable row level security;

-- Users can read their own shared decks or decks shared with them
create policy "Users can read their own shared decks"
  on shared_decks for select using (
    auth.uid() = user_id OR auth.uid() = shared_with_user_id OR shared_with_user_id is null
  );

-- Authenticated users can insert their own
create policy "Authenticated users can insert shared decks"
  on shared_decks for insert with check (auth.role() = 'authenticated' and auth.uid() = user_id);

-- Users can delete their own shared decks
create policy "Users can delete their own shared decks"
  on shared_decks for delete using (auth.role() = 'authenticated' and auth.uid() = user_id);
