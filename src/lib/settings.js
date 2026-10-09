import { useCallback } from 'react'
import { supabase } from '../supabaseClient.js'
import { useFestival } from './festivalContext.jsx'
import { isPastDateLabel } from './deadline.js'

// Per-festival settings, stored on the festival row so each event has its own
// contest state, deadline and "over" status. Setters update the active
// festival and reload the context so the whole app reflects the change.

async function patchFestival(id, patch) {
  return supabase
    .from('festivals')
    .update({ ...patch, updated_at: new Date().toISOString() })
    .eq('id', id)
}

// Photo contest closed when: admin closed it, OR the submission deadline passed.
export function useContestOver() {
  const { festival, reload } = useFestival()
  const open = festival?.contest_open ?? true
  const over = !open || isPastDateLabel(festival?.submission_deadline)

  const setContestOver = useCallback(
    async (val) => {
      if (!festival?.id) return
      await patchFestival(festival.id, { contest_open: !val })
      reload()
    },
    [festival?.id, reload]
  )

  return { over, loading: !festival, setContestOver }
}

// Whole festival over? (dashboard shows only Participants + Winners)
export function useEventsOver() {
  const { festival, reload } = useFestival()
  const over = festival?.status === 'over'

  const setEventsOver = useCallback(
    async (val) => {
      if (!festival?.id) return
      await patchFestival(festival.id, { status: val ? 'over' : 'active' })
      reload()
    },
    [festival?.id, reload]
  )

  return { over, loading: !festival, setEventsOver }
}

// Last date to submit (the festival's submission deadline).
export function useLastDate() {
  const { festival, reload } = useFestival()
  const label = festival?.submission_deadline || ''

  const setLastDate = useCallback(
    async (val) => {
      if (!festival?.id) return
      await patchFestival(festival.id, { submission_deadline: val })
      reload()
    },
    [festival?.id, reload]
  )

  return { label, loading: !festival, setLastDate }
}
