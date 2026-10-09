import './globals.css'
import Providers from './providers.jsx'
import { supabaseAdmin } from '@/lib/supabaseServer.js'

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'

// Read the active festival on the server so the tab title / OG reflect it.
async function activeFestival() {
  try {
    const { data: s } = await supabaseAdmin
      .from('app_settings')
      .select('value')
      .eq('key', 'active_festival_id')
      .maybeSingle()
    if (s?.value) {
      const { data } = await supabaseAdmin
        .from('festivals')
        .select('name, society_name, tagline, og_title, og_description, og_image')
        .eq('id', s.value)
        .maybeSingle()
      return data || null
    }
  } catch {
    /* ignore */
  }
  return null
}

export async function generateMetadata() {
  const f = await activeFestival()
  const name = f?.name || 'Society Events'
  const pageTitle = f?.society_name ? `${f.society_name} · ${name}` : name
  const pageDesc = f?.tagline || 'Book your slot, join the programs, and see what’s on.'

  // OG (social share) values are admin-managed per event, with fallbacks.
  const ogTitle = f?.og_title || pageTitle
  const ogDesc = f?.og_description || pageDesc
  const ogImage = f?.og_image || '/og-image.jpg'

  return {
    metadataBase: new URL(SITE_URL),
    title: pageTitle,
    description: pageDesc,
    openGraph: { type: 'website', title: ogTitle, description: ogDesc, images: [ogImage] },
    twitter: { card: 'summary_large_image', title: ogTitle, description: ogDesc, images: [ogImage] },
  }
}

export const viewport = {
  themeColor: '#c026a3',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
