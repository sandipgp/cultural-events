import { createClient } from '@supabase/supabase-js'

// Server-only Supabase client. Prefers the service-role key (full access,
// never exposed to the browser); falls back to the anon key until the
// service key is configured. NEVER import this into a client component.
const url = process.env.NEXT_PUBLIC_SUPABASE_URL
const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

export const supabaseAdmin = createClient(url || '', key || '', {
  auth: { persistSession: false },
})

export const usingServiceKey = !!process.env.SUPABASE_SERVICE_ROLE_KEY

// Verifies an admin request. If ADMIN_PASSWORD is set on the server, the
// x-admin-pw header must match it; otherwise falls back to NEXT_PUBLIC_ADMIN_P
// (transitional) so things keep working before the secret is configured.
export function isAuthorized(req) {
  const expected = process.env.ADMIN_PASSWORD || process.env.NEXT_PUBLIC_ADMIN_P
  if (!expected) return true
  return req.headers.get('x-admin-pw') === expected
}
