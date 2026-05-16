'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createUser } from '@/app/actions/createUser'

export default function NewUserForm() {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [email, setEmail] = useState('')
  const [fullName, setFullName] = useState('')
  const [role, setRole] = useState('worker')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [saving, setSaving] = useState(false)

  function generatePassword() {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789'
    let p = ''
    for (let i = 0; i < 12; i++) p += chars[Math.floor(Math.random() * chars.length)]
    setPassword(p)
    setConfirm(p)
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError(''); setSuccess('')
    if (password !== confirm) { setError('Passwords do not match'); return }
    if (password.length < 8) { setError('Password must be at least 8 characters'); return }

    setSaving(true)
    const res = await createUser({ email, password, fullName, role })
    setSaving(false)

    if (res.error) {
      setError(res.error)
    } else {
      setSuccess(`User created successfully. Share the password you set with them directly.`)
      setEmail(''); setFullName(''); setRole('worker'); setPassword(''); setConfirm('')
      router.refresh()
    }
  }

  if (!open) {
    return (
      <button className="primary" onClick={() => setOpen(true)}>+ Create new user</button>
    )
  }

  return (
    <section className="panel" style={{ marginBottom: '16px' }}>
      <h3 style={{ marginTop: 0 }}>Create new user</h3>
      <p className="fine-print" style={{ marginTop: 0 }}>
        Creates the account with a password you set. Share the password with them — they sign in directly, no email link needed.
      </p>
      <form onSubmit={handleSubmit}>
        <div style={{ display: 'grid', gap: '12px', gridTemplateColumns: '1fr 1fr' }}>
          <label>
            Email
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} required />
          </label>
          <label>
            Full name
            <input type="text" value={fullName} onChange={e => setFullName(e.target.value)} />
          </label>
          <label>
            Role
            <select value={role} onChange={e => setRole(e.target.value)}>
              <option value="worker">Worker — field access only, read-only data</option>
              <option value="foreman">Foreman — field access + can submit tickets</option>
              <option value="pm">PM — project management, estimates, dispatch</option>
              <option value="billing">Billing — invoices, financials, POs</option>
              <option value="admin">Admin — full access to everything</option>
            </select>
          </label>
          <div />
          <label>
            Password
            <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Min. 8 characters" required />
          </label>
          <label>
            Confirm password
            <input type="password" value={confirm} onChange={e => setConfirm(e.target.value)} required />
          </label>
        </div>

        <div style={{ marginTop: '12px', display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
          <button type="button" onClick={generatePassword} className="ghost">Generate password</button>
          <button type="submit" className="primary" disabled={saving}>
            {saving ? 'Creating…' : 'Create user'}
          </button>
          <button type="button" onClick={() => { setOpen(false); setError(''); setSuccess('') }} className="ghost">Cancel</button>
        </div>

        {error && <div className="notice danger" style={{ marginTop: '12px' }}>{error}</div>}
        {success && <div className="notice success" style={{ marginTop: '12px' }}><strong>{success}</strong></div>}
      </form>
    </section>
  )
}
