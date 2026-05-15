'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createBrowserSupabase } from '@/lib/supabase'

const CATEGORIES = ['Materials', 'Equipment', 'Subcontractor', 'Services', 'Other']

const EMPTY = {
  name: '',
  category: '',
  contact_name: '',
  phone: '',
  email: '',
  address: '',
  website: '',
  notes: '',
  approved: true,
}

export default function VendorForm({ vendor }) {
  const router = useRouter()
  const supabase = createBrowserSupabase()
  const isEdit = !!vendor?.id
  const [form, setForm] = useState(vendor ? {
    name: vendor.name || '',
    category: vendor.category || '',
    contact_name: vendor.contact_name || '',
    phone: vendor.phone || '',
    email: vendor.email || '',
    address: vendor.address || '',
    website: vendor.website || '',
    notes: vendor.notes || '',
    approved: vendor.approved !== false,
  } : EMPTY)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  function set(field, value) {
    setForm(f => ({ ...f, [field]: value }))
  }

  async function save(e) {
    e.preventDefault()
    if (!form.name.trim()) return setError('Name is required.')
    setError('')
    setLoading(true)
    const payload = { ...form, name: form.name.trim() }
    const { error: err } = isEdit
      ? await supabase.from('vendors').update(payload).eq('id', vendor.id)
      : await supabase.from('vendors').insert(payload)
    if (err) { setError(err.message); setLoading(false); return }
    router.push('/vendors')
    router.refresh()
  }

  async function remove() {
    if (!confirm(`Delete ${form.name}? This cannot be undone.`)) return
    setLoading(true)
    await supabase.from('vendors').delete().eq('id', vendor.id)
    router.push('/vendors')
    router.refresh()
  }

  return (
    <form onSubmit={save} className="grid" style={{ maxWidth: '680px' }}>
      <section className="panel">
        <h2>Vendor details</h2>
        <div className="grid two" style={{ marginTop: '14px', gap: '12px' }}>
          <label style={{ gridColumn: '1 / -1' }}>
            Vendor name *
            <input value={form.name} onChange={e => set('name', e.target.value)} placeholder="e.g. Acklands Grainger" autoFocus />
          </label>
          <label>
            Category
            <select value={form.category} onChange={e => set('category', e.target.value)}>
              <option value="">— Select —</option>
              {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </label>
          <label>
            Approved supplier
            <select value={form.approved ? 'yes' : 'no'} onChange={e => set('approved', e.target.value === 'yes')}>
              <option value="yes">Yes — approved</option>
              <option value="no">No — not approved</option>
            </select>
          </label>
        </div>
      </section>

      <section className="panel">
        <h2>Contact</h2>
        <div className="grid two" style={{ marginTop: '14px', gap: '12px' }}>
          <label>
            Contact name
            <input value={form.contact_name} onChange={e => set('contact_name', e.target.value)} placeholder="e.g. Jane Smith" />
          </label>
          <label>
            Phone
            <input value={form.phone} onChange={e => set('phone', e.target.value)} placeholder="e.g. 780-555-0100" />
          </label>
          <label>
            Email
            <input type="email" value={form.email} onChange={e => set('email', e.target.value)} placeholder="e.g. orders@vendor.com" />
          </label>
          <label>
            Website
            <input value={form.website} onChange={e => set('website', e.target.value)} placeholder="e.g. https://vendor.com" />
          </label>
          <label style={{ gridColumn: '1 / -1' }}>
            Address
            <input value={form.address} onChange={e => set('address', e.target.value)} placeholder="e.g. 123 Industrial Ave, Edmonton, AB" />
          </label>
        </div>
      </section>

      <section className="panel">
        <h2>Notes</h2>
        <textarea
          value={form.notes}
          onChange={e => set('notes', e.target.value)}
          rows={3}
          placeholder="Account numbers, preferred products, lead times, etc."
          style={{ width: '100%', marginTop: '10px' }}
        />
      </section>

      {error && <p style={{ color: 'var(--danger)', fontSize: '13px' }}>{error}</p>}

      <div style={{ display: 'flex', gap: '10px', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button type="submit" className="primary" disabled={loading}>{loading ? 'Saving…' : isEdit ? 'Save changes' : 'Add vendor'}</button>
          <button type="button" onClick={() => router.back()} disabled={loading}>Cancel</button>
        </div>
        {isEdit && (
          <button type="button" className="danger" onClick={remove} disabled={loading}>Delete</button>
        )}
      </div>
    </form>
  )
}
