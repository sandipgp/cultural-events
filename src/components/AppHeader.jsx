import { Link } from 'react-router-dom'
import { AdminButton } from '../lib/admin.jsx'
import { SOCIETY_NAME, FESTIVAL } from '../lib/festival.js'

// Shared header used on every screen. The logo links back to the dashboard.
export default function AppHeader({ title, subtitle, showAdmin = true }) {
  return (
    <header className="app-header">
      <Link to="/" className="logo" aria-label="Home">
        🪔
      </Link>
      <div className="logo-text">
        <strong>{title || SOCIETY_NAME}</strong>
        <span>{subtitle || FESTIVAL}</span>
      </div>
      {showAdmin && <AdminButton />}
    </header>
  )
}
