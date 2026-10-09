-- ============================================================
-- Step 2: scope the feature tables to a festival. Adds festival_id to each,
-- backfills existing rows to the seeded Ganpati event, and makes the
-- "one entry per flat" rules per-festival. Additive & safe to re-run.
-- Run AFTER supabase-festivals-setup.sql.
-- ============================================================

alter table public.aarti_schedule       add column if not exists festival_id uuid references public.festivals(id) on delete cascade;
alter table public.program_participants  add column if not exists festival_id uuid references public.festivals(id) on delete cascade;
alter table public.submissions           add column if not exists festival_id uuid references public.festivals(id) on delete cascade;
alter table public.events                add column if not exists festival_id uuid references public.festivals(id) on delete cascade;

-- Backfill everything that predates multi-event to the Ganpati festival.
do $$
declare fid uuid;
begin
  select id into fid from public.festivals where slug = 'ganpati-2026';
  if fid is not null then
    update public.aarti_schedule      set festival_id = fid where festival_id is null;
    update public.program_participants set festival_id = fid where festival_id is null;
    update public.submissions          set festival_id = fid where festival_id is null;
    update public.events               set festival_id = fid where festival_id is null;
  end if;
end $$;

-- "One per flat" becomes per-festival: drop the old global unique, add composite.
alter table public.aarti_schedule drop constraint if exists aarti_schedule_flat_number_key;
create unique index if not exists aarti_schedule_festival_flat_uidx
  on public.aarti_schedule (festival_id, flat_number);

alter table public.submissions drop constraint if exists submissions_flat_number_key;
create unique index if not exists submissions_festival_flat_uidx
  on public.submissions (festival_id, flat_number);

-- Helpful indexes for per-festival listing.
create index if not exists program_participants_festival_idx on public.program_participants (festival_id);
create index if not exists events_festival_idx on public.events (festival_id);

notify pgrst, 'reload schema';
