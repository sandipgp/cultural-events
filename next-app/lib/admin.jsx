'use client'
import { createContext, useContext, useEffect, useState } from 'react'

const CLIENT_FALLBACK_PW = process.env.NEXT_PUBLIC_ADMIN_P || 'ganpati2026'

const AdminContext = createContext(null)

// Shared admin state. Login is verified server-side (/api/admin/login) so the
// real password can live in a server-only ADMIN_PASSWORD; the entered password
// is kept for the session to authorize admin API writes (x-admin-pw header).
export function AdminProvider({ children }) {
  const [isAdmin, setIsAdmin] = useState(false)
  const [password, setPassword] = useState('')

  // Restore session (client only — avoids SSR sessionStorage access).
  useEffect(() => {
    try {
      if (sessionStorage.getItem('isAdmin') === 'yes') {
        setIsAdmin(true)
        setPassword(sessionStorage.getItem('adminPw') || '')
      }
    } catch {
      /* ignore */
    }
  }, [])

  function persist(pw) {
    try {
      sessionStorage.setItem('isAdmin', 'yes')
      sessionStorage.setItem('adminPw', pw)
    } catch {
      /* ignore */
    }
  }

  async function login(pw) {
    try {
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: pw }),
      })
      const data = await res.json()
      if (data?.ok) {
        setIsAdmin(true)
        setPassword(pw)
        persist(pw)
        return true
      }
      return false
    } catch {
      // Network/route unavailable — fall back to the client-side check.
      if (pw === CLIENT_FALLBACK_PW) {
        setIsAdmin(true)
        setPassword(pw)
        persist(pw)
        return true
      }
      return false
    }
  }

  function logout() {
    setIsAdmin(false)
    setPassword('')
    try {
      sessionStorage.removeItem('isAdmin')
      sessionStorage.removeItem('adminPw')
    } catch {
      /* ignore */
    }
  }

  return (
    <AdminContext.Provider value={{ isAdmin, password, login, logout }}>
      {children}
    </AdminContext.Provider>
  )
}

export function useAdmin() {
  const ctx = useContext(AdminContext)
  if (!ctx) throw new Error('useAdmin must be used within AdminProvider')
  return ctx
}
