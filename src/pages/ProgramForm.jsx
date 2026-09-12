import { useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../supabaseClient.js'
import { FLAT_LIST } from '../lib/flats.js'
import { PROGRAMS } from '../lib/festival.js'
import AppHeader from '../components/AppHeader.jsx'

const OTHER = 'Other'
const OPTIONS = [...PROGRAMS, OTHER]

export default function ProgramForm() {
  const [name, setName] = useState('')
  const [flat, setFlat] = useState('')
  const [events, setEvents] = useState([])
  const [otherText, setOtherText] = useState('')
  const [status, setStatus] = useState('idle') // idle | saving | done
  const [error, setError] = useState('')
  const [confirmOpen, setConfirmOpen] = useState(false)

  function toggleEvent(p) {
    setEvents((prev) =>
      prev.includes(p) ? prev.filter((x) => x !== p) : [...prev, p]
    )
  }

  // Replaces the "Other" marker with the typed custom program name.
  function resolvedEvents() {
    return events.flatMap((e) =>
      e === OTHER ? (otherText.trim() ? [otherText.trim()] : []) : [e]
    )
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    if (!name.trim()) return setError('Please enter your name.')
    if (!flat) return setError('Please select your flat.')
    if (events.length === 0) return setError('Pick at least one program.')
    if (events.includes(OTHER) && !otherText.trim())
      return setError('Please specify the other program.')

    const { data: existing, error: checkErr } = await supabase
      .from('program_participants')
      .select('id')
      .eq('flat_number', flat)
      .maybeSingle()
    if (checkErr) return setError(checkErr.message)
    if (existing) {
      setConfirmOpen(true)
      return
    }
    await save()
  }

  async function save() {
    setConfirmOpen(false)
    setStatus('saving')
    setError('')
    const { error } = await supabase.from('program_participants').upsert(
      {
        name: name.trim(),
        flat_number: flat,
        events: resolvedEvents(),
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'flat_number' }
    )
    if (error) {
      setStatus('idle')
      return setError(error.message)
    }
    setStatus('done')
  }

  if (status === 'done') {
    return (
      <div className="screen">
        <AppHeader />
        <div className="card thanks">
          <div className="thanks-mark">🎭</div>
          <h2>You're in!</h2>
          <p>
            Flat <strong>{flat}</strong> registered for{' '}
            <strong>{resolvedEvents().join(', ')}</strong>.
          </p>
          <Link className="btn" to="/program/list">
            View participants
          </Link>
          <Link className="btn ghost" to="/">
            Back to dashboard
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="screen">
      <AppHeader />

      <div className="intro card">
        <h2>Participate in Program</h2>
        <p>Choose the cultural programs you'd like to take part in. 🎉</p>
      </div>

      <form className="card form" onSubmit={handleSubmit}>
        <label className="field">
          <span>Your name</span>
          <input
            type="text"
            value={name}
            placeholder="e.g. Sandip Patil"
            onChange={(e) => setName(e.target.value)}
          />
        </label>

        <label className="field">
          <span>Flat number</span>
          <select value={flat} onChange={(e) => setFlat(e.target.value)}>
            <option value="">Select your flat…</option>
            {FLAT_LIST.map((f) => (
              <option key={f} value={f}>
                {f}
              </option>
            ))}
          </select>
        </label>

        <div className="field">
          <span>Programs (select one or more)</span>
          <div className="checks">
            {OPTIONS.map((p) => (
              <label key={p} className={`check ${events.includes(p) ? 'on' : ''}`}>
                <input
                  type="checkbox"
                  checked={events.includes(p)}
                  onChange={() => toggleEvent(p)}
                />
                {p}
              </label>
            ))}
          </div>
          {events.includes(OTHER) && (
            <input
              type="text"
              className="other-input"
              value={otherText}
              placeholder="Specify the program (e.g. Instrumental)"
              onChange={(e) => setOtherText(e.target.value)}
            />
          )}
        </div>

        {error && <p className="error">{error}</p>}

        <button className="btn" type="submit" disabled={status === 'saving'}>
          {status === 'saving' ? 'Saving…' : 'Register'}
        </button>

        <Link className="link-gallery" to="/program/list">
          View participants →
        </Link>
      </form>

      {confirmOpen && (
        <div className="modal-backdrop" onClick={() => setConfirmOpen(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h3>Update your entry?</h3>
            <p>
              Flat <strong>{flat}</strong> is already registered. This will
              <strong> replace</strong> it with {resolvedEvents().join(', ')}.
            </p>
            <div className="modal-actions">
              <button className="btn ghost" onClick={() => setConfirmOpen(false)}>
                Cancel
              </button>
              <button className="btn" onClick={save}>
                Yes, update
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
