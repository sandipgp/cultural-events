-- ============================================================
-- OPTIONAL HARDENING — run ONLY after SUPABASE_SERVICE_ROLE_KEY is set in the
-- Next.js server env, so festival writes go through the authorized API routes
-- (which use the service-role key and bypass RLS).
--
-- Effect: the browser anon key can READ festivals but can no longer INSERT /
-- UPDATE / DELETE them directly. app_settings is locked the same way so the
-- "active festival" pointer can only be changed via the API.
--
-- If you run this WITHOUT setting the service key first, admin event/theme
-- writes will start failing (the API falls back to the anon key). Re-open with
-- the "rollback" block at the bottom if needed.
-- ============================================================

-- festivals: public read, no public writes
drop policy if exists "public read"  on public.festivals;
drop policy if exists "public write" on public.festivals;
create policy "public read" on public.festivals for select using (true);
revoke insert, update, delete on public.festivals from anon;

-- app_settings: public read, no public writes
drop policy if exists "public read"  on public.app_settings;
drop policy if exists "public write" on public.app_settings;
create policy "public read" on public.app_settings for select using (true);
revoke insert, update, delete on public.app_settings from anon;

notify pgrst, 'reload schema';

-- ------------------------------------------------------------
-- ROLLBACK (re-open public writes) — uncomment and run to revert:
-- drop policy if exists "public write" on public.festivals;
-- create policy "public write" on public.festivals for all using (true) with check (true);
-- grant insert, update, delete on public.festivals to anon;
-- drop policy if exists "public write" on public.app_settings;
-- create policy "public write" on public.app_settings for all using (true) with check (true);
-- grant insert, update, delete on public.app_settings to anon;
-- notify pgrst, 'reload schema';
