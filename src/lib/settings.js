import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../supabaseClient.js'
import { LAST_DATE_LABEL as ENV_LAST_DATE, ENV_CONTEST_OVER, isPastDateLabel } from './deadline.js'

// Admin-toggled settings, stored in the app_settings table so they can change
// at runtime (no redeploy). Booleans are stored as '1' / '0'; others as text.

export function useBoolSetting(key, fallback = false) {
  const [value, setValue] = useState(fallback)
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    const { data } = await supabase
      .from('app_settings')
      .select('value')
      .eq('key', key)
      .maybeSingle()
    if (data && (data.value === '1' || data.value === '0')) setValue(data.value === '1')
    else setValue(fallback)
    setLoading(false)
  }, [key, fallback])

  useEffect(() => {
    load()
  }, [load])

  const save = useCallback(
    async (val) => {
      setValue(val)
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

export function useStringSetting(key, fallback = '') {
  const [value, setValue] = useState(fallback)
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    const { data } = await supabase
      .from('app_settings')
      .select('value')
      .eq('key', key)
      .maybeSingle()
    setValue(data?.value ?? fallback)
    setLoading(false)
  }, [key, fallback])

  useEffect(() => {
    load()
  }, [load])

  const save = useCallback(
    async (val) => {
      setValue(val)
      const { error } = await supabase.from('app_settings').upsert(
        { key, value: val, updated_at: new Date().toISOString() },
        { onConflict: 'key' }
      )
      return error
    },
    [key]
  )

  return { value, loading, setValue: save, reload: load }
}

// Last date to submit (admin-managed; defaults to the env value).
export function useLastDate() {
  const { value, loading, setValue } = useStringSetting('last_date', ENV_LAST_DATE)
  return { label: value, loading, setLastDate: setValue }
}

// Whole festival over? (dashboard greys out all but Participants + Winners)
export function useEventsOver() {
  const { value, loading, setValue } = useBoolSetting('events_over', false)
  return { over: value, loading, setEventsOver: setValue }
}

// Photo contest open/closed. Priority:
//   explicit DB toggle (photo_contest_over) > env flag > past the last date.
export function useContestOver() {
  const [over, setOver] = useState(false)
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    const { data } = await supabase
      .from('app_settings')
      .select('key,value')
      .in('key', ['photo_contest_over', 'last_date'])
    const map = Object.fromEntries((data || []).map((r) => [r.key, r.value]))

    if (map.photo_contest_over === '1' || map.photo_contest_over === '0') {
      setOver(map.photo_contest_over === '1')
    } else if (ENV_CONTEST_OVER === '1' || ENV_CONTEST_OVER === '0') {
      setOver(ENV_CONTEST_OVER === '1')
    } else {
      setOver(isPastDateLabel(map.last_date || ENV_LAST_DATE))
    }
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
