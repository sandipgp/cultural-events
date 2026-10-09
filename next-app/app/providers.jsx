'use client'
import { AdminProvider } from '@/lib/admin.jsx'
import { FestivalProvider } from '@/lib/festivalContext.jsx'

export default function Providers({ children }) {
  return (
    <AdminProvider>
      <FestivalProvider>{children}</FestivalProvider>
    </AdminProvider>
  )
}
