'use client'
import { useState } from 'react'
import Link from 'next/link'
import { useFestivalMeta } from '@/lib/festivalContext.jsx'

// Logo is the active festival's logo (image path or emoji). Falls back to 🪔.
function LogoImg({ src }) {
  const [failed, setFailed] = useState(false)
  const isImage = typeof src === 'string' && (src.startsWith('/') || src.startsWith('http'))
  if (!isImage) return <>{src || '🪔'}</>
  if (failed) return <>🪔</>
  return <img src={src} alt="" onError={() => setFailed(true)} />
}

export default function AppHeader({ title, subtitle }) {
  const meta = useFestivalMeta()
  return (
    <header className="app-header">
      <Link href="/" className="logo" aria-label="Home">
        <LogoImg src={meta.logo} />
      </Link>
      <div className="logo-text">
        <strong>{title || meta.society}</strong>
        <span>{subtitle || meta.name}</span>
      </div>
    </header>
  )
}
