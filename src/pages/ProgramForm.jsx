import { useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../supabaseClient.js'
import { PROGRAMS, AGE_GROUPS } from '../lib/festival.js'
import AppHeader from '../components/AppHeader.jsx'

const OTHER = 'Other'
const OPTIONS = [...PROGRAMS, OTHER]

export default function ProgramForm() {
  const [name, setName] = useState('')
  const [ageGroup, setAgeGroup] = useState('')
  const [events, setEvents] = useState([])
  const [otherText, setOtherText] = useState('')
  const [description, setDescription] = useState('')
  const [status, setStatus] = useState('idle') // idle | saving | done
  const [error, setError] = useState('')

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
    if (!ageGroup) return setError('Please select an age group.')
    if (events.length === 0) return setError('Pick at least one program.')
    if (events.includes(OTHER) && !otherText.trim())
      return setError('Please specify the other program.')

    setStatus('saving')
    const { error } = await supabase.from('program_participants').insert({
      name: name.trim(),
      age_group: ageGroup,
      events: resolvedEvents(),
      description: description.trim() || null,
    })
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
            <strong>{name}</strong> ({ageGroup}) registered for{' '}
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
            placeholder="e.g. Tanishq Patil"
            onChange={(e) => setName(e.target.value)}
          />
        </label>

        <label className="field">
          <span>Age group</span>
          <select value={ageGroup} onChange={(e) => setAgeGroup(e.target.value)}>
            <option value="">Select age group…</option>
            {AGE_GROUPS.map((g) => (
              <option key={g} value={g}>
                {g}
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

        <label className="field">
          <span>Description (optional)</span>
          <textarea
            rows={3}
            value={description}
            placeholder="Anything you'd like the organizers to know (song, act, group members…)"
            onChange={(e) => setDescription(e.target.value)}
          />
        </label>

        {error && <p className="error">{error}</p>}

        <button className="btn" type="submit" disabled={status === 'saving'}>
          {status === 'saving' ? 'Saving…' : 'Register'}
        </button>

        <Link className="link-gallery" to="/program/list">
          View participants →
        </Link>
      </form>
    </div>
  )
}
