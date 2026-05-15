'use client'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createBrowserSupabase, createEmailSupabase } from '@/lib/supabase'

// Safe Links fix: this is a CLIENT page (no server handler).
// Safe Links fetches HTML only — cannot execute JS — so tokens survive.
// All token verification happens in JavaScript after the real browser loads.
export default function ConfirmPage() {
  const router = useRouter()

  useEffect(() => {
    async function handle() {
      const supabase = createBrowserSupabase()
      // Implicit-flow client for OTP verification (no code_verifier needed).
      const implicit = createEmailSupabase()
      const params = new URLSearchParams(window.location.search)

      const token_hash = params.get('token_hash')
      const type = params.get('type')
      const code = params.get('code')

      // PKCE-prefixed token_hash → exchangeCodeForSession (PKCE flow from @supabase/ssr)
      if (token_hash && token_hash.startsWith('pkce_')) {
        const { error } = await supabase.auth.exchangeCodeForSession(token_hash)
        if (error) {
          router.replace(`/login?step=pkce_failed&err=${encodeURIComponent(error.message)}`)
        } else {
          router.replace('/auth/set-password')
        }
        return
      }

      // Standard token_hash flow (non-PKCE) — verify with implicit client
      if (token_hash && type) {
        const { data, error } = await implicit.auth.verifyOtp({ token_hash, type })
        if (error) {
          router.replace(`/login?step=verify_failed&err=${encodeURIComponent(error.message)}`)
          return
        }
        // Move the session onto the persistent (PKCE) browser client so
        // /auth/set-password can call updateUser as the authenticated user.
        if (data?.session) {
          await supabase.auth.setSession({
            access_token: data.session.access_token,
            refresh_token: data.session.refresh_token,
          })
        }
        router.replace('/auth/set-password')
        return
      }

      // PKCE code flow (code in query param)
      if (code) {
        const { error } = await supabase.auth.exchangeCodeForSession(code)
        if (error) {
          router.replace(`/login?step=exchange_failed&err=${encodeURIComponent(error.message)}`)
        } else {
          router.replace('/auth/set-password')
        }
        return
      }

      // Hash fragment flow (fallback)
      const hash = window.location.hash
      if (hash) {
        const hashParams = new URLSearchParams(hash.slice(1))
        const error = hashParams.get('error')
        if (error) {
          router.replace(`/login?step=hash_error&err=${encodeURIComponent(hashParams.get('error_description') || error)}`)
          return
        }
        const accessToken = hashParams.get('access_token')
        const refreshToken = hashParams.get('refresh_token')
        if (accessToken && refreshToken) {
          await supabase.auth.setSession({ access_token: accessToken, refresh_token: refreshToken })
          router.replace('/auth/set-password')
          return
        }
      }

      router.replace('/login?step=no_params')
    }
    handle()
  }, [router])

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)' }}>
      <div style={{ color: '#94a3b8', fontSize: '14px' }}>Verifying your link…</div>
    </div>
  )
}
