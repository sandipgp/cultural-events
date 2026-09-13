import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../supabaseClient.js'
import { isContestOver as envContestOver } from './deadline.js'

// Admin-toggled boolean flags, stored in the app_settings table so they can be
// changed at runtime (no redeploy). Values are stored as '1' / '0'.

// Generic boolean setting hook.
export function useBoolSetting(key, fallback = false) {
  const [value, setValue] = useState(fallback)
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    const { data } = await supabase
      .from('app_settings')
      .select('value')
      .eq('key', key)
      .maybeSingle()
    if (data && (data.value === '1' || data.value === '0')) {
      setValue(data.value === '1')
    } else {
      setValue(fallback)
    }
    setLoading(false)
  }, [key, fallback])

  useEffect(() => {
    load()
  }, [load])

  const save = useCallback(
    async (val) => {
      setValue(val) // optimistic
      const { error } = await supabase.from('app_settings').upsert(
        { key, value: val ? '1' : '0', updated_at: new Date().toISOString() },
        { onConflict: 'key' }
      )
      return error
    },
    [key]
  )

  return { value, loading, setValue: save, reload: load }
}

// Photo contest open/closed. Falls back to the env/date logic when no DB value
// has been set yet.
export function useContestOver() {
  const [over, setOver] = useState(envContestOver())
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    const { data } = await supabase
      .from('app_settings')
      .select('value')
      .eq('key', 'photo_contest_over')
      .maybeSingle()
    if (data && (data.value === '1' || data.value === '0')) setOver(data.value === '1')
    else setOver(envContestOver())
    setLoading(false)
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const setContestOver = useCallback(async (val) => {
    setOver(val)
    const { error } = await supabase.from('app_settings').upsert(
      { key: 'photo_contest_over', value: val ? '1' : '0', updated_at: new Date().toISOString() },
      { onConflict: 'key' }
    )
    return error
  }, [])

  return { over, loading, setContestOver, reload: load }
}

// Whole festival over? When true the dashboard shows only "view participants"
// and the winners; everything else is greyed out.
export function useEventsOver() {
  const { value, loading, setValue } = useBoolSetting('events_over', false)
  return { over: value, loading, setEventsOver: setValue }
}
