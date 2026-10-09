// Verifies the admin password server-side. Prefers a server-only ADMIN_PASSWORD;
// falls back to NEXT_PUBLIC_ADMIN_P (transitional) so login keeps working before
// the secret is configured.
export const runtime = 'nodejs'

export async function POST(req) {
  let body
  try {
    body = await req.json()
  } catch {
    return Response.json({ ok: false }, { status: 400 })
  }
  const expected =
    process.env.ADMIN_PASSWORD || process.env.NEXT_PUBLIC_ADMIN_P || 'ganpati2026'
  return Response.json({ ok: body?.password === expected })
}
