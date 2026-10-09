# 🪔 Society Events App

A mobile-first, **multi-event** society platform (Ganpati, Navratri, Winter
Sports, Kojagiri, …) with per-event theming, admin-managed events/modules,
Aarti rota, program participation, a photo/media contest, and an events
schedule — all on Supabase.

> ### ➡️ The current app is in [`next-app/`](./next-app) (Next.js)
>
> The project has migrated to **Next.js (App Router)** — see
> [`next-app/README.md`](./next-app/README.md) to run and deploy it. The
> API routes there keep the Gemini key and festival writes server-side.
>
> **This top-level project (React + Vite, in [`src/`](./src)) is the previous
> version.** It still works and shares the same Supabase database, but it will
> be retired once the Next.js app is confirmed in production. New work should
> go in `next-app/`.
>
> **Database SQL** (shared by both) lives at the repo root and is applied in
> order via `npm run db:init`: `supabase-setup.sql`,
> `supabase-events-setup.sql`, `supabase-festivals-setup.sql`,
> `supabase-festival-scope.sql`. Optional hardening:
> `supabase-festival-hardening.sql`.

---

## The Vite app (this folder)

Built with **React + Vite** and **Supabase**. Same features as the Next.js app.

---

## Features

**Dashboard** (`/`) — the home screen with tiles linking to every section. A
"Program Winners" tile appears automatically once winners have been set.

**Schedule Aarti** (`/aarti`) — book an Aarti slot: name, flat number
(A101–A1108), date (14–20 Sep), and slot (Morning / Evening). One booking per
flat; submitting again updates it. Multiple flats may share the same date/slot.

**Aarti Schedule** (`/aarti/list`) — a table of all bookings. Admins can edit or
delete any row; members change their own by booking again.

**Participate in Program** (`/program`) — register for cultural programs: name,
age group (0-2 / 2-5 / Above 5 yrs / Adults), one or more programs
(Dance / Fashion Show / Singing, plus a free-text "Other"), and an optional
description.

**Participants** (`/program/list`) — a table of everyone registered, filterable
by program (including "Others" for custom entries). Admins can set/unset
winners, edit, or delete entries.

**Program Winners** (`/program/winners`) — shows the winners once an admin has
marked them.

**Events Schedule** (`/events`) — the festival programme. Admins can add, edit,
and delete events (title, date, time, description). Events sort by date and by
actual clock time.

**Photo Contest** (`/photo`, `/gallery`, `/winners`) — submit one decoration
photo per flat, browse the gallery, and view winners. Includes an optional
AI check (Google Gemini) that flags AI-generated photos and can reject
non-Ganpati images. Admins can mark winners, remove entries, and open/close the
contest from the gallery.

**Admin** — a single password (entered from the header) unlocks all management
controls across the app for the session.

---

## Setup

### 1. Create a Supabase project
Sign up at https://supabase.com and create a new project (free tier).

### 2. Configure the app
Copy the example environment file and fill in your own values:

```bash
cp .env.example .env.local
```

Open `.env.example` — it lists and explains every value the app needs
(Supabase keys, admin password, festival dates, optional AI check, site URL for
link previews, and the database connection used by the setup script). Fill the
same keys into `.env.local`. `.env.local` is gitignored and never committed.

### 3. Set up the database
This creates all tables, the photo storage bucket, and access policies. Two
options — both are safe to re-run:

**Option A — one command** (uses the DB connection string from your config):
```bash
npm run db:init
```

**Option B — paste SQL:** in the Supabase dashboard open **SQL Editor → New
query**, run [`supabase-setup.sql`](./supabase-setup.sql), then run
[`supabase-events-setup.sql`](./supabase-events-setup.sql).

### 4. Run it
```bash
npm install
npm run dev
```
Open the printed URL (e.g. http://localhost:5173) on your phone or a
mobile-sized browser window.

### 5. (Optional) Images
- `public/ganesh-logo.svg` is the themed header logo (already included).
- Add `public/og-image.jpg` (1200×630) for WhatsApp / social link previews.

---

## Deploy (Vercel)

1. Push the repo to GitHub and import it at https://vercel.com (it auto-detects
   Vite), **or** run `npx vercel` from the project folder.
2. Add the same configuration values in **Project → Settings → Environment
   Variables**.
3. `vercel.json` is included so client-side routes (`/aarti`, `/events`, …)
   don't 404 on refresh.

After the first deploy, set the site URL value to your live URL and redeploy so
link previews resolve correctly.

---

## Tech notes

- **Data model:** `aarti_schedule`, `program_participants`, `events`, and
  `app_settings` tables, plus `submissions` and a public `photos` bucket for the
  photo contest.
- **Admin access** is a shared password checked in the browser — convenient for
  a society event, but not hardened security. For stronger control, move
  management behind Supabase Auth.
- **Photo contest open/closed** is stored in `app_settings` so an admin can
  toggle it at runtime from the gallery (no redeploy needed).
- **AI photo check** is optional and best-effort — a general vision model's
  judgment, not a forensic detector. It fails open, so it never blocks a
  submission when unavailable.

---

Ganpati Bappa Morya 🌺
