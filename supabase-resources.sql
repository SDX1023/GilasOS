-- Course Resources table
-- Run this in your Supabase SQL Editor to create the table

create table if not exists course_resources (
  id uuid default gen_random_uuid() primary key,
  course_id text not null,
  title text not null,
  url text not null,
  type text not null default 'Website',
  created_at timestamp with time zone default now()
);

-- Enable RLS
alter table course_resources enable row level security;

-- Anyone can read resources
create policy "Anyone can read course resources"
  on course_resources for select
  using (true);

-- Only authenticated users can insert
create policy "Authenticated users can insert course resources"
  on course_resources for insert
  with check (auth.role() = 'authenticated');

-- Only authenticated users can update
create policy "Authenticated users can update course resources"
  on course_resources for update
  using (auth.role() = 'authenticated');

-- Only authenticated users can delete
create policy "Authenticated users can delete course resources"
  on course_resources for delete
  using (auth.role() = 'authenticated');
