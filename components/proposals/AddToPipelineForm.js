'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createBrowserSupabase } from '@/lib/supabase'

export default function AddToPipelineForm() {
  const router = useRouter()
  const supabase = createBrowserSupabase()
  const [open, setOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [form, setForm] = useState({
    client_name: '',
    project_description: '',
    location: '',
    estimated_value: '',
    notes: '',
  })

  function set(field, value) { setForm(prev => ({ ...prev, [field]: value })) }

  async function save() {
    if (!form.client_name && !form.project_description) {
      setError('Enter at least a client or description.')
      return
    }
    setSaving(true)
    setError('')
    const { error: err } = await supabase.from('proposals').insert({
      ...form,
      estimated_value: form.estimated_value ? parseFloat(form.estimated_value) : null,
      status: 'Pipeline',
      priority: 'Normal',
      proposal_added_date: new Date().toISOString().slice(0, 10),
    })
    if (err) { setError(err.message); setSaving(false); return }
    setForm({ client_name: '', project_description: '', location: '', estimated_value: '', notes: '' })
    setOpen(false)
    router.refresh()
  }

  if (!open) {
    return <button onClick={() => setOpen(true)}>+ Add to Pipeline</button>
  }

  return (
    <section className="panel" style={{ marginBottom: '0' }}>
      <div className="split" style={{ marginBottom: '16px' }}>
        <h3 style={{ margin: 0 }}>Add to Pipeline</h3>
        <button className="ghost" onClick={() => { setOpen(false); setError('') }}>Cancel</button>
      </div>
      <div style={{ display: 'grid', gap: '12px', gridTemplateColumns: '1fr 1fr' }}>
        <label>Client<input value={form.client_name} onChange={e => set('client_name', e.target.value)} placeholder="Company name" /></label>
        <label>Location<input value={form.location} onChange={e => set('location', e.target.value)} placeholder="City / site" /></label>
        <label style={{ gridColumn: '1 / -1' }}>
          Description
          <textarea rows={2} value={form.project_description} onChange={e => set('project_description', e.target.value)} placeholder="Brief scope or opportunity description…" />
        </label>
        <label>Est. Value ($)<input type="number" value={form.estimated_value} onChange={e => set('estimated_value', e.target.value)} placeholder="0" /></label>
        <label>Notes<input value={form.notes} onChange={e => set('notes', e.target.value)} placeholder="Context, source, next steps…" /></label>
      </div>
      {error && <div className="notice danger" style={{ marginTop: '12px' }}>{error}</div>}
      <div style={{ marginTop: '12px', display: 'flex', gap: '8px' }}>
        <button className="primary" onClick={save} disabled={saving}>{saving ? 'Adding…' : 'Add to Pipeline'}</button>
      </div>
    </section>
  )
}
