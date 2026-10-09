'use client'
import { createContext, useCallback, useContext, useEffect, useState } from 'react'
import { supabase } from './supabaseClient.js'
import { DEFAULT_THEME, MODULE_DEFAULTS } from './festivalDefaults.js'

// Re-export so existing importers of these from festivalContext keep working.
export { DEFAULT_THEME, MODULE_DEFAULTS }

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
  if (theme.bg1) root.style.setProperty('--bg-grad-1', theme.bg1)
  if (theme.bg2) root.style.setProperty('--bg-grad-2', theme.bg2)
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
      {loading ? (
        <div className="splash">
          <div className="spinner" />
        </div>
      ) : (
        children
      )}
    </FestivalContext.Provider>
  )
}

export function useFestival() {
  const ctx = useContext(FestivalContext)
  return ctx || { festival: null, loading: true, reload: () => {} }
}

// Convenience accessors. Fallbacks are event-neutral so no specific event name
// flashes while the active festival is still loading on the client.
export function useFestivalMeta() {
  const { festival } = useFestival()
  return {
    name: festival?.name || 'Society Events',
    society: festival?.society_name || '',
    tagline: festival?.tagline || '',
    logo: festival?.logo || '🪔',
    footer: festival?.footer_text || '',
    heroShow: festival?.hero_show !== false,
    heroGradient: festival?.hero_gradient !== false,
    heroMediaUrl: festival?.hero_media_url || '',
    heroMediaShow: !!festival?.hero_media_show,
    modules: festival?.modules || {},
  }
}

// Resolved module config for the active festival (config merged over defaults).
export function useModules() {
  const { festival } = useFestival()
  const m = festival?.modules || {}
  return {
    rota: { ...MODULE_DEFAULTS.rota, ...(m.rota || {}) },
    participation: {
      ...MODULE_DEFAULTS.participation,
      ...(m.participation || {}),
      // `fields` is nested — deep-merge so partial overrides keep the defaults.
      fields: { ...MODULE_DEFAULTS.participation.fields, ...(m.participation?.fields || {}) },
    },
    contest: { ...MODULE_DEFAULTS.contest, ...(m.contest || {}) },
    schedule: { ...MODULE_DEFAULTS.schedule, ...(m.schedule || {}) },
  }
}
