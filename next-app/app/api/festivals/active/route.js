import { supabaseAdmin, isAuthorized } from '@/lib/supabaseServer.js'

export const runtime = 'nodejs'

// Set the currently active festival (pointer in app_settings).
export async function POST(req) {
  if (!isAuthorized(req)) return Response.json({ error: 'Unauthorized' }, { status: 401 })
  let body
  try {
    body = await req.json()
  } catch {
    return Response.json({ error: 'Invalid body' }, { status: 400 })
  }
  const { id } = body || {}
  if (!id) return Response.json({ error: 'id required' }, { status: 400 })

  const { error } = await supabaseAdmin
    .from('app_settings')
    .upsert(
      { key: 'active_festival_id', value: id, updated_at: new Date().toISOString() },
      { onConflict: 'key' }
    )

  if (error) return Response.json({ error: error.message }, { status: 400 })
  return Response.json({ ok: true })
}
