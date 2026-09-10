import { createClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!url || !anonKey) {
  // Helps you catch a missing .env.local before anything else breaks.
  console.warn(
    'Supabase env vars missing. Copy .env.example to .env.local and fill in ' +
      'VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.'
  )
}

export const supabase = createClient(url || '', anonKey || '')

// Name of the public Storage bucket that holds the uploaded photos.
export const PHOTO_BUCKET = 'photos'
