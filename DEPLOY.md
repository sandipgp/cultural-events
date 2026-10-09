# Deploy checklist — Next.js app (`next-app/`)

The live app is now the **Next.js** app in [`next-app/`](./next-app). The old
Vite app at the repo root is retired. Supabase (DB + storage) is unchanged, so
**no DB migration is needed to deploy** — only the hosting setup changes.

## Goal: keep the same URL (recommended)

Reuse the existing Vercel project and point it at `next-app/`, so your current
URL and any shared links keep working.

### 1. Get the code to Vercel

There's **no git repo here yet**. Pick one:

- **Git (dashboard deploys):**
  ```bash
  cd /Users/sandip.patil/code/pic-gallery
  git init && git add -A && git commit -m "Next.js app + multi-event platform"
  # create a GitHub repo, then:
  git remote add origin <your-repo-url>
  git push -u origin main
  ```
  Then connect that repo in the Vercel project (Settings → Git).
- **CLI (no git needed):**
  ```bash
  cd next-app
  npx vercel          # first run: links to the existing project (or creates one)
  npx vercel --prod   # production deploy
  ```

> Secrets are safe: `.env.local` (root and `next-app/`) is gitignored and will
> NOT be committed. Never commit secrets — set them in Vercel (step 3).

### 2. Point the project at `next-app/`

Vercel project → **Settings → Build & Deployment**:
- **Root Directory** = `next-app`
- **Framework Preset** = Next.js (auto-detected once root is `next-app`)
- Clear any old **Vite overrides** — Build Command and Output Directory back to
  **default** (Next uses `.next`, not `dist`).

### 3. Environment variables

Vercel project → **Settings → Environment Variables**. The old `VITE_*` vars are
unused; add these (values from `next-app/.env.local`):

Public (browser):
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `NEXT_PUBLIC_SITE_URL`  (your live URL)
- `NEXT_PUBLIC_ADMIN_P`  (optional; drop once `ADMIN_PASSWORD` is set — see below)

Server-only (NO `NEXT_PUBLIC_` prefix):
- `ADMIN_PASSWORD`  (admin login + festival-write auth)
- `GEMINI_API_KEY`, `GEMINI_MODEL`  (AI photo check; optional)
- `SUPABASE_SERVICE_ROLE_KEY`  (optional; enables hardening — see below)

### 4. Deploy, then finalize

1. Trigger the deploy.
2. Set `NEXT_PUBLIC_SITE_URL` to the live URL and **redeploy** (so OG/share
   links resolve).
3. Add a real `next-app/public/og-image.jpg` (1200×630) for link previews.

## Optional hardening (after `SUPABASE_SERVICE_ROLE_KEY` is set)

Run [`supabase-festival-hardening.sql`](./supabase-festival-hardening.sql) to
lock the `festivals` / `app_settings` tables to read-only for the anon key (all
writes then go through the authorized API routes). Then you can remove
`NEXT_PUBLIC_ADMIN_P` so the admin password is server-only.

## Notes
- `next-app/.gitignore` ignores `node_modules`, `.next`, `.env*` — confirmed.
- The root Vite app can be deleted later; it shares the same Supabase data.
