import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../supabaseClient.js'
import { useContestOver, useEventsOver } from '../lib/settings.js'
import { useAdmin } from '../lib/admin.jsx'
import AppHeader from '../components/AppHeader.jsx'

// `over: true` = tile stays active even when the event is marked over.
const TILES = [
  { to: '/aarti', icon: '🪔', title: 'Schedule Aarti', desc: 'Book your slot' },
  { to: '/aarti/list', icon: '📋', title: 'Aarti Schedule', desc: 'View all bookings' },
  { to: '/program', icon: '🎭', title: 'Participate', desc: 'Join a program' },
  { to: '/program/list', icon: '👥', title: 'Participants', desc: 'Who signed up', over: true },
  { to: '/events', icon: '🗓️', title: 'Events Schedule', desc: 'Program timings' },
  { to: '/photo', icon: '📷', title: 'Photo Contest', desc: 'Decoration photos' },
]

export default function Dashboard() {
  const { isAdmin } = useAdmin()
  const { over: contestOver } = useContestOver()
  const { over: eventsOver } = useEventsOver()
  const [hasWinners, setHasWinners] = useState(false)

  useEffect(() => {
    let active = true
    ;(async () => {
      const { count } = await supabase
        .from('program_participants')
        .select('id', { count: 'exact', head: true })
        .eq('is_winner', true)
      if (active && count > 0) setHasWinners(true)
    })()
    return () => {
      active = false
    }
  }, [])

  const tiles = [...TILES]
  if (hasWinners) {
    tiles.push({
      to: '/program/winners',
      icon: '🏆',
      title: 'Program Winners',
      desc: 'Announced results',
      over: true,
    })
  }
  if (contestOver || eventsOver) {
    tiles.push({
      to: '/winners',
      icon: '📸',
      title: 'Photo Winners',
      desc: 'Contest results',
      over: true,
    })
  }

  return (
    <div className="screen dash">
      <AppHeader />

      <div className="intro card">
        <h2>Ganeshotsav Cultural Events</h2>
        <p>
          Welcome! Schedule your Aarti, join the cultural programs, and see
          what's happening across the festival. 🌼
        </p>
      </div>

      {isAdmin && (
        <Link className="btn admin-settings-btn" to="/manage">
          ⚙️ Admin panel
        </Link>
      )}

      {eventsOver && (
        <p className="over-note">
          🙏 The event is over. Thank you for participating!
        </p>
      )}

      <div className="tiles">
        {tiles.map((t) => {
          const disabled = eventsOver && !t.over
          if (disabled) {
            return (
              <div key={t.to} className="tile card disabled" aria-disabled="true">
                <span className="tile-icon">{t.icon}</span>
                <strong>{t.title}</strong>
                <span className="tile-desc">{t.desc}</span>
              </div>
            )
          }
          return (
            <Link key={t.to} to={t.to} className="tile card">
              <span className="tile-icon">{t.icon}</span>
              <strong>{t.title}</strong>
              <span className="tile-desc">{t.desc}</span>
            </Link>
          )
        })}
      </div>

      <p className="foot">
        Ganpati Bappa Morya 🌺
        {!isAdmin && (
          <>
            <br />
            <Link className="manage-link" to="/manage">
              Admin
            </Link>
          </>
        )}
      </p>
    </div>
  )
}
