import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useAdmin } from '../lib/admin.jsx'
import AppHeader from './AppHeader.jsx'

// Wraps any /manage screen: shows the password form until unlocked, then the
// children. Admin state is shared app-wide, so unlocking once covers all
// /manage routes for the session.
export default function AdminGate({ children }) {
  const { isAdmin, login } = useAdmin()
  const [pw, setPw] = useState('')
  const [err, setErr] = useState('')

  function submit(e) {
    e.preventDefault()
    if (login(pw)) {
      setErr('')
      setPw('')
    } else {
      setErr('Wrong password.')
    }
  }

  if (isAdmin) return children

  return (
    <div className="screen">
      <AppHeader title="Admin" subtitle="Management area" />
      <form className="card form" onSubmit={submit}>
        <h2 className="page-title">Admin login</h2>
        <label className="field">
          <span>Password</span>
          <input
            type="password"
            autoFocus
            value={pw}
            onChange={(e) => setPw(e.target.value)}
            placeholder="Enter admin password"
          />
        </label>
        {err && <p className="error">{err}</p>}
        <button className="btn" type="submit">
          Unlock
        </button>
        <Link className="link-gallery" to="/">
          ← Back to dashboard
        </Link>
      </form>
    </div>
  )
}
