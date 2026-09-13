import { useState } from 'react'
import { Link } from 'react-router-dom'
import { AdminButton } from '../lib/admin.jsx'
import { SOCIETY_NAME, FESTIVAL } from '../lib/festival.js'

// Themed Ganesha logo (public/ganesh-logo.svg). Falls back to a 🪔 emoji if
// the file isn't present, so nothing breaks.
function LogoImg() {
  const [failed, setFailed] = useState(false)
  if (failed) return <>🪔</>
  return <img src="/ganesh-logo.svg" alt="" onError={() => setFailed(true)} />
}

// Shared header used on every screen. The logo links back to the dashboard.
export default function AppHeader({ title, subtitle, showAdmin = true }) {
  return (
    <header className="app-header">
      <Link to="/" className="logo" aria-label="Home">
        <LogoImg />
      </Link>
      <div className="logo-text">
        <strong>{title || SOCIETY_NAME}</strong>
        <span>{subtitle || FESTIVAL}</span>
      </div>
      {showAdmin && <AdminButton />}
    </header>
  )
}
