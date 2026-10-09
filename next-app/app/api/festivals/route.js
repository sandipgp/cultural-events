import { supabaseAdmin, isAuthorized } from '@/lib/supabaseServer.js'
import { DEFAULT_THEME, MODULE_DEFAULTS } from '@/lib/festivalDefaults.js'

export const runtime = 'nodejs'

const slugify = (s) =>
  (s || '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'event'

// Create a festival.
export async function POST(req) {
  if (!isAuthorized(req)) return Response.json({ error: 'Unauthorized' }, { status: 401 })
  let body
  try {
    body = await req.json()
  } catch {
    return Response.json({ error: 'Invalid body' }, { status: 400 })
  }
  const { name, society_name } = body || {}
  if (!name || !name.trim()) return Response.json({ error: 'Name required' }, { status: 400 })

  const slug = `${slugify(name)}-${Date.now().toString(36).slice(-4)}`
  const { data, error } = await supabaseAdmin
    .from('festivals')
    .insert({
      slug,
      name: name.trim(),
      society_name: society_name || '',
      status: 'active',
      theme: DEFAULT_THEME,
      logo: '🎉',
      modules: MODULE_DEFAULTS,
      contest_open: true,
    })
    .select()
    .maybeSingle()

  if (error) return Response.json({ error: error.message }, { status: 400 })
  return Response.json({ festival: data })
}

// Update a festival.
export async function PATCH(req) {
  if (!isAuthorized(req)) return Response.json({ error: 'Unauthorized' }, { status: 401 })
  let body
  try {
    body = await req.json()
  } catch {
    return Response.json({ error: 'Invalid body' }, { status: 400 })
  }
  const { id, patch } = body || {}
  if (!id || !patch) return Response.json({ error: 'id and patch required' }, { status: 400 })

  const { data, error } = await supabaseAdmin
    .from('festivals')
    .update({ ...patch, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .maybeSingle()

  if (error) return Response.json({ error: error.message }, { status: 400 })
  return Response.json({ festival: data })
}
