-- ============================================================
-- Cultural-events tables. Run in Supabase > SQL Editor > New query > Run.
-- (This is in addition to supabase-setup.sql for the photo contest.)
-- ============================================================

-- 1) Aarti schedule (one booking per flat) ---------------------------------
create table if not exists public.aarti_schedule (
  id           uuid primary key default gen_random_uuid(),
  name         text        not null,
  flat_number  text        not null unique,
  aarti_date   text        not null,   -- e.g. "14 Sep"
  slot         text        not null,   -- "Morning" | "Evening"
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

-- 2) Program participants (one entry per flat, events is a list) ------------
create table if not exists public.program_participants (
  id           uuid primary key default gen_random_uuid(),
  name         text        not null,
  flat_number  text        not null unique,
  events       text[]      not null default '{}',
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

-- 3) Events schedule (admin-managed) ----------------------------------------
create table if not exists public.events (
  id           uuid primary key default gen_random_uuid(),
  title        text        not null,
  event_date   text,                   -- e.g. "15 Sep"
  event_time   text,                   -- free text, e.g. "7:00 PM"
  description  text,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

-- Row Level Security: public read/insert/update/delete (society app; the
-- edit/delete controls are gated by the app's admin password, which is
-- convenience-level protection, not hard security). PostgREST also needs the
-- privilege granted so PATCH/DELETE are allowed in the CORS preflight.
do $$
declare t text;
begin
  foreach t in array array['aarti_schedule','program_participants','events'] loop
    execute format('alter table public.%I enable row level security', t);
    execute format('drop policy if exists "public read"   on public.%I', t);
    execute format('drop policy if exists "public insert" on public.%I', t);
    execute format('drop policy if exists "public update" on public.%I', t);
    execute format('drop policy if exists "public delete" on public.%I', t);
    execute format('create policy "public read"   on public.%I for select using (true)', t);
    execute format('create policy "public insert" on public.%I for insert with check (true)', t);
    execute format('create policy "public update" on public.%I for update using (true) with check (true)', t);
    execute format('create policy "public delete" on public.%I for delete using (true)', t);
    execute format('grant select, insert, update, delete on public.%I to anon, authenticated', t);
  end loop;
end $$;
