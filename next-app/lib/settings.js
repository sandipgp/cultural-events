'use client'
import { useCallback } from 'react'
import { useFestival } from './festivalContext.jsx'
import { useAdmin } from './admin.jsx'
import { apiUpdateFestival } from './festivalApi.js'
import { isPastDateLabel } from './deadline.js'

// Per-festival settings, stored on the festival row so each event has its own
// contest state, deadline and "over" status. Writes go through the server API
// (admin-authorized), then reload the context so the app reflects the change.

// Photo contest closed when: admin closed it, OR the submission deadline passed.
export function useContestOver() {
  const { festival, reload } = useFestival()
  const { password } = useAdmin()
  const open = festival?.contest_open ?? true
  const over = !open || isPastDateLabel(festival?.submission_deadline)

  const setContestOver = useCallback(
    async (val) => {
      if (!festival?.id) return
      await apiUpdateFestival(festival.id, { contest_open: !val }, password)
      reload()
    },
    [festival?.id, password, reload]
  )

  return { over, loading: !festival, setContestOver }
}

// Whole festival over? (dashboard shows only Participants + Winners)
export function useEventsOver() {
  const { festival, reload } = useFestival()
  const { password } = useAdmin()
  const over = festival?.status === 'over'

  const setEventsOver = useCallback(
    async (val) => {
      if (!festival?.id) return
      await apiUpdateFestival(festival.id, { status: val ? 'over' : 'active' }, password)
      reload()
    },
    [festival?.id, password, reload]
  )

  return { over, loading: !festival, setEventsOver }
}

// Last date to submit (the festival's submission deadline).
export function useLastDate() {
  const { festival, reload } = useFestival()
  const { password } = useAdmin()
  const label = festival?.submission_deadline || ''

  const setLastDate = useCallback(
    async (val) => {
      if (!festival?.id) return
      await apiUpdateFestival(festival.id, { submission_deadline: val }, password)
      reload()
    },
    [festival?.id, password, reload]
  )

  return { label, loading: !festival, setLastDate }
}
