// Client helper: sends the photo to our server route, which runs the Gemini
// check with a server-only key. Always resolves (never throws) so a failed
// check can't block a submission. `available: false` => the UI asks the user to
// self-certify instead.

function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result).split(',')[1]) // strip data: prefix
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

export async function detectAiPhoto(file) {
  try {
    const dataBase64 = await fileToBase64(file)
    const res = await fetch('/api/ai-check', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ dataBase64, mimeType: file.type }),
    })
    if (!res.ok) {
      return { available: false, isGanpati: true, isAI: false, reason: `Request failed (${res.status}).` }
    }
    return await res.json()
  } catch (err) {
    return { available: false, isGanpati: true, isAI: false, reason: err.message || 'AI check failed.' }
  }
}
