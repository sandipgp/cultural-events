import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useFestivalMeta } from '../lib/festivalContext.jsx'

// The logo is the active festival's logo (an image path or an emoji). Image
// paths render as <img> and fall back to 🪔 if missing; anything else (emoji)
// renders as text.
function LogoImg({ src }) {
  const [failed, setFailed] = useState(false)
  const isImage = typeof src === 'string' && (src.startsWith('/') || src.startsWith('http'))
  if (!isImage) return <>{src || '🪔'}</>
  if (failed) return <>🪔</>
  return <img src={src} alt="" onError={() => setFailed(true)} />
}

// Shared header used on every screen. The logo links back to the dashboard.
// Admin login lives on the /manage route, not in the header.
export default function AppHeader({ title, subtitle }) {
  const meta = useFestivalMeta()
  return (
    <header className="app-header">
      <Link to="/" className="logo" aria-label="Home">
        <LogoImg src={meta.logo} />
      </Link>
      <div className="logo-text">
        <strong>{title || meta.society}</strong>
        <span>{subtitle || meta.name}</span>
      </div>
    </header>
  )
}
