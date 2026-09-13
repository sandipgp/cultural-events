# 🪔 Ganpati Photo Contest

A trendy mobile web app for a society Ganpati decoration photo contest.

- **Submit screen** (`/`) — logo header, Ganesh intro, and a form: name, flat
  number dropdown (A101–A1108, 88 flats), and a single photo upload. Only one
  photo per flat is allowed; uploading again **replaces** the old one after a
  confirmation prompt. Shows a thank-you message when done.
- **Gallery screen** (`/gallery`) — all photos in a grid of cards with name and
  flat, plus a password-protected **Set winner** control (🏆 badge).

Built with **React + Vite** and **Supabase** (free Postgres database + Storage).

---

## 1. Create a free Supabase project

1. Go to https://supabase.com → sign up → **New project** (free tier, no card).
2. Wait ~2 minutes for it to provision.

## 2. Set up the database + photo storage

You have two options — both create the tables, the `photos` bucket, and all the
access policies. They're safe to re-run.

**Option A — paste SQL (no setup):** In your project open **SQL Editor → New
query**, paste the contents of [`supabase-setup.sql`](./supabase-setup.sql), Run,
then do the same with [`supabase-events-setup.sql`](./supabase-events-setup.sql).

**Option B — one command:** add `SUPABASE_DB_URL` to `.env.local` (Supabase →
**Project Settings → Database → Connection string → URI**, the one with your DB
password), then:

```bash
npm run db:init
```

This runs both `.sql` files against your database. The connection string is a
privileged secret — it's kept **out** of the `VITE_` vars so it never ships to
the browser, and `.env.local` is gitignored.

## 3. Get your API keys

1. In Supabase go to **Project Settings → API**.
2. Copy the **Project URL** and the **anon public** key.

## 4. Configure the app

```bash
cp .env.example .env.local
```

Edit `.env.local`:

```

# Last date to submit, shown in the contest rules (free text)
VITE_LAST_DATE=15 September 2026

# Winners screen switch: 1 = contest over (show winners),
# 0 = force open (hide winners), blank = follow the date above
VITE_CONTEST_OVER=0

# Optional — AI photo check. VITE_AI_CHECK=1 runs it, 0 skips it.
VITE_AI_CHECK=1
VITE_GEMINI_API_KEY=your-gemini-key
VITE_GEMINI_MODEL=gemini-2.5-flash
```

The admin password is what you'll type on the Gallery screen to unlock the
"Set winner" buttons.

The Gemini key is optional — get one free at
https://aistudio.google.com/apikey. If you leave it blank, the app still works
and just asks each user to self-certify their photo instead of checking it.

## 5. Run it

```bash
npm install
npm run dev
```

Open the printed URL (e.g. http://localhost:5173) on your phone or in a
mobile-sized browser window.

## 6. (Optional) Add a Ganesh image

Drop a `ganesh.png` into a `public/` folder in the project root. If it's not
there, the app shows a 🕉️ emoji instead — nothing breaks.

## 7. Link previews on WhatsApp (Open Graph)

When you share the link, WhatsApp shows a title, description and image. Two
things make the image and URL correct:

1. Set **`VITE_SITE_URL`** to your deployed URL (no trailing slash), both in
   `.env.local` and in your host's env vars. It's substituted into the OG tags
   at build time.
2. Put a **`public/og-image.jpg`** sized **1200×630**. Without it the preview
   still shows the title and description, just no picture.

WhatsApp caches previews hard. If you re-share and the old preview sticks,
share the URL with a throwaway query (`?v=2`) to force a fresh fetch, or run it
through Facebook's Sharing Debugger (https://developers.facebook.com/tools/debug/).

## 8. Deploy for free

Push to GitHub and import into **Vercel** or **Netlify**. Add the same
environment variables in the host's dashboard. Both offer free static hosting
for a Vite app.

---

### Notes on the design choices

- **One photo per flat:** the flat number is a unique key in the database, and
  each flat's photo is stored at a fixed path (`flat-A101`), so re-uploading
  overwrites cleanly with no leftover files.
- **Admin password** is checked in the browser — good enough to stop casual
  tampering at a society event, but not real security. If you later want proper
  protection, we can move winner-setting behind Supabase Auth.
- **AI photo check (Gemini):** on submit, the photo is sent to Google Gemini,
  which judges whether it looks AI-generated or heavily AI-filtered. The user
  sees the result and confirms before uploading, and flagged photos get an
  "🤖 AI" label in the gallery. Two things to know:
  - It's a **best-effort** check, not a forensic detector — it will sometimes
    be wrong either way. For a reliable result, use a dedicated service like
    Sightengine or Hive instead of Gemini.
  - The `VITE_GEMINI_API_KEY` is **bundled into the browser**, so a determined
    user could extract and misuse it. For a small contest that's usually fine;
    to lock it down, move the `detectAiPhoto` fetch into a serverless function
    (Vercel/Netlify function or a Supabase Edge Function) that holds the key
    server-side, and have the app call that instead. Set a usage cap/budget on
    the key in Google AI Studio either way.
