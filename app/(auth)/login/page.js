'use client'
import { useState } from 'react'
import { createBrowserSupabase, createEmailSupabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [mode, setMode] = useState('login') // 'login' | 'newuser' | 'forgot'
  const [resetSent, setResetSent] = useState(false)
  const router = useRouter()
  const supabase = createBrowserSupabase()

  async function handleLogin(e) {
    e.preventDefault()
    setError('')
    setLoading(true)
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) {
      setError(error.message)
      setLoading(false)
    } else {
      router.push('/dashboard')
      router.refresh()
    }
  }

  async function handleReset(e) {
    e.preventDefault()
    setError('')
    setLoading(true)
    // Use implicit-flow client so the email token isn't pkce_-prefixed.
    // That makes the link verifiable on any device/browser the user opens it on.
    const emailClient = createEmailSupabase()
    const { error } = await emailClient.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/confirm`,
    })
    setLoading(false)
    if (error) {
      setError(error.message)
    } else {
      setResetSent(true)
    }
  }

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'linear-gradient(135deg, #0b172a 0%, #155e75 100%)',
      padding: '20px'
    }}>
      <div style={{
        background: 'white',
        borderRadius: '24px',
        padding: '40px',
        width: '100%',
        maxWidth: '420px',
        boxShadow: '0 25px 60px rgba(0,0,0,0.3)'
      }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <img src="/logo.png" alt="THM Technical Services" style={{ height: '60px', objectFit: 'contain' }} />
          <p style={{ margin: '12px 0 0', color: 'var(--muted)', fontSize: '14px' }}>
            Field Service Management
          </p>
        </div>

        {mode === 'login' ? (
          <>
            <form onSubmit={handleLogin}>
              <div style={{ display: 'grid', gap: '14px' }}>
                <label>
                  Email address
                  <input
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="you@thmtsgroup.com"
                    required
                    autoFocus
                  />
                </label>
                <label>
                  Password
                  <input
                    type="password"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                  />
                </label>

                {error && (
                  <div className="notice danger" style={{ textAlign: 'center' }}>
                    {error}
                  </div>
                )}

                <button
                  type="submit"
                  className="primary"
                  disabled={loading}
                  style={{ width: '100%', padding: '12px', fontSize: '15px', borderRadius: '12px', marginTop: '4px' }}
                >
                  {loading ? 'Signing in…' : 'Sign in'}
                </button>
              </div>
            </form>

            <div style={{ marginTop: '20px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <button
                type="button"
                onClick={() => { setMode('newuser'); setError('') }}
                style={{ width: '100%', padding: '11px', fontSize: '14px', borderRadius: '12px', border: '2px solid #c41e3a', background: 'white', color: '#c41e3a', cursor: 'pointer', fontWeight: 600 }}
              >
                New user? Set up your account
              </button>
              <button
                type="button"
                onClick={() => { setMode('forgot'); setError('') }}
                style={{ background: 'none', border: 'none', color: 'var(--muted)', fontSize: '13px', cursor: 'pointer', textDecoration: 'underline', padding: 0 }}
              >
                Forgot password
              </button>
            </div>
          </>
        ) : resetSent ? (
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '40px', marginBottom: '16px' }}>📧</div>
            <h3 style={{ marginBottom: '8px' }}>Check your email</h3>
            <p style={{ color: 'var(--muted)', fontSize: '14px', marginBottom: '24px' }}>
              A link has been sent to <strong>{email}</strong>. Click it to set your password.
            </p>
            <button
              type="button"
              onClick={() => { setMode('login'); setResetSent(false); setEmail('') }}
              style={{ background: 'none', border: 'none', color: '#c41e3a', fontSize: '13px', cursor: 'pointer', textDecoration: 'underline' }}
            >
              Back to sign in
            </button>
          </div>
        ) : (
          <>
            <h3 style={{ marginBottom: '4px' }}>
              {mode === 'newuser' ? 'Set your password' : 'Reset your password'}
            </h3>
            <p style={{ color: 'var(--muted)', fontSize: '13px', marginBottom: '20px' }}>
              {mode === 'newuser'
                ? "Enter your email and we'll send you a link to set up your password."
                : "Enter your email and we'll send you a password reset link."}
            </p>
            <form onSubmit={handleReset}>
              <div style={{ display: 'grid', gap: '14px' }}>
                <label>
                  Email address
                  <input
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="you@thmtsgroup.com"
                    required
                    autoFocus
                  />
                </label>

                {error && (
                  <div className="notice danger" style={{ textAlign: 'center' }}>
                    {error}
                  </div>
                )}

                <button
                  type="submit"
                  className="primary"
                  disabled={loading}
                  style={{ width: '100%', padding: '12px', fontSize: '15px', borderRadius: '12px', marginTop: '4px' }}
                >
                  {loading ? 'Sending…' : mode === 'newuser' ? 'Set password' : 'Send reset link'}
                </button>
              </div>
            </form>

            <div style={{ textAlign: 'center', marginTop: '16px' }}>
              <button
                type="button"
                onClick={() => { setMode('login'); setError('') }}
                style={{ background: 'none', border: 'none', color: '#c41e3a', fontSize: '13px', cursor: 'pointer', textDecoration: 'underline' }}
              >
                Back to sign in
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
