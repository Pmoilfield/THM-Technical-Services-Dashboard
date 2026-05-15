'use client'
import { useState } from 'react'
import { createBrowserSupabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
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

        <p style={{ textAlign: 'center', marginTop: '20px', fontSize: '13px', color: 'var(--muted)' }}>
          No account? Contact your administrator to get access.
        </p>
      </div>
    </div>
  )
}
