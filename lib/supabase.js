import { createBrowserClient } from '@supabase/ssr'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

// Browser client — safe to use in client components ('use client')
// Use implicit flow so password-reset email tokens don't require a
// PKCE code_verifier from localStorage (which fails if user opens the
// link in a different browser context than where they requested it).
export function createBrowserSupabase() {
  return createBrowserClient(supabaseUrl, supabaseAnonKey, {
    auth: { flowType: 'implicit' },
  })
}
