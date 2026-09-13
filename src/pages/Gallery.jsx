import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase, PHOTO_BUCKET } from '../supabaseClient.js'
import { useContestOver } from '../lib/settings.js'
import { useAdmin } from '../lib/admin.jsx'
import AppHeader from '../components/AppHeader.jsx'

export default function Gallery() {
  const { isAdmin } = useAdmin()
  const { over: contestOver, setContestOver } = useContestOver()
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [pendingDelete, setPendingDelete] = useState(null) // row awaiting delete confirm
  const [removing, setRemoving] = useState(false)

  async function load() {
    setLoading(true)
    const { data, error } = await supabase
      .from('submissions')
      .select('*')
      .order('is_winner', { ascending: false })
      .order('created_at', { ascending: true })
    if (error) setError(error.message)
    else setRows(data || [])
    setLoading(false)
  }

  useEffect(() => {
    load()
  }, [])

  async function toggleWinner(row) {
    const next = !row.is_winner
    // Optimistic update for snappy feel.
    setRows((prev) =>
      prev.map((r) => (r.id === row.id ? { ...r, is_winner: next } : r))
    )
    const { error } = await supabase
      .from('submissions')
      .update({ is_winner: next })
      .eq('id', row.id)
    if (error) {
      setError(error.message)
      load() // roll back to server truth
    }
  }

  async function removePhoto(row) {
    setRemoving(true)
    setError('')
    // Delete the DB row first, then the storage object.
    const { error: rowErr } = await supabase
      .from('submissions')
      .delete()
      .eq('id', row.id)
    if (rowErr) {
      setError(rowErr.message)
      setRemoving(false)
      return
    }
    if (row.photo_path) {
      await supabase.storage.from(PHOTO_BUCKET).remove([row.photo_path])
      // Ignore storage errors: the entry is already gone from the contest.
    }
    setRows((prev) => prev.filter((r) => r.id !== row.id))
    setRemoving(false)
    setPendingDelete(null)
  }

  return (
    <div className="screen wide">
      <AppHeader title="Photo Gallery" />

      <div className="gallery-bar">
        <Link className="btn ghost small" to="/">
          ← Add photo
        </Link>
        {contestOver && (
          <Link className="btn ghost small" to="/winners">
            🏆 Winners
          </Link>
        )}
        {isAdmin && (
          <button
            className={`btn small ${contestOver ? '' : 'danger'}`}
            onClick={() => setContestOver(!contestOver)}
            title={contestOver ? 'Reopen submissions' : 'Close the photo contest'}
          >
            {contestOver ? 'Reopen contest' : 'Close contest'}
          </button>
        )}
        <span className="count">{rows.length} entries</span>
      </div>

      {error && <p className="error center">{error}</p>}
      {loading && <p className="muted center">Loading…</p>}
      {!loading && rows.length === 0 && (
        <p className="muted center">No photos yet. Be the first to submit!</p>
      )}

      <div className="grid">
        {rows.map((row) => (
          <div className={`gcard ${row.is_winner ? 'winner' : ''}`} key={row.id}>
            <div className="gcard-media">
              <img
                src={`${row.photo_url}?v=${encodeURIComponent(row.updated_at || '')}`}
                alt={`Ganpati by ${row.name}`}
                loading="lazy"
              />
              <div className="gcard-badges">
                {row.is_winner && <span className="badge winner-badge">🏆 Winner</span>}
                {row.is_ai && (
                  <span className="badge ai-badge" title="Flagged as AI-generated / AI-filtered">
                    🤖 AI
                  </span>
                )}
              </div>
              <a
                className="view-btn"
                href={row.photo_url}
                target="_blank"
                rel="noopener noreferrer"
                title="Open photo in a new tab"
                aria-label="Open photo in a new tab"
              >
                ⤢
              </a>
              <div className="gcard-strip">
                <strong className="gcard-name">{row.name}</strong>
                <span className="gcard-flat">Flat {row.flat_number}</span>
              </div>
            </div>
            {isAdmin && (
              <div className="gcard-admin">
                <button
                  className={`btn small ${row.is_winner ? 'ghost' : ''}`}
                  onClick={() => toggleWinner(row)}
                >
                  {row.is_winner ? 'Remove winner' : 'Set winner 🏆'}
                </button>
                <button
                  className="btn small danger"
                  onClick={() => setPendingDelete(row)}
                  title="Remove this photo from the contest"
                >
                  Remove
                </button>
              </div>
            )}
          </div>
        ))}
      </div>

      <p className="foot">Ganpati Bappa Morya 🌺</p>

      {pendingDelete && (
        <div className="modal-backdrop" onClick={() => !removing && setPendingDelete(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h3>Remove from contest?</h3>
            <p>
              This permanently deletes <strong>{pendingDelete.name}</strong>'s
              photo (Flat <strong>{pendingDelete.flat_number}</strong>). This
              can't be undone.
            </p>
            <div className="modal-actions">
              <button
                className="btn ghost"
                disabled={removing}
                onClick={() => setPendingDelete(null)}
              >
                Cancel
              </button>
              <button
                className="btn danger"
                disabled={removing}
                onClick={() => removePhoto(pendingDelete)}
              >
                {removing ? 'Removing…' : 'Yes, remove'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
