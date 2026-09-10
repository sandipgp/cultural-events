-- ============================================================
-- Run this in Supabase dashboard > SQL Editor > New query > Run
-- ============================================================

-- 1) Table for submissions --------------------------------------------------
create table if not exists public.submissions (
  id           uuid primary key default gen_random_uuid(),
  name         text        not null,
  flat_number  text        not null unique,   -- one photo per flat
  photo_path   text        not null,
  photo_url    text        not null,
  is_winner    boolean     not null default false,
  is_ai        boolean     not null default false,  -- flagged by the AI check
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

-- If the table already existed before the AI feature, add the column:
alter table public.submissions
  add column if not exists is_ai boolean not null default false;

-- 2) Row Level Security ------------------------------------------------------
-- This is a public society contest, so we allow anyone to read, add and
-- update rows. (The "Set winner" screen is gated by a password in the app,
-- which is convenience-level protection, not hard security.)
alter table public.submissions enable row level security;

drop policy if exists "public read"   on public.submissions;
drop policy if exists "public insert" on public.submissions;
drop policy if exists "public update" on public.submissions;
drop policy if exists "public delete" on public.submissions;

create policy "public read"   on public.submissions for select using (true);
create policy "public insert" on public.submissions for insert with check (true);
create policy "public update" on public.submissions for update using (true) with check (true);
create policy "public delete" on public.submissions for delete using (true);

-- PostgREST only advertises a method (PATCH for "Set winner", DELETE for
-- "Remove from contest") in the CORS preflight if the anon role holds that
-- privilege. Grant them explicitly so those requests aren't rejected.
grant select, insert, update, delete on public.submissions to anon, authenticated;

-- 3) Storage bucket for the photos ------------------------------------------
-- Creates a PUBLIC bucket named "photos".
insert into storage.buckets (id, name, public)
values ('photos', 'photos', true)
on conflict (id) do update set public = true;

-- Allow anyone to read/upload/overwrite objects in the "photos" bucket.
drop policy if exists "photos read"   on storage.objects;
drop policy if exists "photos write"  on storage.objects;
drop policy if exists "photos update" on storage.objects;
drop policy if exists "photos delete" on storage.objects;

create policy "photos read"   on storage.objects
  for select using (bucket_id = 'photos');
create policy "photos write"  on storage.objects
  for insert with check (bucket_id = 'photos');
create policy "photos update" on storage.objects
  for update using (bucket_id = 'photos') with check (bucket_id = 'photos');
create policy "photos delete" on storage.objects
  for delete using (bucket_id = 'photos');
