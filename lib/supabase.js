import { createBrowserClient } from '@supabase/ssr'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

// Browser client — safe to use in client components ('use client')
export function createBrowserSupabase() {
  return createBrowserClient(supabaseUrl, supabaseAnonKey)
}

// Separate client used ONLY to send password-reset / magic-link emails.
// Uses the implicit flow so the email token is a plain OTP (not pkce_-prefixed)
// which means /auth/confirm can verify it without needing a code_verifier
// from the user's localStorage. This is what makes the email link work
// regardless of which device/browser the user opens the email on.
export function createEmailSupabase() {
  return createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      flowType: 'implicit',
      persistSession: false,
      autoRefreshToken: false,
    },
  })
}
