'use client'
import { useState } from 'react'
import Link from 'next/link'
import { useAdmin } from '@/lib/admin.jsx'
import AppHeader from '@/components/AppHeader.jsx'

// Wraps any /manage screen: shows the password form until unlocked.
export default function AdminGate({ children }) {
  const { isAdmin, login } = useAdmin()
  const [pw, setPw] = useState('')
  const [err, setErr] = useState('')

  async function submit(e) {
    e.preventDefault()
    const ok = await login(pw)
    if (ok) {
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
        <Link className="link-gallery" href="/">
          ← Back to dashboard
        </Link>
      </form>
    </div>
  )
}
