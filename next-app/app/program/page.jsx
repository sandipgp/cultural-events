'use client'
import { useState } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabaseClient.js'
import { useFestival, useModules } from '@/lib/festivalContext.jsx'
import { FLAT_LIST } from '@/lib/flats.js'
import AppHeader from '@/components/AppHeader.jsx'
import AppFooter from '@/components/AppFooter.jsx'

const OTHER = 'Other'

export default function ProgramForm() {
  const { festival } = useFestival()
  const festivalId = festival?.id
  const { participation } = useModules()
  const fields = participation.fields || {}
  const showAge = fields.ageGroup !== false
  const showFlat = !!fields.flat
  const showDesc = fields.description !== false
  const options = participation.allowOther
    ? [...participation.categories, OTHER]
    : participation.categories
  const [name, setName] = useState('')
  const [ageGroup, setAgeGroup] = useState('')
  const [flat, setFlat] = useState('')
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
    if (showAge && !ageGroup) return setError('Please select an age group.')
    if (showFlat && !flat) return setError('Please select your flat number.')
    if (events.length === 0) return setError('Pick at least one program.')
    if (events.includes(OTHER) && !otherText.trim())
      return setError('Please specify the other program.')
    if (!festivalId) return setError('Still loading — please try again in a moment.')

    setStatus('saving')
    const { error } = await supabase.from('program_participants').insert({
      festival_id: festivalId,
      name: name.trim(),
      age_group: showAge ? ageGroup : null,
      flat_number: showFlat ? flat : null,
      events: resolvedEvents(),
      description: showDesc ? description.trim() || null : null,
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
            <strong>{name}</strong>
            {showFlat && flat ? ` (Flat ${flat})` : showAge && ageGroup ? ` (${ageGroup})` : ''}{' '}
            registered for <strong>{resolvedEvents().join(', ')}</strong>.
          </p>
          <Link className="btn" href="/program/list">
            View participants
          </Link>
          <Link className="btn ghost" href="/">
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
        <h2>Participate in {participation.label}</h2>
        <p>Choose the programs you'd like to take part in. 🎉</p>
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

        {showAge && (
          <label className="field">
            <span>Age group</span>
            <select value={ageGroup} onChange={(e) => setAgeGroup(e.target.value)}>
              <option value="">Select age group…</option>
              {participation.ageGroups.map((g) => (
                <option key={g} value={g}>
                  {g}
                </option>
              ))}
            </select>
          </label>
        )}

        {showFlat && (
          <label className="field">
            <span>Flat number</span>
            <select value={flat} onChange={(e) => setFlat(e.target.value)}>
              <option value="">Select your flat…</option>
              {FLAT_LIST.map((fl) => (
                <option key={fl} value={fl}>
                  {fl}
                </option>
              ))}
            </select>
          </label>
        )}

        <div className="field">
          <span>Programs (select one or more)</span>
          <div className="checks">
            {options.map((p) => (
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

        {showDesc && (
          <label className="field">
            <span>Description (optional)</span>
            <textarea
              rows={3}
              value={description}
              placeholder="Any details you'd like the organizers to know (optional)"
              onChange={(e) => setDescription(e.target.value)}
            />
          </label>
        )}

        {error && <p className="error">{error}</p>}

        <button className="btn" type="submit" disabled={status === 'saving'}>
          {status === 'saving' ? 'Saving…' : 'Register'}
        </button>

        <Link className="link-gallery" href="/program/list">
          View participants →
        </Link>
      </form>

      <AppFooter />
    </div>
  )
}
