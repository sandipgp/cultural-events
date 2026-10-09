'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabaseClient.js'
import { useContestOver, useEventsOver } from '@/lib/settings.js'
import { useAdmin } from '@/lib/admin.jsx'
import { useFestival, useModules, useFestivalMeta } from '@/lib/festivalContext.jsx'
import AppHeader from '@/components/AppHeader.jsx'
import AppFooter from '@/components/AppFooter.jsx'

// Optional secondary hero media (image or direct video), shown below the hero.
function HeroMedia({ url }) {
  const isVideo = /\.(mp4|webm|ogg|mov)(\?|$)/i.test(url)
  return (
    <div className="hero-media card">
      {isVideo ? (
        <video src={url} autoPlay muted loop playsInline />
      ) : (
        <img src={url} alt="" />
      )}
    </div>
  )
}

// Hero emblem: the active festival's logo (image path or emoji).
function HeroEmblem({ logo }) {
  const isImage = typeof logo === 'string' && (logo.startsWith('/') || logo.startsWith('http'))
  if (isImage) {
    return (
      <div className="hero-emblem">
        <img src={logo} alt="" />
      </div>
    )
  }
  return <div className="hero-emblem emoji">{logo || '🪔'}</div>
}

export default function Dashboard() {
  const { isAdmin } = useAdmin()
  const { festival } = useFestival()
  const festivalId = festival?.id
  const meta = useFestivalMeta()
  const { rota, participation, contest, schedule } = useModules()
  const { over: contestOver } = useContestOver()
  const { over: eventsOver } = useEventsOver()
  const [hasWinners, setHasWinners] = useState(false)

  useEffect(() => {
    if (!festivalId) return
    let active = true
    ;(async () => {
      const { count } = await supabase
        .from('program_participants')
        .select('id', { count: 'exact', head: true })
        .eq('festival_id', festivalId)
        .eq('is_winner', true)
      if (active && count > 0) setHasWinners(true)
    })()
    return () => {
      active = false
    }
  }, [festivalId])

  // Tiles are built from the active festival's enabled modules + labels.
  // `over: true` = tile stays active even when the event is marked over.
  const tiles = []
  if (rota.enabled) {
    tiles.push({ to: '/aarti', icon: '🪔', title: `Schedule ${rota.label}`, desc: 'Book your slot' })
    tiles.push({ to: '/aarti/list', icon: '📋', title: `${rota.label} Schedule`, desc: 'View all bookings' })
  }
  if (participation.enabled && participation.showForm !== false) {
    tiles.push({ to: '/program', icon: '🎭', title: 'Participate', desc: participation.label })
  }
  if (participation.enabled && participation.showList !== false) {
    tiles.push({ to: '/program/list', icon: '👥', title: 'Participants', desc: 'Who signed up', over: true })
  }
  if (schedule.enabled) {
    tiles.push({ to: '/events', icon: '🗓️', title: schedule.label, desc: 'Program timings' })
  }
  if (contest.enabled) {
    tiles.push({ to: '/photo', icon: '📷', title: contest.label, desc: 'Submit your entry' })
  }
  if (participation.enabled && hasWinners) {
    tiles.push({
      to: '/program/winners',
      icon: '🏆',
      title: `${participation.label} Winners`,
      desc: 'Announced results',
      over: true,
      accent: 'gold',
    })
  }
  if (contest.enabled && (contestOver || eventsOver)) {
    tiles.push({
      to: '/winners',
      icon: '📸',
      title: `${contest.label} Winners`,
      desc: 'Results',
      over: true,
      accent: 'gold',
    })
  }

  // Once the event is over, show only the still-active tiles (hide the rest).
  const visibleTiles = eventsOver ? tiles.filter((t) => t.over) : tiles

  return (
    <div className="screen dash">
      <AppHeader />

      {meta.heroShow && (
        <div className={`hero card ${meta.heroGradient ? '' : 'plain'}`}>
          {meta.heroGradient && (
            <>
              <div className="hero-glow hero-glow-a" />
              <div className="hero-glow hero-glow-b" />
            </>
          )}
          <HeroEmblem logo={meta.logo} />
          <h2 className="hero-title">{meta.name}</h2>
          <p className="hero-sub">
            {meta.tagline ||
              'Book your slot, join the programs, and see what’s on. 🌼'}
          </p>
        </div>
      )}

      {meta.heroMediaShow && meta.heroMediaUrl && (
        <HeroMedia url={meta.heroMediaUrl} />
      )}

      {isAdmin && (
        <Link className="btn admin-settings-btn" href="/manage">
          ⚙️ Admin panel
        </Link>
      )}

      {eventsOver && (
        <div className="over-hero card">
          <div className="over-emoji">🙏</div>
          <h2>The event is over</h2>
          <p>
            Thank you for celebrating with us! Explore the winners and
            participants below. 🌺
          </p>
        </div>
      )}

      <div className={`tiles ${eventsOver ? 'featured' : ''}`}>
        {visibleTiles.map((t) => (
          <Link
            key={t.to}
            href={t.to}
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

      <AppFooter />
    </div>
  )
}
