import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../supabaseClient.js'
import { AARTI_DATES, SLOTS, dateIndex, slotIndex } from '../lib/festival.js'
import { useAdmin } from '../lib/admin.jsx'
import AppHeader from '../components/AppHeader.jsx'

export default function AartiList() {
  const { isAdmin } = useAdmin()
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [editing, setEditing] = useState(null) // row being edited
  const [pendingDelete, setPendingDelete] = useState(null)
  const [busy, setBusy] = useState(false)

  async function load() {
    setLoading(true)
    const { data, error } = await supabase.from('aarti_schedule').select('*')
    if (error) setError(error.message)
    else {
      const sorted = (data || []).sort(
        (a, b) =>
          dateIndex(a.aarti_date) - dateIndex(b.aarti_date) ||
          slotIndex(a.slot) - slotIndex(b.slot) ||
          a.flat_number.localeCompare(b.flat_number)
      )
      setRows(sorted)
    }
    setLoading(false)
  }

  useEffect(() => {
    load()
  }, [])

  async function saveEdit() {
    setBusy(true)
    const { error } = await supabase
      .from('aarti_schedule')
      .update({
        name: editing.name.trim(),
        aarti_date: editing.aarti_date,
        slot: editing.slot,
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
      .from('aarti_schedule')
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
        <Link className="btn ghost small" to="/aarti">
          + Book Aarti
        </Link>
        <span className="count">{rows.length} booked</span>
      </div>

      <h2 className="page-title">Aarti Schedule</h2>

      {error && <p className="error center">{error}</p>}
      {loading && <p className="muted center">Loading…</p>}
      {!loading && rows.length === 0 && (
        <p className="muted center">No Aarti booked yet.</p>
      )}

      {!loading && rows.length > 0 && (
        <div className="table-wrap card">
          <table className="tbl">
            <thead>
              <tr>
                <th>Flat</th>
                <th>Name</th>
                <th>Date &amp; Slot</th>
                {isAdmin && <th className="tbl-actions-col">Actions</th>}
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.id}>
                  <td className="tbl-flat">{row.flat_number}</td>
                  <td>{row.name}</td>
                  <td>
                    <div className="tbl-slot">
                      <span>{row.aarti_date}</span>
                      <span className={`chip ${row.slot === 'Evening' ? 'alt' : ''}`}>
                        {row.slot}
                      </span>
                    </div>
                  </td>
                  {isAdmin && (
                    <td>
                      <div className="tbl-actions">
                        <button className="btn small ghost" onClick={() => setEditing({ ...row })}>
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

      {!isAdmin && rows.length > 0 && (
        <p className="foot">
          To change your own booking, just{' '}
          <Link to="/aarti">book again</Link> for your flat.
        </p>
      )}

      {/* Admin: edit modal */}
      {editing && (
        <div className="modal-backdrop" onClick={() => !busy && setEditing(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h3>Edit Aarti — Flat {editing.flat_number}</h3>
            <label className="field">
              <span>Name</span>
              <input
                type="text"
                value={editing.name}
                onChange={(e) => setEditing({ ...editing, name: e.target.value })}
              />
            </label>
            <label className="field">
              <span>Date</span>
              <select
                value={editing.aarti_date}
                onChange={(e) => setEditing({ ...editing, aarti_date: e.target.value })}
              >
                {AARTI_DATES.map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>
            </label>
            <label className="field">
              <span>Slot</span>
              <select
                value={editing.slot}
                onChange={(e) => setEditing({ ...editing, slot: e.target.value })}
              >
                {SLOTS.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </label>
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

      {/* Admin: delete confirm */}
      {pendingDelete && (
        <div className="modal-backdrop" onClick={() => !busy && setPendingDelete(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h3>Delete booking?</h3>
            <p>
              Remove <strong>{pendingDelete.name}</strong>'s Aarti (Flat{' '}
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
