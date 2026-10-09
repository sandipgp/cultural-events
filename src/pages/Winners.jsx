import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../supabaseClient.js'
import { useContestOver } from '../lib/settings.js'
import { useFestival, useModules } from '../lib/festivalContext.jsx'
import AppHeader from '../components/AppHeader.jsx'
import AppFooter from '../components/AppFooter.jsx'

export default function Winners() {
  const { over: contestOver } = useContestOver()
  const { festival } = useFestival()
  const festivalId = festival?.id
  const { contest } = useModules()
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!contestOver || !festivalId) return // wait for contest-over + festival
    let active = true
    ;(async () => {
      const { data, error } = await supabase
        .from('submissions')
        .select('*')
        .eq('festival_id', festivalId)
        .eq('is_winner', true)
        .order('flat_number', { ascending: true })
      if (!active) return
      if (error) setError(error.message)
      else setRows(data || [])
      setLoading(false)
    })()
    return () => {
      active = false
    }
  }, [contestOver, festivalId])

  // Winners are hidden until the contest is over (VITE_CONTEST_OVER / deadline).
  if (!contestOver) {
    return (
      <div className="screen">
        <AppHeader title={`${contest.label} Winners`} />
        <div className="card thanks">
          <div className="thanks-mark">🌟</div>
          <h2>Not announced yet</h2>
          <p>Winners will be revealed once the contest is over. Stay tuned!</p>
          <Link className="btn" to="/">
            Submit your photo
          </Link>
          <Link className="btn ghost" to="/gallery">
            View all photos
          </Link>
        </div>
        <AppFooter />
      </div>
    )
  }

  return (
    <div className="screen wide">
      <AppHeader title={`${contest.label} Winners`} />

      <div className="winners-hero card">
        <div className="winners-emoji">🎉 🏆 🎉</div>
        <h2>Congratulations!</h2>
        <p>Winners of the {contest.label}</p>
      </div>

      {error && <p className="error center">{error}</p>}
      {loading && <p className="muted center">Loading…</p>}
      {!loading && !error && rows.length === 0 && (
        <p className="muted center">Winners will be announced soon. 🌟</p>
      )}

      <div className="grid">
        {rows.map((row) => (
          <div className="gcard winner" key={row.id}>
            <div className="gcard-media">
              <img
                src={`${row.photo_url}?v=${encodeURIComponent(row.updated_at || '')}`}
                alt={`Ganpati by ${row.name}`}
                loading="lazy"
              />
              <div className="gcard-badges">
                <span className="badge winner-badge">🏆 Winner</span>
                {row.is_ai && (
                  <span className="badge ai-badge" title="Flagged as AI-generated / AI-filtered">
                    🤖 AI
                  </span>
                )}
              </div>
              <a
                className="view-btn"
                href={row.photo_url}
                target="_blank"
                rel="noopener noreferrer"
                title="Open photo in a new tab"
                aria-label="Open photo in a new tab"
              >
                ⤢
              </a>
              <div className="gcard-strip">
                <strong className="gcard-name">{row.name}</strong>
                <span className="gcard-flat">Flat {row.flat_number}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="gallery-bar" style={{ marginTop: 16 }}>
        <Link className="btn ghost small" to="/gallery">
          View all photos →
        </Link>
      </div>

      <AppFooter />
    </div>
  )
}
