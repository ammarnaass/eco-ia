const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('Supabase not configured — set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY');
}

// Admin client (service_role) — bypasses RLS. For webhooks + admin routes.
const supabaseAdmin = createClient(
  supabaseUrl || 'http://localhost:54321',
  process.env.SUPABASE_SERVICE_ROLE_KEY || supabaseAnonKey || 'placeholder-key',
  { auth: { persistSession: false } }
);

// Public client (anon key) — respects RLS. For browser-facing operations.
const supabaseAnon = createClient(
  supabaseUrl || 'http://localhost:54321',
  supabaseAnonKey || 'placeholder-key',
  { auth: { persistSession: false } }
);

module.exports = supabaseAdmin;
module.exports.admin = supabaseAdmin;
module.exports.anon = supabaseAnon;
