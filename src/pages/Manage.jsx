import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useAdmin } from '../lib/admin.jsx'
import { useContestOver, useEventsOver, useLastDate } from '../lib/settings.js'
import { formatDateLabel, toDateInputValue } from '../lib/deadline.js'
import AppHeader from '../components/AppHeader.jsx'
import AppFooter from '../components/AppFooter.jsx'

const LINKS = [
  { to: '/aarti/list', icon: '📋', title: 'Aarti Schedule' },
  { to: '/program/list', icon: '👥', title: 'Participants' },
  { to: '/events', icon: '🗓️', title: 'Events Schedule' },
  { to: '/gallery', icon: '📷', title: 'Photo Gallery' },
]

function Switch({ on, onToggle }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      className={`switch ${on ? 'on' : ''}`}
      onClick={onToggle}
    >
      <span className="switch-knob" />
    </button>
  )
}

export default function Manage() {
  const { isAdmin, login, logout } = useAdmin()
  const [pw, setPw] = useState('')
  const [err, setErr] = useState('')
  const { over: contestOver, setContestOver } = useContestOver()
  const { over: eventsOver, setEventsOver } = useEventsOver()
  const { label: lastDate, setLastDate } = useLastDate()
  const [pending, setPending] = useState(null) // { message, apply }

  const contestOpen = !contestOver
  const eventOngoing = !eventsOver

  function submit(e) {
    e.preventDefault()
    if (login(pw)) {
      setErr('')
      setPw('')
    } else {
      setErr('Wrong password.')
    }
  }

  // Locked: show the login form.
  if (!isAdmin) {
    return (
      <div className="screen">
        <AppHeader title="Admin" subtitle="Management area" />
        <form className="card form" onSubmit={submit}>
          <h2 className="page-title">Admin login</h2>
          <label className="field">
            <span>Password</span>
            <input
              type="password"
              autoFocus
              value={pw}
              onChange={(e) => setPw(e.target.value)}
              placeholder="Enter admin password"
            />
          </label>
          {err && <p className="error">{err}</p>}
          <button className="btn" type="submit">
            Unlock
          </button>
          <Link className="link-gallery" to="/">
            ← Back to dashboard
          </Link>
        </form>
      </div>
    )
  }

  // Unlocked: the admin hub.
  return (
    <div className="screen dash">
      <AppHeader title="Admin" subtitle="Management area" />

      <div className="intro card">
        <h2>Admin panel</h2>
        <p>You're unlocked. Manage settings and content below. 🔓</p>
      </div>

      <div className="card">
        <h3 className="card-title">App settings</h3>

        <div className="setting-row">
          <div>
            <strong>Last date to submit</strong>
            <span className="muted"> — {lastDate ? formatDateLabel(lastDate) : 'not set'}</span>
          </div>
          <input
            type="date"
            className="date-input"
            value={toDateInputValue(lastDate)}
            onChange={(e) => setLastDate(e.target.value)}
          />
        </div>

        <div className="setting-row">
          <div>
            <strong>Photo contest</strong>
            <span className="muted"> — {contestOpen ? 'Open' : 'Closed'}</span>
          </div>
          <Switch
            on={contestOpen}
            onToggle={() =>
              setPending({
                message: contestOpen
                  ? 'Close the photo contest? Members will no longer be able to submit photos.'
                  : 'Reopen the photo contest? Members will be able to submit photos again.',
                apply: () => setContestOver(contestOpen), // open→close, closed→open
              })
            }
          />
        </div>

        <div className="setting-row">
          <div>
            <strong>Event status</strong>
            <span className="muted"> — {eventOngoing ? 'Ongoing' : 'Over'}</span>
          </div>
          <Switch
            on={eventOngoing}
            onToggle={() =>
              setPending({
                message: eventOngoing
                  ? 'Mark the event as over? The dashboard will show only Participants and Winners.'
                  : 'Mark the event as ongoing? All sections become available again.',
                apply: () => setEventsOver(eventOngoing), // ongoing→over, over→ongoing
              })
            }
          />
        </div>

        <p className="modal-sub muted">
          When the event is over, the dashboard shows only Participants and
          Winners; everything else is greyed out.
        </p>
      </div>

      <h3 className="card-title manage-links-title">Manage content</h3>
      <div className="tiles">
        {LINKS.map((l) => (
          <Link key={l.to} to={l.to} className="tile card">
            <span className="tile-icon">{l.icon}</span>
            <strong>{l.title}</strong>
          </Link>
        ))}
      </div>

      <button className="btn logout-btn" onClick={logout}>
        Log out
      </button>

      {pending && (
        <div className="modal-backdrop" onClick={() => setPending(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h3>Please confirm</h3>
            <p>{pending.message}</p>
            <div className="modal-actions">
              <button className="btn ghost" onClick={() => setPending(null)}>
                Cancel
              </button>
              <button
                className="btn"
                onClick={() => {
                  pending.apply()
                  setPending(null)
                }}
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}

      <AppFooter />
    </div>
  )
}
