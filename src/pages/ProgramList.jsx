import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../supabaseClient.js'
import { PROGRAMS } from '../lib/festival.js'
import { useAdmin } from '../lib/admin.jsx'
import AppHeader from '../components/AppHeader.jsx'

export default function ProgramList() {
  const { isAdmin } = useAdmin()
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [filter, setFilter] = useState('All')
  const [editing, setEditing] = useState(null)
  const [pendingDelete, setPendingDelete] = useState(null)
  const [busy, setBusy] = useState(false)

  async function load() {
    setLoading(true)
    const { data, error } = await supabase
      .from('program_participants')
      .select('*')
      .order('flat_number', { ascending: true })
    if (error) setError(error.message)
    else setRows(data || [])
    setLoading(false)
  }

  useEffect(() => {
    load()
  }, [])

  const shown =
    filter === 'All' ? rows : rows.filter((r) => (r.events || []).includes(filter))

  function toggleEditEvent(p) {
    setEditing((cur) => {
      const has = cur.events.includes(p)
      return { ...cur, events: has ? cur.events.filter((x) => x !== p) : [...cur.events, p] }
    })
  }

  async function saveEdit() {
    if (editing.events.length === 0) return setError('Pick at least one program.')
    setBusy(true)
    const { error } = await supabase
      .from('program_participants')
      .update({
        name: editing.name.trim(),
        events: editing.events,
        updated_at: new Date().toISOString(),
      })
      .eq('id', editing.id)
    setBusy(false)
    if (error) return setError(error.message)
    setEditing(null)
    load()
  }

  async function doDelete() {
    setBusy(true)
    const { error } = await supabase
      .from('program_participants')
      .delete()
      .eq('id', pendingDelete.id)
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
        <Link className="btn ghost small" to="/program">
          + Register
        </Link>
        <span className="count">{shown.length} shown</span>
      </div>

      <h2 className="page-title">Program Participants</h2>

      <div className="filters">
        {['All', ...PROGRAMS].map((f) => (
          <button
            key={f}
            className={`chip ${filter === f ? 'active' : ''}`}
            onClick={() => setFilter(f)}
          >
            {f}
          </button>
        ))}
      </div>

      {error && <p className="error center">{error}</p>}
      {loading && <p className="muted center">Loading…</p>}
      {!loading && shown.length === 0 && (
        <p className="muted center">No participants yet.</p>
      )}

      {!loading && shown.length > 0 && (
        <div className="table-wrap card">
          <table className="tbl">
            <thead>
              <tr>
                <th>Flat</th>
                <th>Name</th>
                <th>Programs</th>
                {isAdmin && <th className="tbl-actions-col">Actions</th>}
              </tr>
            </thead>
            <tbody>
              {shown.map((row) => (
                <tr key={row.id}>
                  <td className="tbl-flat">{row.flat_number}</td>
                  <td>{row.name}</td>
                  <td>
                    <div className="tbl-chips">
                      {(row.events || []).map((e) => (
                        <span className="chip" key={e}>
                          {e}
                        </span>
                      ))}
                    </div>
                  </td>
                  {isAdmin && (
                    <td>
                      <div className="tbl-actions">
                        <button
                          className="btn small ghost"
                          onClick={() => setEditing({ ...row, events: [...(row.events || [])] })}
                        >
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

      {editing && (
        <div className="modal-backdrop" onClick={() => !busy && setEditing(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h3>Edit — Flat {editing.flat_number}</h3>
            <label className="field">
              <span>Name</span>
              <input
                type="text"
                value={editing.name}
                onChange={(e) => setEditing({ ...editing, name: e.target.value })}
              />
            </label>
            <div className="field">
              <span>Programs</span>
              <div className="checks">
                {PROGRAMS.map((p) => (
                  <label key={p} className={`check ${editing.events.includes(p) ? 'on' : ''}`}>
                    <input
                      type="checkbox"
                      checked={editing.events.includes(p)}
                      onChange={() => toggleEditEvent(p)}
                    />
                    {p}
                  </label>
                ))}
              </div>
            </div>
            <div className="modal-actions">
              <button className="btn ghost" disabled={busy} onClick={() => setEditing(null)}>
                Cancel
              </button>
              <button className="btn" disabled={busy} onClick={saveEdit}>
                {busy ? 'Saving…' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      )}

      {pendingDelete && (
        <div className="modal-backdrop" onClick={() => !busy && setPendingDelete(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h3>Remove participant?</h3>
            <p>
              Remove <strong>{pendingDelete.name}</strong> (Flat{' '}
              {pendingDelete.flat_number})?
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
    </div>
  )
}
