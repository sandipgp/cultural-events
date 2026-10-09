// Server-side Gemini photo check. The API key stays on the server (GEMINI_API_KEY,
// NOT prefixed with NEXT_PUBLIC), so it never reaches the browser.
export const runtime = 'nodejs'

const PROMPT = `You are validating a photo submitted to a home decoration /
cultural contest. Judge two things:
1) isGanpati: true ONLY if the photo clearly shows the expected subject for a
   Ganpati / Lord Ganesha decoration contest (idol or festival decoration).
   Unrelated photos (people, food, scenery, random objects) are false.
2) isAI: true if the photo looks AI-GENERATED or has HEAVY AI edits/filters.
   Normal phone-camera processing and ordinary photo filters are NOT AI.
Respond ONLY with strict JSON:
{"isGanpati": boolean, "isAI": boolean, "confidence": number between 0 and 1, "reason": "short phrase"}`

function result(extra) {
  return Response.json({ available: false, isGanpati: true, isAI: false, confidence: 0, reason: '', ...extra })
}

export async function POST(req) {
  const key = process.env.GEMINI_API_KEY
  if (!key) return result({ reason: 'AI check not configured on the server.' })

  let body
  try {
    body = await req.json()
  } catch {
    return result({ reason: 'Invalid request body.' })
  }
  const { dataBase64, mimeType } = body || {}
  if (!dataBase64) return result({ reason: 'No image provided.' })

  const model = process.env.GEMINI_MODEL || 'gemini-2.5-flash'
  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${key}`

  try {
    const res = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [
          { parts: [{ text: PROMPT }, { inline_data: { mime_type: mimeType || 'image/jpeg', data: dataBase64 } }] },
        ],
        generationConfig: { responseMimeType: 'application/json', temperature: 0 },
      }),
    })
    if (!res.ok) {
      const t = await res.text()
      return result({ reason: `Gemini error ${res.status}: ${t.slice(0, 120)}` })
    }
    const json = await res.json()
    const text = json?.candidates?.[0]?.content?.parts?.[0]?.text || '{}'
    const parsed = JSON.parse(text)
    return Response.json({
      available: true,
      isGanpati: parsed.isGanpati !== false,
      isAI: !!parsed.isAI,
      confidence: typeof parsed.confidence === 'number' ? parsed.confidence : null,
      reason: parsed.reason || '',
    })
  } catch (err) {
    return result({ reason: err.message || 'AI check failed.' })
  }
}
