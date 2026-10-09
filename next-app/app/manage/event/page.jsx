'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabaseClient.js'
import { useFestival, MODULE_DEFAULTS } from '@/lib/festivalContext.jsx'
import { useAdmin } from '@/lib/admin.jsx'
import {
  apiCreateFestival,
  apiUpdateFestival,
  apiSetActiveFestival,
} from '@/lib/festivalApi.js'
import AppHeader from '@/components/AppHeader.jsx'
import AppFooter from '@/components/AppFooter.jsx'
import AdminGate from '@/components/AdminGate.jsx'
import Switch from '@/components/Switch.jsx'

const csv = (arr) => (arr || []).join(', ')
const fromCsv = (s) => s.split(',').map((x) => x.trim()).filter(Boolean)

// Merge a festival's stored modules over the defaults so the editor always has
// every field to show.
function normalizeModules(m = {}) {
  const out = {}
  for (const key of Object.keys(MODULE_DEFAULTS)) {
    out[key] = { ...MODULE_DEFAULTS[key], ...(m[key] || {}) }
  }
  // `participation.fields` is nested — deep-merge so defaults are preserved.
  out.participation.fields = {
    ...MODULE_DEFAULTS.participation.fields,
    ...(m.participation?.fields || {}),
  }
  return out
}

