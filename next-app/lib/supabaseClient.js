import { createClient } from '@supabase/supabase-js'

const url = process.env.NEXT_PUBLIC_SUPABASE_URL
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!url || !anonKey) {
  console.warn(
    'Supabase env vars missing. Set NEXT_PUBLIC_SUPABASE_URL and ' +
      'NEXT_PUBLIC_SUPABASE_ANON_KEY in next-app/.env.local.'
  )
}

export const supabase = createClient(url || '', anonKey || '')

// Name of the public Storage bucket that holds the uploaded photos.
export const PHOTO_BUCKET = 'photos'
