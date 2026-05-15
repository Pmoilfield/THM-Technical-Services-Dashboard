'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createBrowserSupabase } from '@/lib/supabase'
import Link from 'next/link'

export default function NewPOForm({ project, existingPO = null }) {
  const router = useRouter()
  const supabase = createBrowserSupabase()
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const [form, setForm] = useState({
    po_number: existingPO?.po_number || '',
    vendor: existingPO?.vendor || '',
    date: existingPO?.date || new Date().toISOString().split('T')[0],
    section_number: existingPO?.section_number?.toString() || '',
    description: existingPO?.description || '',
    value: existingPO?.value?.toString() || '',
    markup: existingPO?.markup != null ? (existingPO.markup * 100).toString() : '',
    status: existingPO?.status || 'Open',
  })

  function set(f, v) { setForm(p => ({ ...p, [f]: v })) }

  const markupAmt = (parseFloat(form.value) || 0) * (parseFloat(form.markup) || 0) / 100
  const total = (parseFloat(form.value) || 0) + markupAmt

  function money(v) {
    return '$' + (v || 0).toLocaleString('en-CA', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!form.po_number || !form.vendor) { setError('PO number and vendor are required.'); return }
    setError('')
    setSaving(true)

    const payload = {
      project_id: project.id,
      po_number: form.po_number,
      vendor: form.vendor,
      date: form.date,
      section_number: form.section_number ? parseInt(form.section_number) : null,
      description: form.description || null,
      value: parseFloat(form.value) || 0,
      markup: form.markup ? parseFloat(form.markup) / 100 : null,
      status: form.status,
    }

    let err
    if (existingPO) {
      ({ error: err } = await supabase.from('purchase_orders').update(payload).eq('id', existingPO.id))
    } else {
      ({ error: err } = await supabase.from('purchase_orders').insert(payload))
    }

    if (err) { setError(err.message); setSaving(false); return }
    router.push(`/projects/${project.id}`)
    router.refresh()
  }

  return (
    <div className="grid" style={{ maxWidth: '680px' }}>
      <div className="page-header">
        <div className="split">
          <div>
            <h1>{existingPO ? `Edit ${existingPO.po_number}` : 'New Purchase Order'}</h1>
            <p className="muted">{project.name} · {project.client_name}</p>
          </div>
          <Link href={`/projects/${project.id}`}><button>Cancel</button></Link>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <section className="panel">
          <h2>PO details</h2>
          <div className="grid two" style={{ marginTop: '16px', gap: '14px' }}>
            <label>
              PO number *
              <input value={form.po_number} onChange={e => set('po_number', e.target.value)} placeholder="e.g. PO-2026-0001" required />
            </label>
            <label>
              Date
              <input type="date" value={form.date} onChange={e => set('date', e.target.value)} />
            </label>
            <label style={{ gridColumn: '1 / -1' }}>
              Vendor *
              <input value={form.vendor} onChange={e => set('vendor', e.target.value)} placeholder="Vendor / supplier name" required />
            </label>
            <label>
              Area / Section
              <input type="number" value={form.section_number} onChange={e => set('section_number', e.target.value)} placeholder="e.g. 1" />
            </label>
            <label>
              Status
              <select value={form.status} onChange={e => set('status', e.target.value)}>
                <option value="Open">Open</option>
                <option value="Closed">Closed</option>
              </select>
            </label>
            <label style={{ gridColumn: '1 / -1' }}>
              Description / scope
              <textarea value={form.description} onChange={e => set('description', e.target.value)} rows={2} placeholder="What this PO covers..." />
            </label>
          </div>
        </section>

        <section className="panel">
          <h2>Value</h2>
          <div className="grid two" style={{ marginTop: '16px', gap: '14px' }}>
            <label>
              PO value ($)
              <input type="number" step="0.01" min="0" value={form.value} onChange={e => set('value', e.target.value)} placeholder="0.00" />
            </label>
            <label>
              Markup %
              <input type="number" step="1" min="0" value={form.markup} onChange={e => set('markup', e.target.value)} placeholder="0" />
            </label>
          </div>
          <div style={{ marginTop: '16px', borderTop: '1px solid var(--line)', paddingTop: '16px', display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px', fontSize: '14px' }}>
            <div><div className="label">PO value</div><strong>{money(parseFloat(form.value) || 0)}</strong></div>
            <div><div className="label">Mark-up</div><strong>{money(markupAmt)}</strong></div>
            <div><div className="label">Total</div><strong style={{ fontSize: '20px' }}>{money(total)}</strong></div>
          </div>
        </section>

        {error && <div className="notice danger">{error}</div>}

        <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
          <Link href={`/projects/${project.id}`}><button type="button">Cancel</button></Link>
          <button type="submit" className="primary" disabled={saving}>
            {saving ? 'Saving...' : existingPO ? 'Save changes' : 'Create PO'}
          </button>
        </div>
      </form>
    </div>
  )
}
