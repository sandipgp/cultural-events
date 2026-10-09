// Client helpers for the admin festival API. `pw` is the admin password held
// by the AdminProvider after login; it's sent as the x-admin-pw header so the
// server can authorize the write.
async function call(url, method, body, pw) {
  const res = await fetch(url, {
    method,
    headers: { 'Content-Type': 'application/json', 'x-admin-pw': pw || '' },
    body: body ? JSON.stringify(body) : undefined,
  })
  const data = await res.json().catch(() => null)
  if (!res.ok) throw new Error(data?.error || `Request failed (${res.status})`)
  return data
}

export const apiCreateFestival = (data, pw) => call('/api/festivals', 'POST', data, pw)
export const apiUpdateFestival = (id, patch, pw) => call('/api/festivals', 'PATCH', { id, patch }, pw)
export const apiSetActiveFestival = (id, pw) => call('/api/festivals/active', 'POST', { id }, pw)
