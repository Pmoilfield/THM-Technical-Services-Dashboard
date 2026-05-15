'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createBrowserSupabase } from '@/lib/supabase'

export default function ProposalForm({ proposal }) {
  const router = useRouter()
  const supabase = createBrowserSupabase()
  const isEdit = !!proposal
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [form, setForm] = useState({
    client_name: proposal?.client_name || '',
    contact_name: proposal?.contact_name || '',
    contact_phone: proposal?.contact_phone || '',
    contact_email: proposal?.contact_email || '',
    project_description: proposal?.project_description || '',
    location: proposal?.location || '',
    estimated_value: proposal?.estimated_value?.toString() || '',
    priority: proposal?.priority || 'Normal',
    due_date: proposal?.due_date || '',
    submitted_by: proposal?.submitted_by || '',
    notes: proposal?.notes || '',
    proposal_submitted_date: proposal?.proposal_submitted_date || '',
    proposal_added_date: proposal?.proposal_added_date || '',
  })

  function set(field, value) {
    setForm(prev => ({ ...prev, [field]: value }))
  }

  async function save() {
    if (!form.client_name && !form.project_description) {
      setError('Please enter at least a client name or description.')
      return
    }
    setSaving(true)
    setError('')
    const payload = {
      ...form,
      estimated_value: form.estimated_value ? parseFloat(form.estimated_value) : null,
      due_date: form.due_date || null,
      proposal_added_date: form.proposal_added_date || null,
      proposal_submitted_date: form.proposal_submitted_date || null,
      updated_at: new Date().toISOString(),
    }
    const { error: err } = isEdit
      ? await supabase.from('proposals').update(payload).eq('id', proposal.id)
      : await supabase.from('proposals').insert({ ...payload, status: 'New' })
    if (err) { setError(err.message); setSaving(false); return }
    router.push(isEdit ? `/proposals/${proposal.id}` : '/proposals')
    router.refresh()
  }

  const row = { display: 'grid', gap: '16px', gridTemplateColumns: '1fr 1fr' }

  return (
    <div className="grid" style={{ maxWidth: '740px' }}>
      <div className="page-header">
        <div className="split">
          <h1>{isEdit ? 'Edit Proposal' : 'New Proposal'}</h1>
          <div className="toolbar">
            <button onClick={() => router.back()}>Cancel</button>
            <button className="primary" onClick={save} disabled={saving}>{saving ? 'Saving…' : isEdit ? 'Save changes' : 'Submit proposal'}</button>
          </div>
        </div>
      </div>

      {error && <div className="notice danger">{error}</div>}

      <section className="panel">
        <h2>Client information</h2>
        <div style={{ ...row, marginTop: '14px' }}>
          <label>Client name<input value={form.client_name} onChange={e => set('client_name', e.target.value)} placeholder="Company or individual" /></label>
          <label>Location<input value={form.location} onChange={e => set('location', e.target.value)} placeholder="City / site" /></label>
          <label>Contact name<input value={form.contact_name} onChange={e => set('contact_name', e.target.value)} /></label>
          <label>Contact phone<input value={form.contact_phone} onChange={e => set('contact_phone', e.target.value)} /></label>
          <label style={{ gridColumn: '1 / -1' }}>Contact email<input type="email" value={form.contact_email} onChange={e => set('contact_email', e.target.value)} /></label>
        </div>
      </section>

      <section className="panel">
        <h2>Scope &amp; value</h2>
        <div style={{ ...row, marginTop: '14px' }}>
          <label style={{ gridColumn: '1 / -1' }}>
            Project description
            <textarea rows={4} value={form.project_description} onChange={e => set('project_description', e.target.value)} placeholder="Describe the scope of work…" />
          </label>
          <label>Estimated value ($)<input type="number" step="1000" min="0" value={form.estimated_value} onChange={e => set('estimated_value', e.target.value)} placeholder="0" /></label>
          <label>
            Priority
            <select value={form.priority} onChange={e => set('priority', e.target.value)}>
              <option>High</option>
              <option>Normal</option>
              <option>Low</option>
            </select>
          </label>
          <label>Proposal added date<input type="date" value={form.proposal_added_date} onChange={e => set('proposal_added_date', e.target.value)} /></label>
          <label>Due / tender date<input type="date" value={form.due_date} onChange={e => set('due_date', e.target.value)} /></label>
          <label>Submitted by<input value={form.submitted_by} onChange={e => set('submitted_by', e.target.value)} placeholder="Your name" /></label>
          <label>Proposal submitted to client<input type="date" value={form.proposal_submitted_date} onChange={e => set('proposal_submitted_date', e.target.value)} /></label>
          <label style={{ gridColumn: '1 / -1' }}>
            Notes
            <textarea rows={3} value={form.notes} onChange={e => set('notes', e.target.value)} placeholder="Any additional context…" />
          </label>
        </div>
      </section>
    </div>
  )
}
