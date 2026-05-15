'use client'
import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createBrowserSupabase } from '@/lib/supabase'
import Link from 'next/link'

const STATUSES = ['Estimating', 'Submitted', 'Awarded', 'Active', 'Complete', 'On Hold', 'Cancelled']

export default function NewProjectPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const supabase = createBrowserSupabase()
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [copyEstimate, setCopyEstimate] = useState(false)
  const [loadingTemplate, setLoadingTemplate] = useState(false)

  const [form, setForm] = useState({
    name: '',
    client_name: '',
    location: '',
    status: 'Estimating',
    estimate_no: '',
    internal_job_no: '',
    client_job_no: '',
    client_po_number: '',
    project_manager: '',
    gst_rate: '0.05',
    description: '',
  })

  const [template, setTemplate] = useState(null)

  useEffect(() => {
    const templateId = searchParams.get('template')
    if (templateId) {
      loadTemplate(templateId)
    }
  }, [searchParams])

  async function loadTemplate(templateId) {
    setLoadingTemplate(true)
    try {
      const { data: project, error: err } = await supabase
        .from('projects')
        .select('*')
        .eq('id', templateId)
        .single()

      if (err) {
        setError('Could not load template project')
        setLoadingTemplate(false)
        return
      }

      setTemplate(project)
      setForm({
        name: '',
        client_name: project.client_name || '',
        location: project.location || '',
        status: 'Estimating',
        estimate_no: '',
        internal_job_no: '',
        client_job_no: '',
        client_po_number: '',
        project_manager: project.project_manager || '',
        gst_rate: String(project.gst_rate || 0.05),
        description: project.description || '',
      })
    } catch (err) {
      setError('Error loading template')
    }
    setLoadingTemplate(false)
  }

  function set(field, value) {
    setForm(f => ({ ...f, [field]: value }))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setSaving(true)

    const { data, error: err } = await supabase
      .from('projects')
      .insert({
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
      })
      .select()
      .single()

    if (err) {
      setError(err.message)
      setSaving(false)
      return
    }

    const newProjectId = data.id

    if (copyEstimate && template) {
      try {
        const { data: sections } = await supabase
          .from('estimate_sections')
          .select('*')
          .eq('project_id', template.id)
          .order('number')

        if (sections && sections.length > 0) {
          for (const section of sections) {
            const { data: newSection } = await supabase
              .from('estimate_sections')
              .insert({
                project_id: newProjectId,
                number: section.number,
                title: section.title,
                sort_order: section.sort_order,
              })
              .select()
              .single()

            const { data: items } = await supabase
              .from('estimate_items')
              .select('*')
              .eq('section_id', section.id)
              .order('sort_order')

            if (items && items.length > 0) {
              const newItems = items.map(item => ({
                section_id: newSection.id,
                type: item.type,
                description: item.description,
                supplier: item.supplier,
                qty: item.qty,
                days: item.days,
                reg_hours: item.reg_hours,
                reg_rate: item.reg_rate,
                ot_hours: item.ot_hours,
                ot_rate: item.ot_rate,
                cost: item.cost,
                markup: item.markup,
                rate_id: item.rate_id,
                category: item.category,
                equip_period: item.equip_period,
                quote_url: item.quote_url,
                quote_filename: item.quote_filename,
                sort_order: item.sort_order,
              }))

              await supabase
                .from('estimate_items')
                .insert(newItems)
            }
          }
        }
      } catch (copyErr) {
        setError('Project created, but could not copy estimate structure: ' + copyErr.message)
        setSaving(false)
        setTimeout(() => router.push(`/projects/${newProjectId}`), 2000)
        return
      }
    }

    router.push(`/projects/${newProjectId}`)
  }

  if (loadingTemplate) {
    return (
      <div className="grid" style={{ maxWidth: '680px' }}>
        <div className="page-header">
          <div>
            <h1>Loading template...</h1>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="grid" style={{ maxWidth: '680px' }}>
      <div className="page-header">
        <div className="split">
          <div>
            <h1>{template ? 'New Project from Template' : 'New Project'}</h1>
            <p className="muted">{template ? `Based on: ${template.name}` : 'Set up a new project with estimate and scope'}</p>
          </div>
          <Link href="/projects"><button>Cancel</button></Link>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <section className="panel">
          <h2>Project details</h2>
          <div className="grid two" style={{ marginTop: '16px', gap: '14px' }}>
            <label style={{ gridColumn: '1 / -1' }}>
              Project name *
              <input
                value={form.name}
                onChange={e => set('name', e.target.value)}
                placeholder="e.g. Pembina Pipeline — Station 12 Expansion"
                required
              />
            </label>

            <label>
              Client name
              <input
                value={form.client_name}
                onChange={e => set('client_name', e.target.value)}
                placeholder="e.g. Pembina Pipeline"
              />
            </label>

            <label>
              Location
              <input
                value={form.location}
                onChange={e => set('location', e.target.value)}
                placeholder="e.g. Fox Creek, AB"
              />
            </label>

            <label>
              Estimate number
              <input
                value={form.estimate_no}
                onChange={e => set('estimate_no', e.target.value)}
                placeholder="e.g. EST-2025-014"
              />
            </label>

            <label>
              Internal job number
              <input
                value={form.internal_job_no}
                onChange={e => set('internal_job_no', e.target.value)}
                placeholder="e.g. THM-2025-014"
              />
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
              <input
                value={form.project_manager}
                onChange={e => set('project_manager', e.target.value)}
                placeholder="e.g. Parker"
              />
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
              <textarea
                value={form.description}
                onChange={e => set('description', e.target.value)}
                rows={3}
                placeholder="Brief description of the project scope..."
              />
            </label>

            {template && (
              <label style={{ gridColumn: '1 / -1', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 'normal' }}>
                <input
                  type="checkbox"
                  checked={copyEstimate}
                  onChange={e => setCopyEstimate(e.target.checked)}
                  style={{ width: 'auto', cursor: 'pointer' }}
                />
                Copy estimate structure from template (sections and line items)
              </label>
            )}
          </div>

          {error && <div className="notice danger" style={{ marginTop: '14px' }}>{error}</div>}

          <div style={{ marginTop: '20px', display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
            <Link href="/projects"><button type="button">Cancel</button></Link>
            <button type="submit" className="primary" disabled={saving}>
              {saving ? 'Creating...' : 'Create project'}
            </button>
          </div>
        </section>
      </form>
    </div>
  )
}
