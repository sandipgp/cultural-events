// Submission deadline, driven by VITE_LAST_DATE in .env.local.
// Accepts human dates like "15 September 2026" or ISO "2026-09-15".
// Submissions stay OPEN through the END of that day (local time) and close
// after it — so the last date is genuinely the last day you can submit.

const RAW = (import.meta.env.VITE_LAST_DATE || '').trim()

// The label we show in the UI (kept exactly as typed in the env file).
export const LAST_DATE_LABEL = RAW

function parseDeadlineEnd(raw) {
  if (!raw) return null
  const d = new Date(raw)
  if (isNaN(d.getTime())) return null
  d.setHours(23, 59, 59, 999) // end of the deadline day, local time
  return d
}

// null when no valid date is configured (then submissions never auto-close).
export const DEADLINE_END = parseDeadlineEnd(RAW)

export function isSubmissionClosed(now = new Date()) {
  if (!DEADLINE_END) return false
  return now.getTime() > DEADLINE_END.getTime()
}

// Manual master switch from .env.local: VITE_CONTEST_OVER
//   "1" -> contest is over (submissions closed, winners shown)
//   "0" -> force open (submissions open, winners hidden), ignoring the date
//   unset/other -> fall back to the deadline date above
const CONTEST_OVER_FLAG = (import.meta.env.VITE_CONTEST_OVER || '').trim()

export function isContestOver(now = new Date()) {
  if (CONTEST_OVER_FLAG === '1') return true
  if (CONTEST_OVER_FLAG === '0') return false
  return isSubmissionClosed(now)
}
