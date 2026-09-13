import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../supabaseClient.js'
import AppHeader from '../components/AppHeader.jsx'

export default function ProgramWinners() {
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let active = true
    ;(async () => {
      const { data, error } = await supabase
        .from('program_participants')
        .select('*')
        .eq('is_winner', true)
        .order('age_group', { ascending: true })
      if (!active) return
      if (error) setError(error.message)
      else setRows(data || [])
      setLoading(false)
    })()
    return () => {
      active = false
    }
  }, [])

  return (
    <div className="screen">
      <AppHeader title="Program Winners" />

      <div className="winners-hero card">
        <div className="winners-emoji">🎉 🏆 🎉</div>
        <h2>Congratulations!</h2>
        <p>Winners of the cultural programs</p>
      </div>

      <div className="page-bar">
        <Link className="btn ghost small" to="/">
          ← Dashboard
        </Link>
        <Link className="btn ghost small" to="/program/list">
          All participants
        </Link>
      </div>

      {error && <p className="error center">{error}</p>}
      {loading && <p className="muted center">Loading…</p>}
      {!loading && !error && rows.length === 0 && (
        <p className="muted center">Winners will be announced soon. 🌟</p>
      )}

      {!loading && rows.length > 0 && (
        <div className="table-wrap card">
          <table className="tbl">
            <thead>
              <tr>
                <th>Age group</th>
                <th>Name</th>
                <th>Programs</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.id} className="row-winner">
                  <td className="tbl-flat">{row.age_group}</td>
                  <td>
                    <div className="tbl-name">
                      <span className="win-star">🏆</span>
                      {row.name}
                    </div>
                    {row.description && <p className="tbl-desc">{row.description}</p>}
                  </td>
                  <td>
                    <div className="tbl-chips">
                      {(row.events || []).map((e) => (
                        <span className="chip" key={e}>
                          {e}
                        </span>
                      ))}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <p className="foot">Ganpati Bappa Morya 🌺</p>
    </div>
  )
}
