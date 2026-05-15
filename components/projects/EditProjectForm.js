'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createBrowserSupabase } from '@/lib/supabase'
import Link from 'next/link'

const STATUSES = ['Estimating', 'Submitted', 'Awarded', 'Active', 'Complete', 'On Hold', 'Cancelled']

export default function EditProjectForm({ project }) {
  const router = useRouter()
  const supabase = createBrowserSupabase()
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const [form, setForm] = useState({
    name: project.name || '',
    client_name: project.client_name || '',
    location: project.location || '',
    status: project.status || 'Estimating',
    estimate_no: project.estimate_no || '',
    internal_job_no: project.internal_job_no || '',
    client_job_no: project.client_job_no || '',
    client_po_number: project.client_po_number || '',
    project_manager: project.project_manager || '',
    gst_rate: project.gst_rate?.toString() || '0.05',
    description: project.description || '',
  })

  function set(field, value) {
    setForm(f => ({ ...f, [field]: value }))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setSaving(true)

    const { error: err } = await supabase
      .from('projects')
      .update({
        name: form.name,
        client_name: form.client_name || null,
        location: form.location || null,
        status: form.status,
        estimate_no: form.estimate_no || null,
        internal_job_no: form.internal_job_no || null,
        client_job_no: form.client_job_no || null,
        client_po_number: form.client_po_number || null,
        project_manager: form.project_manager || null,
        gst_rate: parseFloat(form.gst_rate) || 0.05,
        description: form.description || null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', project.id)

    if (err) {
      setError(err.message)
      setSaving(false)
    } else {
      router.push(`/projects/${project.id}`)
      router.refresh()
    }
  }

  return (
    <div className="grid" style={{ maxWidth: '680px' }}>
      <div className="page-header">
        <div className="split">
          <div>
            <h1>Edit Project</h1>
            <p className="muted">{project.name}</p>
          </div>
          <Link href={`/projects/${project.id}`}><button>Cancel</button></Link>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <section className="panel">
          <h2>Project details</h2>
          <div className="grid two" style={{ marginTop: '16px', gap: '14px' }}>
            <label style={{ gridColumn: '1 / -1' }}>
              Project name *
              <input value={form.name} onChange={e => set('name', e.target.value)} required />
            </label>

            <label>
              Client name
              <input value={form.client_name} onChange={e => set('client_name', e.target.value)} placeholder="e.g. Pembina Pipeline" />
            </label>

            <label>
              Location
              <input value={form.location} onChange={e => set('location', e.target.value)} placeholder="e.g. Fox Creek, AB" />
            </label>

            <label>
              Estimate number
              <input value={form.estimate_no} onChange={e => set('estimate_no', e.target.value)} placeholder="e.g. EST-2025-014" />
            </label>

            <label>
              Internal job number
              <input value={form.internal_job_no} onChange={e => set('internal_job_no', e.target.value)} placeholder="e.g. THM-2025-014" />
            </label>

            <label>
              Client job number
              <input value={form.client_job_no} onChange={e => set('client_job_no', e.target.value)} placeholder="e.g. CJ-2026-0042" />
            </label>

            <label>
              Client PO #
              <input value={form.client_po_number} onChange={e => set('client_po_number', e.target.value)} placeholder="e.g. PO-987654" />
            </label>

            <label>
              Project manager
              <input value={form.project_manager} onChange={e => set('project_manager', e.target.value)} placeholder="e.g. Parker" />
            </label>

            <label>
              Status
              <select value={form.status} onChange={e => set('status', e.target.value)}>
                {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </label>

            <label>
              GST rate
              <select value={form.gst_rate} onChange={e => set('gst_rate', e.target.value)}>
                <option value="0.05">5% (standard)</option>
                <option value="0">0% (exempt)</option>
              </select>
            </label>

            <label style={{ gridColumn: '1 / -1' }}>
              Description / scope notes
              <textarea value={form.description} onChange={e => set('description', e.target.value)} rows={3} placeholder="Brief description of the project scope..." />
            </label>
          </div>

          {error && <div className="notice danger" style={{ marginTop: '14px' }}>{error}</div>}

          <div style={{ marginTop: '20px', display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
            <Link href={`/projects/${project.id}`}><button type="button">Cancel</button></Link>
            <button type="submit" className="primary" disabled={saving}>
              {saving ? 'Saving...' : 'Save changes'}
            </button>
          </div>
        </section>
      </form>
    </div>
  )
}