function EventsAdmin() {
  const { festival: active, reload } = useFestival()
  const { password } = useAdmin()
  const [list, setList] = useState([])
  const [activeId, setActiveId] = useState(null)
  const [draft, setDraft] = useState(null) // festival being edited
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [newName, setNewName] = useState('')

  async function loadList() {
    const { data } = await supabase
      .from('festivals')
      .select('*')
      .order('created_at', { ascending: true })
    setList(data || [])
    const { data: s } = await supabase
      .from('app_settings')
      .select('value')
      .eq('key', 'active_festival_id')
      .maybeSingle()
    setActiveId(s?.value || null)
  }

  useEffect(() => {
    loadList()
  }, [active?.id])

  async function makeActive(id) {
    setBusy(true)
    setError('')
    try {
      await apiSetActiveFestival(id, password)
      setActiveId(id)
      reload() // repaint theme + reload the active festival everywhere
    } catch (err) {
      setError(err.message)
    }
    setBusy(false)
  }

  async function createEvent(e) {
    e.preventDefault()
    if (!newName.trim()) return
    setBusy(true)
    setError('')
    try {
      const { festival } = await apiCreateFestival(
        { name: newName.trim(), society_name: active?.society_name || '' },
        password
      )
      setNewName('')
      await loadList()
      setDraft({ ...festival, modules: normalizeModules(festival.modules) })
    } catch (err) {
      setError(err.message)
    }
    setBusy(false)
  }

  function editEvent(f) {
    setDraft({ ...f, modules: normalizeModules(f.modules) })
    setError('')
  }

  function setField(k, v) {
    setDraft((d) => ({ ...d, [k]: v }))
  }
  function setMod(mod, k, v) {
    setDraft((d) => ({ ...d, modules: { ...d.modules, [mod]: { ...d.modules[mod], [k]: v } } }))
  }
  // Toggle a participation form field's visibility (nested under .fields).
  function setFieldFlag(fieldKey, v) {
    setDraft((d) => ({
      ...d,
      modules: {
        ...d.modules,
        participation: {
          ...d.modules.participation,
          fields: { ...d.modules.participation.fields, [fieldKey]: v },
        },
      },
    }))
  }

  async function saveDraft() {
    setBusy(true)
    setError('')
    try {
      await apiUpdateFestival(
        draft.id,
        {
          name: draft.name.trim(),
          society_name: draft.society_name,
          tagline: draft.tagline,
          status: draft.status,
          modules: draft.modules,
          hero_show: draft.hero_show !== false,
          hero_gradient: draft.hero_gradient !== false,
          hero_media_url: (draft.hero_media_url || '').trim().replace(/\s/g, ''),
          hero_media_show: !!draft.hero_media_show,
          og_title: draft.og_title || null,
          og_description: draft.og_description || null,
          og_image: (draft.og_image || '').trim().replace(/\s/g, '') || null,
        },
        password
      )
      const wasActive = draft.id === active?.id
      setDraft(null)
      await loadList()
      if (wasActive) reload()
    } catch (err) {
      setError(err.message)
    }
    setBusy(false)
  }

  const m = draft?.modules || {}

  return (
    <div className="screen dash">
      <AppHeader title="Events" subtitle="Management area" />

      <div className="page-bar">
        <Link className="btn ghost small" href="/manage">
          ← Admin
        </Link>
      </div>

      <h2 className="page-title">Events</h2>

      {/* Existing events */}
      <div className="list">
        {list.map((f) => (
          <div className="lrow card" key={f.id}>
            <div className="lrow-main">
              <strong>{f.name}</strong>
              <span className="lrow-sub">
                {f.status}
                {f.id === activeId ? ' · active' : ''}
              </span>
            </div>
            <div className="lrow-actions">
              {f.id === activeId ? (
                <span className="chip active" style={{ alignSelf: 'center' }}>Active</span>
              ) : (
                <button className="btn small" disabled={busy} onClick={() => makeActive(f.id)}>
                  Make active
                </button>
              )}
              <button className="btn small ghost" onClick={() => editEvent(f)}>
                Edit
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Create new */}
      <form className="card form" onSubmit={createEvent}>
        <h3 className="card-title">Create a new event</h3>
        <div className="create-row">
          <input
            type="text"
            value={newName}
            placeholder="e.g. Navratri 2026"
            onChange={(e) => setNewName(e.target.value)}
          />
          <button className="btn" type="submit" disabled={busy}>
            Create
          </button>
        </div>
        <p className="modal-sub muted">
          Starts with default modules and theme — edit them below, then “Make
          active” to switch the app to it.
        </p>
      </form>

      {error && <p className="error center">{error}</p>}

      {/* Editor */}
      {draft && (
        <div className="card form">
          <h3 className="card-title">Edit — {draft.name}</h3>

          <div className="row-2">
            <label className="field">
              <span>Name</span>
              <input type="text" value={draft.name || ''} onChange={(e) => setField('name', e.target.value)} />
            </label>
            <label className="field">
              <span>Society</span>
              <input type="text" value={draft.society_name || ''} onChange={(e) => setField('society_name', e.target.value)} />
            </label>
          </div>
          <label className="field">
            <span>Tagline</span>
            <input type="text" value={draft.tagline || ''} onChange={(e) => setField('tagline', e.target.value)} />
          </label>
          <label className="field">
            <span>Status</span>
            <select value={draft.status || 'active'} onChange={(e) => setField('status', e.target.value)}>
              <option value="active">Active (ongoing)</option>
              <option value="over">Over</option>
              <option value="draft">Draft</option>
            </select>
          </label>

          {/* Main hero section */}
          <div className="mod-block">
            <div className="mod-head">
              <strong>Hero section (logo, name &amp; tagline)</strong>
              <Switch on={draft.hero_show !== false} onToggle={() => setField('hero_show', !(draft.hero_show !== false))} />
            </div>
            <p className="modal-sub muted">The top banner on the home page.</p>
            <label className="check-row">
              <input
                type="checkbox"
                checked={draft.hero_gradient !== false}
                onChange={(e) => setField('hero_gradient', e.target.checked)}
              />
              Show gradient background behind the hero
            </label>
          </div>

          {/* Secondary hero media */}
          <div className="mod-block">
            <div className="mod-head">
              <strong>Hero media (below the hero)</strong>
              <Switch on={!!draft.hero_media_show} onToggle={() => setField('hero_media_show', !draft.hero_media_show)} />
            </div>
            <label className="field"><span>Image or video URL</span>
              <input
                type="text"
                value={draft.hero_media_url || ''}
                placeholder="/navratri-banner.jpg or https://…/clip.mp4"
                onChange={(e) => setField('hero_media_url', e.target.value)}
              />
            </label>
            <p className="modal-sub muted">
              Shows under the hero when the switch is on. Use an image path/URL,
              or a direct video file (.mp4/.webm) which autoplays muted.
            </p>
          </div>

          {/* Social preview (OG tags) */}
          <div className="mod-block">
            <strong>Social preview (link sharing)</strong>
            <label className="field"><span>OG title</span>
              <input type="text" value={draft.og_title || ''} placeholder="Shown when the link is shared" onChange={(e) => setField('og_title', e.target.value)} />
            </label>
            <label className="field"><span>OG description</span>
              <textarea rows={2} value={draft.og_description || ''} onChange={(e) => setField('og_description', e.target.value)} />
            </label>
            <label className="field"><span>OG image (1200×630 recommended)</span>
              <input type="text" value={draft.og_image || ''} placeholder="/og-navratri.jpg" onChange={(e) => setField('og_image', e.target.value)} />
            </label>

            {/* Live preview of the share card */}
            <span className="og-preview-label">Preview</span>
            <div className="og-preview">
              <div className="og-preview-img">
                {draft.og_image?.trim() ? (
                  <img src={draft.og_image.trim()} alt="" />
                ) : (
                  <span className="og-ph">No image</span>
                )}
              </div>
              <div className="og-preview-body">
                <span className="og-preview-site">
                  {typeof window !== 'undefined' ? window.location.host : 'your-site'}
                </span>
                <strong className="og-preview-title">
                  {draft.og_title?.trim() ||
                    (draft.society_name ? `${draft.society_name} · ${draft.name}` : draft.name) ||
                    'Society Events'}
                </strong>
                <span className="og-preview-desc">
                  {draft.og_description?.trim() || draft.tagline || ''}
                </span>
              </div>
            </div>
          </div>

          {/* Rota module */}
          <div className="mod-block">
            <div className="mod-head">
              <strong>Activity rota</strong>
              <Switch on={!!m.rota?.enabled} onToggle={() => setMod('rota', 'enabled', !m.rota?.enabled)} />
            </div>
            <label className="field"><span>Label</span>
              <input type="text" value={m.rota?.label || ''} onChange={(e) => setMod('rota', 'label', e.target.value)} />
            </label>
            <label className="field"><span>Dates (comma-separated)</span>
              <input type="text" value={csv(m.rota?.dates)} onChange={(e) => setMod('rota', 'dates', fromCsv(e.target.value))} />
            </label>
            <label className="field"><span>Slots (comma-separated)</span>
              <input type="text" value={csv(m.rota?.slots)} onChange={(e) => setMod('rota', 'slots', fromCsv(e.target.value))} />
            </label>
          </div>

          {/* Participation module */}
          <div className="mod-block">
            <div className="mod-head">
              <strong>Program participation</strong>
              <Switch on={!!m.participation?.enabled} onToggle={() => setMod('participation', 'enabled', !m.participation?.enabled)} />
            </div>
            <label className="field"><span>Label</span>
              <input type="text" value={m.participation?.label || ''} onChange={(e) => setMod('participation', 'label', e.target.value)} />
            </label>
            <label className="field"><span>Categories (comma-separated)</span>
              <input type="text" value={csv(m.participation?.categories)} onChange={(e) => setMod('participation', 'categories', fromCsv(e.target.value))} />
            </label>
            <label className="field"><span>Age groups (comma-separated)</span>
              <input type="text" value={csv(m.participation?.ageGroups)} onChange={(e) => setMod('participation', 'ageGroups', fromCsv(e.target.value))} />
            </label>
            <label className="check-row">
              <input type="checkbox" checked={!!m.participation?.allowOther} onChange={(e) => setMod('participation', 'allowOther', e.target.checked)} />
              Allow an “Other” option
            </label>
            <label className="check-row">
              <input type="checkbox" checked={!!m.participation?.winners} onChange={(e) => setMod('participation', 'winners', e.target.checked)} />
              Enable winners
            </label>

            <div className="field"><span>Form fields to show</span>
              <div className="checks">
                <label className="check">
                  <input type="checkbox" checked={m.participation?.fields?.ageGroup !== false} onChange={(e) => setFieldFlag('ageGroup', e.target.checked)} />
                  Age group
                </label>
                <label className="check">
                  <input type="checkbox" checked={!!m.participation?.fields?.flat} onChange={(e) => setFieldFlag('flat', e.target.checked)} />
                  Flat number
                </label>
                <label className="check">
                  <input type="checkbox" checked={m.participation?.fields?.description !== false} onChange={(e) => setFieldFlag('description', e.target.checked)} />
                  Description
                </label>
              </div>
            </div>
          </div>

          {/* Contest module */}
          <div className="mod-block">
            <div className="mod-head">
              <strong>Photo/media contest</strong>
              <Switch on={!!m.contest?.enabled} onToggle={() => setMod('contest', 'enabled', !m.contest?.enabled)} />
            </div>
            <label className="field"><span>Label</span>
              <input type="text" value={m.contest?.label || ''} onChange={(e) => setMod('contest', 'label', e.target.value)} />
            </label>
            <label className="check-row">
              <input type="checkbox" checked={!!m.contest?.aiCheck} onChange={(e) => setMod('contest', 'aiCheck', e.target.checked)} />
              Run AI photo check
            </label>
          </div>

          {/* Schedule module */}
          <div className="mod-block">
            <div className="mod-head">
              <strong>Events schedule</strong>
              <Switch on={!!m.schedule?.enabled} onToggle={() => setMod('schedule', 'enabled', !m.schedule?.enabled)} />
            </div>
            <label className="field"><span>Label</span>
              <input type="text" value={m.schedule?.label || ''} onChange={(e) => setMod('schedule', 'label', e.target.value)} />
            </label>
          </div>

          <div className="modal-actions">
            <button className="btn ghost" disabled={busy} onClick={() => setDraft(null)}>
              Cancel
            </button>
            <button className="btn" disabled={busy} onClick={saveDraft}>
              {busy ? 'Saving…' : 'Save event'}
            </button>
          </div>
        </div>
      )}

      <AppFooter />
    </div>
  )
}

export default function ManageEvents() {
  return (
    <AdminGate>
      <EventsAdmin />
    </AdminGate>
  )
}
