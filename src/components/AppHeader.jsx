import { useState } from 'react'
import { Link } from 'react-router-dom'
import { SOCIETY_NAME, FESTIVAL } from '../lib/festival.js'

// The logo uses the same image as the OG/social preview (public/og-image.jpg).
// Falls back to a 🪔 emoji if that file isn't present, so nothing breaks.
function LogoImg() {
  const [failed, setFailed] = useState(false)
  if (failed) return <>🪔</>
  return <img src="/ganesh-logo.svg" alt="" onError={() => setFailed(true)} />
}

// Shared header used on every screen. The logo links back to the dashboard.
// Admin login lives on the /manage route, not in the header.
export default function AppHeader({ title, subtitle }) {
  return (
    <header className="app-header">
      <Link to="/" className="logo" aria-label="Home">
        <LogoImg />
      </Link>
      <div className="logo-text">
        <strong>{title || SOCIETY_NAME}</strong>
        <span>{subtitle || FESTIVAL}</span>
      </div>
    </header>
  )
}
