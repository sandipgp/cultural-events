'use client'
import { useFestivalMeta } from '@/lib/festivalContext.jsx'

// Shared footer; text is per-event (admin-managed in /manage/theme).
export default function AppFooter() {
  const { footer } = useFestivalMeta()
  return <p className="foot">{footer || '🌺'}</p>
}
