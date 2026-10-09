'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useFestival, DEFAULT_THEME } from '@/lib/festivalContext.jsx'
import { useAdmin } from '@/lib/admin.jsx'
import { apiUpdateFestival } from '@/lib/festivalApi.js'
import AppHeader from '@/components/AppHeader.jsx'
import AppFooter from '@/components/AppFooter.jsx'
import AdminGate from '@/components/AdminGate.jsx'

function applyPreview(theme) {
  const r = document.documentElement
  if (theme.brand) r.style.setProperty('--brand', theme.brand)
  if (theme.brand2) r.style.setProperty('--brand-2', theme.brand2)
  if (theme.gold) r.style.setProperty('--gold', theme.gold)
  if (theme.bg1) r.style.setProperty('--bg-grad-1', theme.bg1)
  if (theme.bg2) r.style.setProperty('--bg-grad-2', theme.bg2)
}

function ThemeAdmin() {
  const { festival, reload } = useFestival()
  const { password } = useAdmin()
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
        footer_text: festival.footer_text || '',
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
    try {
      await apiUpdateFestival(
        festival.id,
        {
          name: draft.name.trim(),
          society_name: draft.society_name.trim(),
          tagline: draft.tagline.trim(),
          // Image paths must have no spaces; collapse any the admin typed.
          logo: draft.logo.trim().startsWith('/')
            ? draft.logo.trim().replace(/\s+/g, '')
            : draft.logo.trim(),
          footer_text: draft.footer_text.trim(),
          theme: draft.theme,
        },
        password
      )
      setSaved(true)
      reload()
    } catch (err) {
      setError(err.message)
    }
    setBusy(false)
  }

  const COLORS = [
    { key: 'brand', label: 'Primary' },
    { key: 'brand2', label: 'Accent' },
    { key: 'gold', label: 'Highlight' },
    { key: 'bg1', label: 'Background top' },
    { key: 'bg2', label: 'Background bottom' },
  ]

  return (
    <div className="screen">
      <AppHeader title="Theme" subtitle="Management area" />

      <div className="page-bar">
        <Link className="btn ghost small" href="/manage">
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
        <label className="field">
          <span>Footer text</span>
          <input
            type="text"
            value={draft.footer_text}
            placeholder="e.g. Ganpati Bappa Morya 🌺"
            onChange={(e) => setDraft({ ...draft, footer_text: e.target.value })}
          />
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
