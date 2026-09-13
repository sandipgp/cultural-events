import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../supabaseClient.js'
import { isContestOver as envContestOver } from './deadline.js'

// The photo contest "over" state, now stored in the DB so an admin can toggle
// it at runtime (instead of editing VITE_CONTEST_OVER and redeploying).
// If no DB value is set yet, we fall back to the env/date logic in deadline.js.
const KEY = 'photo_contest_over'

export function useContestOver() {
  const [over, setOver] = useState(envContestOver())
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    const { data } = await supabase
      .from('app_settings')
      .select('value')
      .eq('key', KEY)
      .maybeSingle()
    if (data && (data.value === '1' || data.value === '0')) {
      setOver(data.value === '1')
    } else {
      setOver(envContestOver())
    }
    setLoading(false)
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const setContestOver = useCallback(async (val) => {
    setOver(val) // optimistic
    const { error } = await supabase.from('app_settings').upsert(
      { key: KEY, value: val ? '1' : '0', updated_at: new Date().toISOString() },
      { onConflict: 'key' }
    )
    return error
  }, [])

  return { over, loading, setContestOver, reload: load }
}
