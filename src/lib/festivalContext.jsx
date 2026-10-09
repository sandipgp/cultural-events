import { createContext, useCallback, useContext, useEffect, useState } from 'react'
import { supabase } from '../supabaseClient.js'
import {
  SOCIETY_NAME,
  FESTIVAL,
  AARTI_DATES,
  SLOTS,
  PROGRAMS,
  AGE_GROUPS,
} from './festival.js'

// Loads the currently active festival and exposes it app-wide, and repaints the
// theme (CSS variables) to match. Everything falls back to the existing Ganpati
// defaults so the app still renders while loading or if the table is empty.

const FestivalContext = createContext(null)

function applyTheme(theme) {
  if (!theme) return
  const root = document.documentElement
  if (theme.brand) root.style.setProperty('--brand', theme.brand)
  if (theme.brand2) root.style.setProperty('--brand-2', theme.brand2)
  if (theme.gold) root.style.setProperty('--gold', theme.gold)
}

export function FestivalProvider({ children }) {
  const [festival, setFestival] = useState(null)
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    // Which festival is active? (pointer stored in app_settings)
    const { data: setting } = await supabase
      .from('app_settings')
      .select('value')
      .eq('key', 'active_festival_id')
      .maybeSingle()

    let fest = null
    if (setting?.value) {
      const { data } = await supabase
        .from('festivals')
        .select('*')
        .eq('id', setting.value)
        .maybeSingle()
      fest = data
    }
    if (!fest) {
      // Fallback: the oldest festival, if any.
      const { data } = await supabase
        .from('festivals')
        .select('*')
        .order('created_at', { ascending: true })
        .limit(1)
        .maybeSingle()
      fest = data
    }

    setFestival(fest)
    applyTheme(fest?.theme)
    setLoading(false)
  }, [])

  useEffect(() => {
    load()
  }, [load])

  return (
    <FestivalContext.Provider value={{ festival, loading, reload: load }}>
      {children}
    </FestivalContext.Provider>
  )
}

export function useFestival() {
  const ctx = useContext(FestivalContext)
  return ctx || { festival: null, loading: true, reload: () => {} }
}

// Convenience accessors with sensible fallbacks to the legacy constants.
export function useFestivalMeta() {
  const { festival } = useFestival()
  return {
    name: festival?.name || FESTIVAL,
    society: festival?.society_name || SOCIETY_NAME,
    tagline: festival?.tagline || '',
    logo: festival?.logo || '/ganesh-logo.svg',
    modules: festival?.modules || {},
  }
}

// Default theme for a brand-new event (admin recolors it in /manage/theme).
export const DEFAULT_THEME = { brand: '#c026a3', brand2: '#f97316', gold: '#e0a920' }

// Default module config — used when a festival hasn't customised a module.
export const MODULE_DEFAULTS = {
  rota: { enabled: true, label: 'Aarti', dates: AARTI_DATES, slots: SLOTS },
  participation: {
    enabled: true,
    label: 'Cultural Programs',
    ageGroups: AGE_GROUPS,
    categories: PROGRAMS,
    allowOther: true,
    winners: true,
  },
  contest: { enabled: true, label: 'Photo Contest', aiCheck: false },
  schedule: { enabled: true, label: 'Events Schedule' },
}

// Resolved module config for the active festival (config merged over defaults).
export function useModules() {
  const { festival } = useFestival()
  const m = festival?.modules || {}
  return {
    rota: { ...MODULE_DEFAULTS.rota, ...(m.rota || {}) },
    participation: { ...MODULE_DEFAULTS.participation, ...(m.participation || {}) },
    contest: { ...MODULE_DEFAULTS.contest, ...(m.contest || {}) },
    schedule: { ...MODULE_DEFAULTS.schedule, ...(m.schedule || {}) },
  }
}
