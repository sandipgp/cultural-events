import { useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../supabaseClient.js'
import { FLAT_LIST } from '../lib/flats.js'
import { AARTI_DATES, SLOTS } from '../lib/festival.js'
import AppHeader from '../components/AppHeader.jsx'

export default function AartiForm() {
  const [name, setName] = useState('')
  const [flat, setFlat] = useState('')
  const [date, setDate] = useState('')
  const [slot, setSlot] = useState('')
  const [status, setStatus] = useState('idle') // idle | saving | done
  const [error, setError] = useState('')
  const [confirmOpen, setConfirmOpen] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    if (!name.trim()) return setError('Please enter your name.')
    if (!flat) return setError('Please select your flat.')
    if (!date) return setError('Please select a date.')
    if (!slot) return setError('Please select a slot.')

    // One Aarti booking per flat — if it exists, confirm the override.
    const { data: existing, error: checkErr } = await supabase
      .from('aarti_schedule')
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
    const { error } = await supabase.from('aarti_schedule').upsert(
      {
        name: name.trim(),
        flat_number: flat,
        aarti_date: date,
        slot,
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
          <div className="thanks-mark">🪔</div>
          <h2>Aarti booked!</h2>
          <p>
            Flat <strong>{flat}</strong> — <strong>{date}</strong>,{' '}
            <strong>{slot}</strong>. Thank you!
          </p>
          <Link className="btn" to="/aarti/list">
            View Aarti schedule
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
        <h2>Schedule Aarti</h2>
        <p>Pick a date and slot for your flat's Aarti. 🌼</p>
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

        <label className="field">
          <span>Date</span>
          <select value={date} onChange={(e) => setDate(e.target.value)}>
            <option value="">Select a date…</option>
            {AARTI_DATES.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>
        </label>

        <label className="field">
          <span>Slot</span>
          <select value={slot} onChange={(e) => setSlot(e.target.value)}>
            <option value="">Select a slot…</option>
            {SLOTS.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </label>

        {error && <p className="error">{error}</p>}

        <button className="btn" type="submit" disabled={status === 'saving'}>
          {status === 'saving' ? 'Saving…' : 'Book Aarti'}
        </button>

        <Link className="link-gallery" to="/aarti/list">
          View Aarti schedule →
        </Link>
      </form>

      {confirmOpen && (
        <div className="modal-backdrop" onClick={() => setConfirmOpen(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h3>Update your booking?</h3>
            <p>
              Flat <strong>{flat}</strong> already has an Aarti booking. This
              will <strong>replace</strong> it with {date}, {slot}.
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
