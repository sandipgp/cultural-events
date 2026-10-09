import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../supabaseClient.js'
import {
  useFestival,
  MODULE_DEFAULTS,
  DEFAULT_THEME,
} from '../lib/festivalContext.jsx'
import AppHeader from '../components/AppHeader.jsx'
import AppFooter from '../components/AppFooter.jsx'
import AdminGate from '../components/AdminGate.jsx'
import Switch from '../components/Switch.jsx'

const csv = (arr) => (arr || []).join(', ')
const fromCsv = (s) => s.split(',').map((x) => x.trim()).filter(Boolean)
const slugify = (s) =>
  s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'event'

// Merge a festival's stored modules over the defaults so the editor always has
// every field to show.
function normalizeModules(m = {}) {
  const out = {}
  for (const key of Object.keys(MODULE_DEFAULTS)) {
    out[key] = { ...MODULE_DEFAULTS[key], ...(m[key] || {}) }
  }
  return out
}

function EventsAdmin() {
  const { festival: active, reload } = useFestival()
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
    await supabase
      .from('app_settings')
      .upsert({ key: 'active_festival_id', value: id, updated_at: new Date().toISOString() }, { onConflict: 'key' })
    setBusy(false)
    setActiveId(id)
    reload() // repaint theme + reload the active festival everywhere
  }

  async function createEvent(e) {
    e.preventDefault()
    if (!newName.trim()) return
    setBusy(true)
    setError('')
    const slug = `${slugify(newName)}-${Date.now().toString(36).slice(-4)}`
    const { data, error } = await supabase
      .from('festivals')
      .insert({
        slug,
        name: newName.trim(),
        society_name: active?.society_name || '',
        status: 'active',
        theme: DEFAULT_THEME,
        logo: '🎉',
        modules: MODULE_DEFAULTS,
        contest_open: true,
      })
      .select()
      .maybeSingle()
    setBusy(false)
    if (error) return setError(error.message)
    setNewName('')
    await loadList()
    setDraft({ ...data, modules: normalizeModules(data.modules) })
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

  async function saveDraft() {
    setBusy(true)
    setError('')
    const { error } = await supabase
      .from('festivals')
      .update({
        name: draft.name.trim(),
        society_name: draft.society_name,
        tagline: draft.tagline,
        status: draft.status,
        modules: draft.modules,
        updated_at: new Date().toISOString(),
      })
      .eq('id', draft.id)
    setBusy(false)
    if (error) return setError(error.message)
    setDraft(null)
    await loadList()
    if (draft.id === active?.id) reload()
  }

  const m = draft?.modules || {}

  return (
    <div className="screen dash">
      <AppHeader title="Events" subtitle="Management area" />

      <div className="page-bar">
        <Link className="btn ghost small" to="/manage">
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
        <div className="row-2">
          <label className="field">
            <span>Event name</span>
            <input
              type="text"
              value={newName}
              placeholder="e.g. Navratri 2026"
              onChange={(e) => setNewName(e.target.value)}
            />
          </label>
          <button className="btn" type="submit" disabled={busy} style={{ alignSelf: 'end' }}>
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
