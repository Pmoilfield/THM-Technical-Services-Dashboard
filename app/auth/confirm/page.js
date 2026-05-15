'use client'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

// This page handles Supabase auth redirects that arrive with tokens in the URL hash.
// Microsoft Safe Links cannot intercept hash fragments, so the token survives.
export default function ConfirmPage() {
  const router = useRouter()

  useEffect(() => {
    const hash = window.location.hash
    if (!hash) {
      router.replace('/login?step=no_hash')
      return
    }

    const params = new URLSearchParams(hash.slice(1))
    const error = params.get('error')
    const errorDesc = params.get('error_description')

    if (error) {
      router.replace(`/login?step=hash_error&err=${encodeURIComponent(errorDesc || error)}`)
      return
    }

    // Valid session tokens in hash — Supabase client will pick these up automatically.
    // Just redirect to set-password; the browser supabase client will hydrate the session.
    router.replace('/auth/set-password')
  }, [router])

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)' }}>
      <div style={{ color: '#94a3b8', fontSize: '14px' }}>Verifying your link…</div>
    </div>
  )
}
