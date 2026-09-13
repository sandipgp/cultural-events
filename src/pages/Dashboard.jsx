import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../supabaseClient.js'
import AppHeader from '../components/AppHeader.jsx'

const TILES = [
  { to: '/aarti', icon: '🪔', title: 'Schedule Aarti', desc: 'Book your slot' },
  { to: '/aarti/list', icon: '📋', title: 'Aarti Schedule', desc: 'View all bookings' },
  { to: '/program', icon: '🎭', title: 'Participate', desc: 'Join a program' },
  { to: '/program/list', icon: '👥', title: 'Participants', desc: 'Who signed up' },
  { to: '/events', icon: '🗓️', title: 'Events Schedule', desc: 'Program timings' },
  { to: '/photo', icon: '📷', title: 'Photo Contest', desc: 'Decoration photos' },
]

export default function Dashboard() {
  // The "Program Winners" tile only appears once an admin has set winners.
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

  const tiles = hasWinners
    ? [
        ...TILES,
        { to: '/program/winners', icon: '🏆', title: 'Program Winners', desc: 'Announced results' },
      ]
    : TILES

  return (
    <div className="screen">
      <AppHeader />

      <div className="intro card">
        <div className="ganesh-fallback"></div>
        <h2>Ganeshotsav Cultural Events</h2>
        <p>
          Welcome! Schedule your Aarti, join the cultural programs, and see
          what's happening across the festival. 🌼
        </p>
      </div>

      <div className="tiles">
        {tiles.map((t) => (
          <Link key={t.to} to={t.to} className="tile card">
            <span className="tile-icon">{t.icon}</span>
            <strong>{t.title}</strong>
            <span className="tile-desc">{t.desc}</span>
          </Link>
        ))}
      </div>

      <p className="foot">Ganpati Bappa Morya 🌺</p>
    </div>
  )
}
