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
      accent: 'gold',
    })
  }
  if (contestOver || eventsOver) {
    tiles.push({
      to: '/winners',
      icon: '📸',
      title: 'Photo Winners',
      desc: 'Contest results',
      over: true,
      accent: 'gold',
    })
  }

  // Once the event is over, show only the still-active tiles (hide the rest).
  const visibleTiles = eventsOver ? tiles.filter((t) => t.over) : tiles

  return (
    <div className="screen dash">
      <AppHeader />

      <div className="hero card">
        <div className="hero-glow hero-glow-a" />
        <div className="hero-glow hero-glow-b" />
        <div className="hero-emblem">
          <img src="/hero-modak.svg" alt="" />
        </div>
        <h2 className="hero-title">Ganeshotsav Cultural Events</h2>
        <p className="hero-sub">
          Aarti bookings, cultural programs &amp; the event schedule — all in
          one place. 🌼
        </p>
      </div>

      {isAdmin && (
        <Link className="btn admin-settings-btn" to="/manage">
          ⚙️ Admin panel
        </Link>
      )}

      {eventsOver && (
        <div className="over-hero card">
          <div className="over-emoji">🙏</div>
          <h2>The event is over</h2>
          <p>
            Thank you for celebrating Ganeshotsav with us! Explore the winners
            and participants below. 🌺
          </p>
        </div>
      )}

      <div className={`tiles ${eventsOver ? 'featured' : ''}`}>
        {visibleTiles.map((t) => (
          <Link
            key={t.to}
            to={t.to}
            className={`tile card ${t.accent === 'gold' ? 'gold' : ''}`}
          >
            <span className="tile-icon">{t.icon}</span>
            <span className="tile-text">
              <strong>{t.title}</strong>
              <span className="tile-desc">{t.desc}</span>
            </span>
          </Link>
        ))}
      </div>

      <p className="foot">
        Ganpati Bappa Morya 🌺
      </p>
    </div>
  )
}
