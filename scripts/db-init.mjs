// Applies the SQL setup files to your Supabase database.
// Run with:  npm run db:init
//
// Needs SUPABASE_DB_URL (a privileged Postgres connection string) — the app's
// anon key CANNOT create tables/policies. Get it from:
//   Supabase > Project Settings > Database > Connection string > URI
// Put it in .env.local (it is gitignored). Do NOT prefix it with VITE_ — that
// would leak it into the browser bundle. This is a server-side script only.

import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import pg from 'pg'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')

function getDbUrl() {
  if (process.env.SUPABASE_DB_URL) return process.env.SUPABASE_DB_URL
  try {
    const env = readFileSync(join(root, '.env.local'), 'utf8')
    const line = env
      .split('\n')
      .find((l) => l.trim().startsWith('SUPABASE_DB_URL='))
    if (line) return line.slice(line.indexOf('=') + 1).trim()
  } catch {
    /* no .env.local — fall through */
  }
  return null
}

const url = getDbUrl()
if (!url) {
  console.error(
    'Missing SUPABASE_DB_URL.\n' +
      'Add it to .env.local, from Supabase > Project Settings > Database >\n' +
      'Connection string > URI (the one with your DB password).'
  )
  process.exit(1)
}

// These are safe to re-run (create ... if not exists / drop policy if exists).
const files = ['supabase-setup.sql', 'supabase-events-setup.sql']

// Drop any sslmode/query params from the URL — newer pg reads sslmode=require
// as verify-full and rejects Supabase's cert chain. We set SSL explicitly below.
let cleanUrl = url
try {
  const u = new URL(url)
  u.search = ''
  cleanUrl = u.toString()
} catch {
  /* leave as-is if it doesn't parse */
}

const client = new pg.Client({
  connectionString: cleanUrl,
  ssl: { rejectUnauthorized: false }, // Supabase requires SSL; skip strict CA check
})

try {
  await client.connect()
  for (const f of files) {
    const sql = readFileSync(join(root, f), 'utf8')
    process.stdout.write(`→ Running ${f} … `)
    await client.query(sql)
    console.log('✓')
  }
  console.log('\n✅ Database initialized.')
} catch (err) {
  console.error(`\n❌ Failed: ${err.message}`)
  process.exitCode = 1
} finally {
  await client.end()
}
