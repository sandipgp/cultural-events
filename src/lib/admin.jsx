import { createContext, useContext, useState } from 'react'

const ADMIN_PASSWORD = import.meta.env.VITE_ADMIN_P || 'ganpati2026'

const AdminContext = createContext(null)

// Wrap the app so every screen shares one admin state (kept in sessionStorage,
// so it survives navigation but clears when the tab closes).
export function AdminProvider({ children }) {
  const [isAdmin, setIsAdmin] = useState(
    () => sessionStorage.getItem('isAdmin') === 'yes'
  )

  const login = (pw) => {
    if (pw === ADMIN_PASSWORD) {
      setIsAdmin(true)
      sessionStorage.setItem('isAdmin', 'yes')
      return true
    }
    return false
  }
  const logout = () => {
    setIsAdmin(false)
    sessionStorage.removeItem('isAdmin')
  }

  return (
    <AdminContext.Provider value={{ isAdmin, login, logout }}>
      {children}
    </AdminContext.Provider>
  )
}

export function useAdmin() {
  const ctx = useContext(AdminContext)
  if (!ctx) throw new Error('useAdmin must be used within AdminProvider')
  return ctx
}

// The Admin lock/unlock button shown in the header, with its password modal.
export function AdminButton() {
  const { isAdmin, login, logout } = useAdmin()
  const [open, setOpen] = useState(false)
  const [pw, setPw] = useState('')
  const [err, setErr] = useState('')

  function submit(e) {
    e.preventDefault()
    if (login(pw)) {
      setOpen(false)
      setPw('')
      setErr('')
    } else {
      setErr('Wrong password.')
    }
  }

  return (
    <>
      {isAdmin ? (
        <button className="badge-btn" onClick={logout}>
          Admin ✕
        </button>
      ) : (
        <button className="badge-btn" onClick={() => setOpen(true)}>
          Admin
        </button>
      )}
      {open && (
        <div className="modal-backdrop" onClick={() => setOpen(false)}>
          <form className="modal" onClick={(e) => e.stopPropagation()} onSubmit={submit}>
            <h3>Admin access</h3>
            <p>Enter the password to manage entries.</p>
            <input
              type="password"
              autoFocus
              value={pw}
              onChange={(e) => setPw(e.target.value)}
              placeholder="Password"
            />
            {err && <p className="error">{err}</p>}
            <div className="modal-actions">
              <button type="button" className="btn ghost" onClick={() => setOpen(false)}>
                Cancel
              </button>
              <button type="submit" className="btn">
                Unlock
              </button>
            </div>
          </form>
        </div>
      )}
    </>
  )
}
