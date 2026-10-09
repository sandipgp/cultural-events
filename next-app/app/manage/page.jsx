'use client'
import { useState } from 'react'
import Link from 'next/link'
import { useAdmin } from '@/lib/admin.jsx'
import { useContestOver, useEventsOver, useLastDate } from '@/lib/settings.js'
import { useFestival, useFestivalMeta, useModules } from '@/lib/festivalContext.jsx'
import { apiUpdateFestival } from '@/lib/festivalApi.js'
import { formatDateLabel, toDateInputValue } from '@/lib/deadline.js'
import AppHeader from '@/components/AppHeader.jsx'
import AppFooter from '@/components/AppFooter.jsx'
import AdminGate from '@/components/AdminGate.jsx'
import Switch from '@/components/Switch.jsx'

// Home-page tiles, in dashboard order. Each is independently toggleable; some
// modules contribute more than one tile (via a specific `field`).
const HOME_TILES = [
  { key: 'rota', field: 'enabled', label: (m) => `Schedule ${m.rota.label}` },
  { key: 'participation', field: 'showForm', label: () => 'Participate' },
  { key: 'participation', field: 'showList', label: () => 'Participants' },
  { key: 'schedule', field: 'enabled', label: (m) => m.schedule.label },
  { key: 'contest', field: 'enabled', label: (m) => m.contest.label },
]

const SETUP = [
  { to: '/manage/event', icon: '🗂️', title: 'Events', desc: 'Create / switch / configure' },
  { to: '/manage/theme', icon: '🎨', title: 'Theme & branding', desc: 'Colors, logo, name' },
]

const CONTENT = [
  { to: '/aarti/list', icon: '📋', title: 'Aarti Schedule' },
  { to: '/program/list', icon: '👥', title: 'Participants' },
  { to: '/events', icon: '🗓️', title: 'Events Schedule' },
  { to: '/gallery', icon: '📷', title: 'Photo Gallery' },
]

function ManageHub() {
  const { logout, password } = useAdmin()
  const { festival, reload } = useFestival()
  const meta = useFestivalMeta()
  const mods = useModules()
  const { over: contestOver, setContestOver } = useContestOver()
  const { over: eventsOver, setEventsOver } = useEventsOver()
  const { label: lastDate, setLastDate } = useLastDate()
  const [pending, setPending] = useState(null) // { message, apply }
  const [savingMods, setSavingMods] = useState(false)

  const contestOpen = !contestOver
  const eventOngoing = !eventsOver

  // Toggle one home tile on/off (a specific field on its module). A field is
  // "shown" unless explicitly false, so flip relative to that.
  async function toggleTile(key, field) {
    if (!festival?.id || savingMods) return
    setSavingMods(true)
    const shown = mods[key]?.[field] !== false
    const patch = { [field]: !shown }
    // Toggling a participation sub-tile on implies the module is enabled.
    if (key === 'participation' && !shown) patch.enabled = true
    const nextModules = { ...mods, [key]: { ...mods[key], ...patch } }
    try {
      await apiUpdateFestival(festival.id, { modules: nextModules }, password)
      reload()
    } finally {
      setSavingMods(false)
    }
  }

  return (
    <div className="screen dash">
      <AppHeader title="Admin" subtitle="Management area" />

      <div className="intro card">
        <h2>Admin panel</h2>
        <p>
          Managing <strong>{meta.name}</strong>. Configure the event, theme and
          content below. 🔓
        </p>
      </div>

      <h3 className="card-title manage-links-title">Setup</h3>
      <div className="tiles">
        {SETUP.map((l) => (
          <Link key={l.to} href={l.to} className="tile card">
            <span className="tile-icon">{l.icon}</span>
            <span className="tile-text">
              <strong>{l.title}</strong>
              <span className="tile-desc">{l.desc}</span>
            </span>
          </Link>
        ))}
      </div>

      <div className="card">
        <h3 className="card-title">Home sections</h3>
        <p className="modal-sub muted">Choose which sections show on the home page.</p>
        {HOME_TILES.map((t) => {
          const shown = mods[t.key]?.[t.field] !== false
          return (
            <div className="setting-row" key={`${t.key}.${t.field}`}>
              <div>
                <strong>{t.label(mods)}</strong>
                <span className="muted"> — {shown ? 'Shown' : 'Hidden'}</span>
              </div>
              <Switch on={shown} onToggle={() => toggleTile(t.key, t.field)} />
            </div>
          )
        })}
      </div>

      <div className="card">
        <h3 className="card-title">Event settings</h3>

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
                apply: () => setContestOver(contestOpen),
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
                apply: () => setEventsOver(eventOngoing),
              })
            }
          />
        </div>
      </div>

      <h3 className="card-title manage-links-title">Manage content</h3>
      <div className="tiles">
        {CONTENT.map((l) => (
          <Link key={l.to} href={l.to} className="tile card">
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

export default function Manage() {
  return (
    <AdminGate>
      <ManageHub />
    </AdminGate>
  )
}
