'use client'
import { useState } from 'react'
import { saveSettings } from '@/app/actions/saveSettings'

export default function SettingsForm({ s }) {
  const [form, setForm] = useState({
    company_name:     s.company_name     || 'THM Technical Services',
    currency:         s.currency         || 'CAD',
    gst_rate:         String(Number(s.gst_rate     || 0.05) * 100),
    default_markup:   String(Number(s.default_markup || 0)  * 100),
    default_province: s.default_province || 'Alberta',
    invoice_terms:    s.invoice_terms    || 'Net 30',
  })
  const [saving, setSaving] = useState(false)
  const [saved,  setSaved]  = useState(false)
  const [error,  setError]  = useState('')

  function set(key, val) { setForm(p => ({ ...p, [key]: val })) }

  async function handleSubmit(e) {
    e.preventDefault()
    setSaving(true); setError(''); setSaved(false)

    const payload = {
      ...form,
      gst_rate:       String(parseFloat(form.gst_rate)       / 100 || 0.05),
      default_markup: String(parseFloat(form.default_markup) / 100 || 0),
    }

    const res = await saveSettings(payload)
    setSaving(false)
    if (res.error) { setError(res.error) } else { setSaved(true); setTimeout(() => setSaved(false), 3000) }
  }

  return (
    <section className="panel">
      <h2>Company</h2>
      <form onSubmit={handleSubmit}>
        <div className="form-grid two" style={{ marginTop: '14px' }}>
          <label>Company name
            <input value={form.company_name} onChange={e => set('company_name', e.target.value)} />
          </label>
          <label>Currency
            <input value={form.currency} onChange={e => set('currency', e.target.value)} />
          </label>
          <label>GST rate %
            <input type="number" step="0.1" min="0" max="100" value={form.gst_rate} onChange={e => set('gst_rate', e.target.value)} />
          </label>
          <label>Default markup %
            <input type="number" step="0.1" min="0" value={form.default_markup} onChange={e => set('default_markup', e.target.value)} />
          </label>
          <label>Default province
            <input value={form.default_province} onChange={e => set('default_province', e.target.value)} />
          </label>
          <label>Invoice payment terms
            <input value={form.invoice_terms} onChange={e => set('invoice_terms', e.target.value)} />
          </label>
        </div>
        <div className="toolbar" style={{ marginTop: '16px' }}>
          <button type="submit" className="primary" disabled={saving}>
            {saving ? 'Saving…' : 'Save settings'}
          </button>
          {saved  && <span style={{ fontSize: '13px', color: '#15803d', fontWeight: 600 }}>✓ Saved</span>}
          {error  && <span style={{ fontSize: '13px', color: '#374151' }}>{error}</span>}
        </div>
      </form>
    </section>
  )
}
