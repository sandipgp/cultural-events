# 🪔 Society Events — Next.js app

Multi-event society platform (Ganpati, Navratri, Winter Sports, Kojagiri, …):
per-event theming, admin-managed events/modules, Aarti rota, program
participation, photo/media contest and an events schedule. Built with
**Next.js (App Router)** + **Supabase**.

This is the Next.js version (Phase 2). The original Vite app lives one level up
and can be retired once you've confirmed parity here.

## Run locally

```bash
cd next-app
cp .env.example .env.local   # fill in values
npm install
npm run dev                  # http://localhost:3000
```

## Database

The app uses the same Supabase project/tables as the Vite app. If starting
fresh, run the SQL files in the parent folder in order (SQL Editor or the
parent's `npm run db:init`):

1. `supabase-setup.sql` — photo `submissions` + storage bucket
2. `supabase-events-setup.sql` — aarti / program / events / app_settings
3. `supabase-festivals-setup.sql` — `festivals` table + seed
4. `supabase-festival-scope.sql` — `festival_id` on feature tables

## Environment

See `.env.example`. Two tiers:

- **`NEXT_PUBLIC_*`** — shipped to the browser: Supabase URL + anon key, site URL,
  and (transitionally) the admin-login fallback password.
- **Server-only** (no prefix): `ADMIN_PASSWORD`, `GEMINI_API_KEY`,
  `SUPABASE_SERVICE_ROLE_KEY`. These stay on the server and power the API routes
  in `app/api/*` (admin login, festival writes, AI check).

## What's server-side

- **`/api/ai-check`** — runs the Gemini photo check with `GEMINI_API_KEY` (key
  never reaches the browser). Enabled per-event via the contest module's
  `aiCheck` flag.
- **`/api/festivals`, `/api/festivals/active`** — create/update/switch events
  using the service-role key (falls back to anon until set); every write is
  authorized against `ADMIN_PASSWORD`.
- **`/api/admin/login`** — verifies the admin password server-side.

Public reads/writes for the feature tables (aarti, programs, submissions,
events) still use the Supabase browser client — intentional, incremental.

## Deploy (Vercel)

1. Import the repo into Vercel and set **Root Directory = `next-app`**
   (Framework preset: Next.js, auto-detected).
2. Add the environment variables from `.env.example` in **Project → Settings →
   Environment Variables** (server-only ones without `NEXT_PUBLIC_`).
3. After the first deploy, set `NEXT_PUBLIC_SITE_URL` to the live URL and
   redeploy so link previews resolve.

## Social preview image

Add `public/og-image.jpg` (1200×630). The layout metadata already references
`/og-image.jpg`; without the file the preview still shows title + description.

## Hardening (after adding the service key)

Once `SUPABASE_SERVICE_ROLE_KEY` is set in the server env, run
`supabase-festival-hardening.sql` (parent folder) to lock the `festivals` table
so the browser anon key can read but not write it — all writes then go through
the authorized API routes. You can also drop `NEXT_PUBLIC_ADMIN_P` at that point.

Ganpati Bappa Morya 🌺
