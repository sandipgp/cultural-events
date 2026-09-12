import { Link } from 'react-router-dom'
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
        {TILES.map((t) => (
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
