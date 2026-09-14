// Submission-deadline helpers. The date itself is now admin-managed (stored in
// app_settings; see settings.js). VITE_LAST_DATE / VITE_CONTEST_OVER remain
// only as initial defaults when nothing has been set in the database.
// Dates accept human ("15 Sep 2026") or ISO ("2026-09-15") formats.

// Env defaults / fallbacks.
export const LAST_DATE_LABEL = (import.meta.env.VITE_LAST_DATE || '').trim()
export const ENV_CONTEST_OVER = (import.meta.env.VITE_CONTEST_OVER || '').trim()

// True if `now` is past the END of the given day (local time). Blank/unparseable
// dates are treated as "not past" (never auto-close).
export function isPastDateLabel(label, now = new Date()) {
  if (!label) return false
  const d = new Date(label)
  if (isNaN(d.getTime())) return false
  d.setHours(23, 59, 59, 999)
  return now.getTime() > d.getTime()
}

// Friendly display, e.g. "17 Sep 2026". Returns the raw string if unparseable.
export function formatDateLabel(label) {
  if (!label) return ''
  const d = new Date(label)
  if (isNaN(d.getTime())) return label
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
}

// For a native <input type="date"> value (YYYY-MM-DD in local time).
export function toDateInputValue(label) {
  if (!label) return ''
  const d = new Date(label)
  if (isNaN(d.getTime())) return ''
  const local = new Date(d.getTime() - d.getTimezoneOffset() * 60000)
  return local.toISOString().slice(0, 10)
}
