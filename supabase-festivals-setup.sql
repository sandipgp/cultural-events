-- ============================================================
-- Multi-event foundation. Adds a `festivals` table so the app can host any
-- society event (Ganpati, Navratri, Winter Sports, Kojagiri, …), each with its
-- own theme, logo, dates and module configuration. Additive & safe to re-run.
-- ============================================================

create table if not exists public.festivals (
  id                  uuid primary key default gen_random_uuid(),
  slug                text        not null unique,   -- e.g. "ganpati-2026"
  name                text        not null,          -- e.g. "Ganeshotsav 2026"
  society_name        text,                          -- e.g. "Vivantalife Vedika"
  tagline             text,
  status              text        not null default 'active', -- draft | active | over
  theme               jsonb       not null default '{}'::jsonb,   -- { brand, brand2, gold }
  logo                text,                          -- "/ganesh-logo.svg" or an emoji
  modules             jsonb       not null default '{}'::jsonb,   -- per-module config (see seed)
  contest_open        boolean     not null default true,
  submission_deadline text,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);

-- RLS: public read; writes allowed (admin controls are gated in the app).
alter table public.festivals enable row level security;
drop policy if exists "public read"  on public.festivals;
drop policy if exists "public write" on public.festivals;
create policy "public read"  on public.festivals for select using (true);
create policy "public write" on public.festivals for all using (true) with check (true);
grant select, insert, update, delete on public.festivals to anon, authenticated;

-- Seed the current Ganpati event from today's hardcoded config (only if none).
insert into public.festivals (slug, name, society_name, tagline, status, theme, logo, modules, contest_open, submission_deadline)
values (
  'ganpati-2026',
  'Ganeshotsav 2026',
  'Vivantalife Vedika',
  'Aarti bookings, cultural programs & the event schedule — all in one place.',
  'active',
  '{"brand":"#c026a3","brand2":"#f97316","gold":"#e0a920"}'::jsonb,
  '/ganesh-logo.svg',
  '{
     "rota":          {"enabled": true, "label": "Aarti",            "dates": ["14 Sep","15 Sep","16 Sep","17 Sep","18 Sep","19 Sep","20 Sep"], "slots": ["Morning","Evening"]},
     "participation": {"enabled": true, "label": "Cultural Programs", "ageGroups": ["0-2 yrs","2-5 yrs","Above 5 yrs","Adults"], "categories": ["Dance","Fashion Show","Singing"], "allowOther": true, "winners": true},
     "contest":       {"enabled": true, "label": "Photo Contest",    "aiCheck": false},
     "schedule":      {"enabled": true, "label": "Events Schedule"}
   }'::jsonb,
  true,
  '17 Sep 2026'
)
on conflict (slug) do nothing;

-- Point the app at the active festival (used by the festival context).
insert into public.app_settings (key, value, updated_at)
values ('active_festival_id', (select id::text from public.festivals where slug = 'ganpati-2026'), now())
on conflict (key) do nothing;

notify pgrst, 'reload schema';
