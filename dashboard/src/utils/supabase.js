import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
// Support both naming conventions: _PUBLISHABLE_KEY (new) and _ANON_KEY (legacy)
const supabaseAnonKey =
  import.meta.env.VITE_SUPABASE_ANON_KEY ||
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn(
    'Supabase not configured — set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY (or VITE_SUPABASE_PUBLISHABLE_KEY)'
  )
}

const isPlaceholder =
  !supabaseUrl ||
  !supabaseAnonKey ||
  supabaseUrl.includes('localhost') ||
  supabaseAnonKey.includes('placeholder')

export const supabase = isPlaceholder
  ? null
  : createClient(supabaseUrl, supabaseAnonKey, {
      auth: { persistSession: false },
      global: {
        headers: { 'x-application-name': 'eco-ia-dashboard' },
      },
    })

export const isSupabaseConfigured = !isPlaceholder
