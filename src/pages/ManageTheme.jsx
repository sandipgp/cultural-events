import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../supabaseClient.js'
import { useFestival, DEFAULT_THEME } from '../lib/festivalContext.jsx'
import AppHeader from '../components/AppHeader.jsx'
import AppFooter from '../components/AppFooter.jsx'
import AdminGate from '../components/AdminGate.jsx'

function applyPreview(theme) {
  const r = document.documentElement
  if (theme.brand) r.style.setProperty('--brand', theme.brand)
  if (theme.brand2) r.style.setProperty('--brand-2', theme.brand2)
  if (theme.gold) r.style.setProperty('--gold', theme.gold)
}

function ThemeAdmin() {
  const { festival, reload } = useFestival()
  const [draft, setDraft] = useState(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [saved, setSaved] = useState(false)

  // Seed the draft from the active festival once it loads.
  useEffect(() => {
    if (festival && !draft) {
      setDraft({
        name: festival.name || '',
        society_name: festival.society_name || '',
        tagline: festival.tagline || '',
        logo: festival.logo || '🪔',
        theme: { ...DEFAULT_THEME, ...(festival.theme || {}) },
      })
    }
  }, [festival, draft])

  // Revert any unsaved live-preview colors when leaving the page.
  useEffect(() => {
    return () => reload()
  }, [reload])

  if (!draft) {
    return (
      <div className="screen">
        <AppHeader title="Theme" subtitle="Management area" />
        <p className="muted center">Loading…</p>
      </div>
    )
  }

  function setColor(key, val) {
    const theme = { ...draft.theme, [key]: val }
    setDraft({ ...draft, theme })
    applyPreview(theme) // instant preview
    setSaved(false)
  }

  async function save() {
    if (!festival?.id) return
    setBusy(true)
    setError('')
    const { error } = await supabase
      .from('festivals')
      .update({
        name: draft.name.trim(),
        society_name: draft.society_name.trim(),
        tagline: draft.tagline.trim(),
        logo: draft.logo.trim(),
        theme: draft.theme,
        updated_at: new Date().toISOString(),
      })
      .eq('id', festival.id)
    setBusy(false)
    if (error) return setError(error.message)
    setSaved(true)
    reload()
  }

  const COLORS = [
    { key: 'brand', label: 'Primary' },
    { key: 'brand2', label: 'Accent' },
    { key: 'gold', label: 'Highlight' },
  ]

  return (
    <div className="screen">
      <AppHeader title="Theme" subtitle="Management area" />

      <div className="page-bar">
        <Link className="btn ghost small" to="/manage">
          ← Admin
        </Link>
      </div>

      <h2 className="page-title">Theme &amp; branding</h2>

      <div className="card form">
        <label className="field">
          <span>Event name</span>
          <input type="text" value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} />
        </label>
        <label className="field">
          <span>Society name</span>
          <input type="text" value={draft.society_name} onChange={(e) => setDraft({ ...draft, society_name: e.target.value })} />
        </label>
        <label className="field">
          <span>Tagline</span>
          <input type="text" value={draft.tagline} onChange={(e) => setDraft({ ...draft, tagline: e.target.value })} />
        </label>
        <label className="field">
          <span>Logo (image path like /ganesh-logo.svg, or an emoji)</span>
          <input type="text" value={draft.logo} onChange={(e) => setDraft({ ...draft, logo: e.target.value })} />
        </label>

        <div className="field">
          <span>Colors (preview updates live)</span>
          <div className="color-row">
            {COLORS.map((c) => (
              <label key={c.key} className="color-pick">
                <input
                  type="color"
                  value={draft.theme[c.key] || '#000000'}
                  onChange={(e) => setColor(c.key, e.target.value)}
                />
                <span>{c.label}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Live sample */}
        <div className="theme-sample">
          <span className="badge winner-badge">Highlight</span>
          <button type="button" className="btn small">Primary button</button>
          <span className="chip active">Accent</span>
        </div>

        {error && <p className="error">{error}</p>}
        {saved && <p className="muted">Saved ✓</p>}

        <button className="btn" disabled={busy} onClick={save}>
          {busy ? 'Saving…' : 'Save theme'}
        </button>
      </div>

      <AppFooter />
    </div>
  )
}

export default function ManageTheme() {
  return (
    <AdminGate>
      <ThemeAdmin />
    </AdminGate>
  )
}
