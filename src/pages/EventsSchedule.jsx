import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../supabaseClient.js'
import { useAdmin } from '../lib/admin.jsx'
import { useFestival, useModules } from '../lib/festivalContext.jsx'
import AppHeader from '../components/AppHeader.jsx'
import AppFooter from '../components/AppFooter.jsx'

// Turn free-text time ("7:00 PM", "10 AM", "18:30") into minutes since midnight
// so events sort chronologically. Blank/unparseable times go last.
function timeToMinutes(t) {
  if (!t) return Number.MAX_SAFE_INTEGER
  const m = t.trim().toLowerCase().match(/(\d{1,2})(?::(\d{2}))?\s*(am|pm)?/)
  if (!m) return Number.MAX_SAFE_INTEGER
  let h = parseInt(m[1], 10)
  const min = m[2] ? parseInt(m[2], 10) : 0
  const ap = m[3]
  if (ap === 'pm' && h !== 12) h += 12
  if (ap === 'am' && h === 12) h = 0
  return h * 60 + min
}

export default function EventsSchedule() {
  const { isAdmin } = useAdmin()
  const { festival } = useFestival()
  const festivalId = festival?.id
  const { rota, schedule } = useModules()
  const dates = rota.dates
  const emptyDraft = () => ({ title: '', event_date: dates[0] || '', event_time: '', description: '' })
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [draft, setDraft] = useState(null) // add/edit form state ({...} or null)
  const [pendingDelete, setPendingDelete] = useState(null)
  const [busy, setBusy] = useState(false)

  async function load() {
    if (!festivalId) return
    setLoading(true)
    const { data, error } = await supabase
      .from('events')
      .select('*')
      .eq('festival_id', festivalId)
    if (error) setError(error.message)
    else {
      const sorted = (data || []).sort(
        (a, b) =>
          dates.indexOf(a.event_date) - dates.indexOf(b.event_date) ||
          timeToMinutes(a.event_time) - timeToMinutes(b.event_time)
      )
      setRows(sorted)
    }
    setLoading(false)
  }

  useEffect(() => {
    load()
  }, [festivalId])

  async function saveDraft() {
    if (!draft.title.trim()) return setError('Please enter a title.')
    setBusy(true)
    setError('')
    const payload = {
      title: draft.title.trim(),
      event_date: draft.event_date,
      event_time: draft.event_time.trim(),
      description: draft.description.trim(),
      updated_at: new Date().toISOString(),
    }
    const { error } = draft.id
      ? await supabase.from('events').update(payload).eq('id', draft.id)
      : await supabase.from('events').insert({ ...payload, festival_id: festivalId })
    setBusy(false)
    if (error) return setError(error.message)
    setDraft(null)
    load()
  }

  async function doDelete() {
    setBusy(true)
    const { error } = await supabase.from('events').delete().eq('id', pendingDelete.id)
    setBusy(false)
    if (error) return setError(error.message)
    setRows((prev) => prev.filter((r) => r.id !== pendingDelete.id))
    setPendingDelete(null)
  }

  return (
    <div className="screen">
      <AppHeader />

      <div className="page-bar">
        <Link className="btn ghost small" to="/">
          ← Dashboard
        </Link>
        {isAdmin && (
          <button className="btn small" onClick={() => setDraft(emptyDraft())}>
            + Add event
          </button>
        )}
        <span className="count">{rows.length} events</span>
      </div>

      <h2 className="page-title">{schedule.label}</h2>

      {error && <p className="error center">{error}</p>}
      {loading && <p className="muted center">Loading…</p>}
      {!loading && rows.length === 0 && (
        <p className="muted center">No events scheduled yet.</p>
      )}

      {!loading && rows.length > 0 && (
        <div className="table-wrap card">
          <table className="tbl">
            <thead>
              <tr>
                <th>When</th>
                <th>Event</th>
                {isAdmin && <th className="tbl-actions-col">Actions</th>}
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.id}>
                  <td>
                    <div className="when-badge">
                      <span className="when-date">{row.event_date}</span>
                      {row.event_time && <span className="when-time">{row.event_time}</span>}
                    </div>
                  </td>
                  <td>
                    <strong>{row.title}</strong>
                    {row.description && <p className="event-desc">{row.description}</p>}
                  </td>
                  {isAdmin && (
                    <td>
                      <div className="tbl-actions">
                        <button className="btn small ghost" onClick={() => setDraft({ ...row })}>
                          Edit
                        </button>
                        <button className="btn small danger" onClick={() => setPendingDelete(row)}>
                          Delete
                        </button>
                      </div>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Add / edit modal (admin) */}
      {draft && (
        <div className="modal-backdrop" onClick={() => !busy && setDraft(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h3>{draft.id ? 'Edit event' : 'Add event'}</h3>
            <label className="field">
              <span>Title</span>
              <input
                type="text"
                autoFocus
                value={draft.title}
                placeholder="e.g. Cultural Night"
                onChange={(e) => setDraft({ ...draft, title: e.target.value })}
              />
            </label>
            <label className="field">
              <span>Date</span>
              <select
                value={draft.event_date}
                onChange={(e) => setDraft({ ...draft, event_date: e.target.value })}
              >
                {dates.map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>
            </label>
            <label className="field">
              <span>Time</span>
              <input
                type="text"
                value={draft.event_time}
                placeholder="e.g. 7:00 PM"
                onChange={(e) => setDraft({ ...draft, event_time: e.target.value })}
              />
            </label>
            <label className="field">
              <span>Description (optional)</span>
              <textarea
                rows={3}
                value={draft.description}
                onChange={(e) => setDraft({ ...draft, description: e.target.value })}
              />
            </label>
            {error && <p className="error">{error}</p>}
            <div className="modal-actions">
              <button className="btn ghost" disabled={busy} onClick={() => setDraft(null)}>
                Cancel
              </button>
              <button className="btn" disabled={busy} onClick={saveDraft}>
                {busy ? 'Saving…' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      )}

      {pendingDelete && (
        <div className="modal-backdrop" onClick={() => !busy && setPendingDelete(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h3>Delete event?</h3>
            <p>
              Remove <strong>{pendingDelete.title}</strong>?
            </p>
            <div className="modal-actions">
              <button className="btn ghost" disabled={busy} onClick={() => setPendingDelete(null)}>
                Cancel
              </button>
              <button className="btn danger" disabled={busy} onClick={doDelete}>
                {busy ? 'Deleting…' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

      <AppFooter />
    </div>
  )
}
