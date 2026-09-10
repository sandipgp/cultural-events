// Best-effort "is this photo AI-generated / AI-filtered?" check using the
// Google Gemini API. NOTE: this is a general vision model's judgment, not a
// forensic detector — treat the result as a soft flag, not proof.
//
// The API key is read from VITE_GEMINI_API_KEY. Because this runs in the
// browser, that key is visible to users. For a small society contest that is
// usually acceptable; for anything sensitive, move this call behind a
// serverless proxy (see README).

const API_KEY = import.meta.env.VITE_GEMINI_API_KEY
const MODEL = import.meta.env.VITE_GEMINI_MODEL || 'gemini-2.5-flash'
const ENDPOINT = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`

// Master on/off switch from .env.local: VITE_AI_CHECK=1 runs the check,
// anything else (0, blank, unset) skips it entirely.
export const AI_CHECK_ENABLED = import.meta.env.VITE_AI_CHECK === '1'

const PROMPT = `You are validating a photo submitted to a home Ganpati (Lord
Ganesha) decoration photo contest. Judge two things:

1) isGanpati: true ONLY if the photo clearly shows a Ganpati / Lord Ganesha
   idol or a Ganpati festival decoration / setup (mandap, decorated shrine,
   etc.). Any unrelated photo (people, food, scenery, other gods, random
   objects) is false.
2) isAI: true if the photo looks AI-GENERATED or has HEAVY AI edits/filters
   (generative fill, AI beautify, face/scene synthesis, obviously synthetic
   art). Normal phone-camera processing, mild brightness/contrast and ordinary
   photo filters are NOT considered AI.

Respond ONLY with strict JSON in this exact shape:
{"isGanpati": boolean, "isAI": boolean, "confidence": number between 0 and 1, "reason": "short phrase"}`

function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result).split(',')[1]) // strip data: prefix
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

// Always resolves (never throws) so a failed check can't block a submission.
// `available: false` means the check couldn't run and the UI should ask the
// user to self-certify instead.
export async function detectAiPhoto(file) {
  // Fallbacks use isGanpati: true so a check that can't run never blocks anyone.
  if (!AI_CHECK_ENABLED) {
    return { skipped: true, available: false, isGanpati: true, isAI: false, confidence: 0, reason: 'AI check disabled.' }
  }
  if (!API_KEY) {
    return { available: false, isGanpati: true, isAI: false, confidence: 0, reason: 'No Gemini API key configured.' }
  }

  try {
    const data = await fileToBase64(file)
    const res = await fetch(`${ENDPOINT}?key=${API_KEY}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              { text: PROMPT },
              { inline_data: { mime_type: file.type, data } },
            ],
          },
        ],
        generationConfig: { responseMimeType: 'application/json', temperature: 0 },
      }),
    })

    if (!res.ok) {
      const body = await res.text()
      return { available: false, isGanpati: true, isAI: false, confidence: 0, reason: `Gemini error ${res.status}: ${body.slice(0, 120)}` }
    }

    const json = await res.json()
    const text = json?.candidates?.[0]?.content?.parts?.[0]?.text || '{}'
    const parsed = JSON.parse(text)
    return {
      available: true,
      isGanpati: parsed.isGanpati !== false, // default to true unless clearly false
      isAI: !!parsed.isAI,
      confidence: typeof parsed.confidence === 'number' ? parsed.confidence : null,
      reason: parsed.reason || '',
    }
  } catch (err) {
    return { available: false, isGanpati: true, isAI: false, confidence: 0, reason: err.message || 'AI check failed.' }
  }
}
