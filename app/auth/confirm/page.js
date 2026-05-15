'use client'
import { useEffect } from 'react'

// This page is the Safe Links shield.
// Email links point HERE (a client page). Safe Links pre-fetches it
// but only gets HTML — no JavaScript runs, no tokens are consumed.
// When a real browser loads it, JS runs and redirects to the server
// route that actually verifies the token.
export default function ConfirmPage() {
  useEffect(() => {
    const search = window.location.search
    // Forward all query params to the server-side callback
    window.location.href = `/api/auth/callback${search}`
  }, [])

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)' }}>
      <div style={{ color: '#94a3b8', fontSize: '14px' }}>Verifying your link…</div>
    </div>
  )
}
