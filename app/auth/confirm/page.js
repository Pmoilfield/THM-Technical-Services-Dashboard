'use client'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createBrowserSupabase } from '@/lib/supabase'

export default function ConfirmPage() {
  const router = useRouter()

  useEffect(() => {
    async function handle() {
      const supabase = createBrowserSupabase()

      // PKCE flow: code in query param (Safe Links can't execute JS to consume it)
      const params = new URLSearchParams(window.location.search)
      const code = params.get('code')
      if (code) {
        const { error } = await supabase.auth.exchangeCodeForSession(code)
        if (error) {
          router.replace(`/login?step=exchange_failed&err=${encodeURIComponent(error.message)}`)
        } else {
          router.replace('/auth/set-password')
        }
        return
      }

      // Implicit flow: tokens in hash fragment
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
