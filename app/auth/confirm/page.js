'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createBrowserSupabase, createEmailSupabase } from '@/lib/supabase'

export default function ConfirmPage() {
  const router = useRouter()
  const [status, setStatus] = useState('Starting…')
  const [debug, setDebug] = useState([])
  const [done, setDone] = useState(false)

  function log(msg) {
    setDebug(d => [...d, msg])
  }

  useEffect(() => {
    async function handle() {
      try {
        const supabase = createBrowserSupabase()
        const implicit = createEmailSupabase()
        const params = new URLSearchParams(window.location.search)

        const token_hash = params.get('token_hash')
        const type = params.get('type')
        const code = params.get('code')

        log(`URL search: ${window.location.search}`)
        log(`URL hash: ${window.location.hash}`)
        log(`token_hash: ${token_hash ? token_hash.slice(0, 20) + '…' : 'none'}`)
        log(`type: ${type}`)
        log(`code: ${code ? 'present' : 'none'}`)

        if (token_hash && token_hash.startsWith('pkce_')) {
          setStatus('Exchanging PKCE code…')
          log('Using exchangeCodeForSession with pkce_ token')
          const { error } = await supabase.auth.exchangeCodeForSession(token_hash)
          if (error) { log(`exchange error: ${error.message}`); setStatus(`Failed: ${error.message}`); return }
          log('exchange success → redirecting to set-password')
          setStatus('Success, redirecting…')
          setDone(true)
          router.replace('/auth/set-password')
          return
        }

        if (token_hash && type) {
          setStatus('Verifying OTP…')
          log('Using implicit.verifyOtp')
          const { data, error } = await implicit.auth.verifyOtp({ token_hash, type })
          if (error) { log(`verifyOtp error: ${error.message}`); setStatus(`Failed: ${error.message}`); return }
          log(`verifyOtp ok, session present: ${!!data?.session}`)
          if (data?.session) {
            log('setting session on browser client')
            const { error: setErr } = await supabase.auth.setSession({
              access_token: data.session.access_token,
              refresh_token: data.session.refresh_token,
            })
            if (setErr) { log(`setSession error: ${setErr.message}`); setStatus(`Failed: ${setErr.message}`); return }
            log('setSession ok')
          }
          setStatus('Success, redirecting…')
          setDone(true)
          router.replace('/auth/set-password')
          return
        }

        if (code) {
          setStatus('Exchanging code…')
          const { error } = await supabase.auth.exchangeCodeForSession(code)
          if (error) { log(`exchange error: ${error.message}`); setStatus(`Failed: ${error.message}`); return }
          setStatus('Success, redirecting…')
          setDone(true)
          router.replace('/auth/set-password')
          return
        }

        setStatus('No params found in URL')
      } catch (e) {
        log(`exception: ${e.message}`)
        setStatus(`Exception: ${e.message}`)
      }
    }
    handle()
  }, [router])

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)', padding: '20px' }}>
      <div style={{ background: 'white', borderRadius: '16px', padding: '24px', maxWidth: '600px', width: '100%' }}>
        <h2 style={{ marginTop: 0 }}>Verifying…</h2>
        <p><strong>Status:</strong> {status}</p>
        <pre style={{ background: '#f3f4f6', padding: '12px', borderRadius: '8px', fontSize: '12px', whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>
{debug.join('\n')}
        </pre>
        {!done && (
          <button onClick={() => router.push('/login')} style={{ marginTop: '12px' }}>Back to login</button>
        )}
      </div>
    </div>
  )
}
