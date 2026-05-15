'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createBrowserSupabase } from '@/lib/supabase'
import Link from 'next/link'

const EQUIPMENT_CATEGORIES = ['Equipment', 'TC Equipment', 'Operator']
function isEquip(cat) {
  return EQUIPMENT_CATEGORIES.includes(cat) || (cat || '').toLowerCase().includes('equipment')
}

const EMPTY_FORM = {
  category: '', personnel: '',
  straight_rate: '', overtime_rate: '',
  hourly_rate: '', daily_rate: '', weekly_rate: '', monthly_rate: '',
  province: '',
}

function RateModal({ form, setForm, existingCategories, onSave, onClose, saving, error, isEdit }) {
  const equip = isEquip(form.category)

  function field(label, key, opts = {}) {
    return (
      <div>
        <div className="label" style={{ marginBottom: '4px' }}>{label}</div>
        <input
          type={opts.type || 'text'}
          step={opts.step} min={opts.min}
          placeholder={opts.placeholder || ''}
          value={form[key]}
          onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
          onFocus={opts.select ? e => e.target.select() : undefined}
          style={{ width: '100%' }}
        />
      </div>
    )
  }

  return (
    <div
      style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
      onClick={onClose}
    >
      <div
        style={{ background: '#fff', borderRadius: '16px', padding: '28px', width: '480px', boxShadow: '0 8px 40px rgba(0,0,0,0.18)' }}
        onClick={e => e.stopPropagation()}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h2 style={{ margin: 0, fontSize: '17px' }}>{isEdit ? 'Edit rate' : 'Add rate'}</h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: '22px', cursor: 'pointer', color: 'var(--muted)', lineHeight: 1 }}>×</button>
        </div>

        {error && <div className="notice danger" style={{ marginBottom: '14px' }}>{error}</div>}

        <div style={{ display: 'grid', gap: '14px' }}>
          <div>
            <div className="label" style={{ marginBottom: '4px' }}>Category</div>
            <input
              list="category-list"
              placeholder="e.g. Electrical, Equipment…"
              value={form.category}
              onChange={e => setForm(f => ({ ...f, category: e.target.value }))}
              style={{ width: '100%' }}
            />
            <datalist id="category-list">
              {existingCategories.map(c => <option key={c} value={c} />)}
            </datalist>
          </div>

          {field('Role / Description', 'personnel', { placeholder: 'e.g. Journeyman, Excavator' })}

          {equip ? (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              {field('Hourly Rate ($/hr)', 'hourly_rate', { type: 'number', step: '0.01', min: '0', placeholder: 'Optional', select: true })}
              {field('Daily Rate ($/day)', 'daily_rate', { type: 'number', step: '0.01', min: '0', placeholder: 'Optional', select: true })}
              {field('Weekly Rate ($/wk)', 'weekly_rate', { type: 'number', step: '0.01', min: '0', placeholder: 'Optional', select: true })}
              {field('Monthly Rate ($/mo)', 'monthly_rate', { type: 'number', step: '0.01', min: '0', placeholder: 'Optional', select: true })}
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              {field('Straight Time ($/hr)', 'straight_rate', { type: 'number', step: '0.01', min: '0', select: true })}
              {field('Overtime ($/hr)', 'overtime_rate', { type: 'number', step: '0.01', min: '0', placeholder: 'Optional', select: true })}
            </div>
          )}

          <div>
            <div className="label" style={{ marginBottom: '4px' }}>Province <span style={{ color: 'var(--muted)', fontWeight: 400 }}>(optional)</span></div>
            <input
              list="province-list"
              placeholder="e.g. AB, BC"
              value={form.province}
              onChange={e => setForm(f => ({ ...f, province: e.target.value }))}
              style={{ width: '100%' }}
            />
            <datalist id="province-list">
              {['AB', 'BC', 'SK', 'MB', 'ON', 'QC'].map(p => <option key={p} value={p} />)}
            </datalist>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '10px', marginTop: '22px', justifyContent: 'flex-end' }}>
          <button onClick={onClose}>Cancel</button>
          <button className="primary" onClick={onSave} disabled={saving}>
            {saving ? 'Saving…' : isEdit ? 'Save changes' : 'Add rate'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default function ClientRatesPage({ client: initialClient, initialRates, isNew }) {
  const router = useRouter()
  const supabase = createBrowserSupabase()

  const [clientName, setClientName] = useState(initialClient)
  const [rates, setRates] = useState(initialRates)
  const [modal, setModal] = useState(null)
  const [form, setForm] = useState(EMPTY_FORM)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [deleting, setDeleting] = useState(null)
  const [confirmDelete, setConfirmDelete] = useState(null)
  const [clientSaving, setClientSaving] = useState(false)
  const [clientError, setClientError] = useState('')

  const existingCategories = [...new Set(rates.map(r => r.category))].sort()
  const categories = [...new Set(rates.map(r => r.category))].sort()

  function openAdd() { setForm(EMPTY_FORM); setError(''); setModal('add') }
  function openEdit(rate) {
    setForm({
      category:      rate.category || '',
      personnel:     rate.personnel || '',
      straight_rate: rate.straight_rate?.toString() || '',
      overtime_rate: rate.overtime_rate?.toString() || '',
      hourly_rate:   rate.hourly_rate?.toString() || '',
      daily_rate:    rate.daily_rate?.toString() || '',
      weekly_rate:   rate.weekly_rate?.toString() || '',
      monthly_rate:  rate.monthly_rate?.toString() || '',
      province:      rate.province || '',
    })
    setError('')
    setModal(rate)
  }

  async function handleSave() {
    if (!form.category.trim())   { setError('Category is required.'); return }
    if (!form.personnel.trim())  { setError('Role / description is required.'); return }
    const equip = isEquip(form.category)
    if (!equip && !form.straight_rate) { setError('Straight time rate is required.'); return }
    setSaving(true); setError('')

    const payload = {
      client:        clientName.trim(),
      category:      form.category.trim(),
      personnel:     form.personnel.trim(),
      province:      form.province.trim() || null,
      straight_rate: form.straight_rate ? parseFloat(form.straight_rate) : null,
      overtime_rate: form.overtime_rate ? parseFloat(form.overtime_rate) : null,
      hourly_rate:   form.hourly_rate   ? parseFloat(form.hourly_rate)   : null,
      daily_rate:    form.daily_rate    ? parseFloat(form.daily_rate)    : null,
      weekly_rate:   form.weekly_rate   ? parseFloat(form.weekly_rate)   : null,
      monthly_rate:  form.monthly_rate  ? parseFloat(form.monthly_rate)  : null,
    }

    if (modal === 'add') {
      const { data, error: err } = await supabase.from('rates').insert(payload).select().single()
      if (err) { setError(err.message); setSaving(false); return }
      setRates(prev => [...prev, data].sort((a, b) =>
        (a.category || '').localeCompare(b.category || '') ||
        (a.personnel || '').localeCompare(b.personnel || '')
      ))
    } else {
      const { data, error: err } = await supabase.from('rates').update(payload).eq('id', modal.id).select().single()
      if (err) { setError(err.message); setSaving(false); return }
      setRates(prev => prev.map(r => r.id === data.id ? data : r))
    }
    setSaving(false); setModal(null)
  }

  async function handleDelete(rate) {
    setDeleting(rate.id)
    await supabase.from('rates').delete().eq('id', rate.id)
    setRates(prev => prev.filter(r => r.id !== rate.id))
    setDeleting(null); setConfirmDelete(null)
  }

  async function handleCreateClient() {
    if (!clientName.trim()) { setClientError('Client name is required.'); return }
    setClientSaving(true); setClientError('')
    router.push(`/rates/${encodeURIComponent(clientName.trim())}`)
  }

  const thStyle = { padding: '6px 8px', background: '#f8fafc', fontWeight: 700, fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.04em', color: '#475467', borderBottom: '2px solid var(--line)', whiteSpace: 'nowrap' }
  const tdStyle = { padding: '7px 8px', fontSize: '13px', borderBottom: '1px solid var(--line)' }

  return (
    <div className="grid">
      {modal && (
        <RateModal
          form={form} setForm={setForm}
          existingCategories={existingCategories}
          onSave={handleSave} onClose={() => setModal(null)}
          saving={saving} error={error} isEdit={modal !== 'add'}
        />
      )}

      {confirmDelete && (
        <div
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          onClick={() => setConfirmDelete(null)}
        >
          <div
            style={{ background: '#fff', borderRadius: '14px', padding: '28px', width: '360px', boxShadow: '0 8px 40px rgba(0,0,0,0.18)' }}
            onClick={e => e.stopPropagation()}
          >
            <h2 style={{ margin: '0 0 10px', fontSize: '16px' }}>Delete rate?</h2>
            <p style={{ fontSize: '14px', color: 'var(--muted)', margin: '0 0 20px' }}>
              <strong>{confirmDelete.personnel}</strong> — {confirmDelete.category}<br />
              This cannot be undone.
            </p>
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
              <button onClick={() => setConfirmDelete(null)}>Cancel</button>
              <button
                style={{ background: 'var(--danger)', color: '#fff', border: 'none' }}
                disabled={deleting === confirmDelete.id}
                onClick={() => handleDelete(confirmDelete)}
              >
                {deleting === confirmDelete.id ? 'Deleting…' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="page-header">
        <div className="split">
          <div>
            <Link href="/rates" style={{ fontSize: '13px', color: 'var(--muted)', textDecoration: 'none' }}>← Rate Schedules</Link>
            <h1 style={{ marginTop: '4px' }}>{isNew ? 'New Client' : clientName}</h1>
          </div>
          {!isNew && (
            <button className="primary" onClick={openAdd}>+ Add Rate</button>
          )}
        </div>
      </div>

      {isNew ? (
        <section className="panel">
          <div style={{ maxWidth: '400px', display: 'grid', gap: '14px' }}>
            <label>
              Client name
              <input
                autoFocus
                value={clientName}
                onChange={e => setClientName(e.target.value)}
                placeholder="e.g. Imperial Oil, Enbridge"
              />
            </label>
            {clientError && <div className="notice danger">{clientError}</div>}
            <div style={{ display: 'flex', gap: '10px' }}>
              <Link href="/rates"><button type="button">Cancel</button></Link>
              <button className="primary" onClick={handleCreateClient} disabled={clientSaving}>
                {clientSaving ? 'Creating…' : 'Create & add rates'}
              </button>
            </div>
          </div>
        </section>
      ) : (
        <>
          {rates.length === 0 && (
            <section className="panel">
              <p className="empty">No rates yet for {clientName}. Click <strong>+ Add Rate</strong> to get started.</p>
            </section>
          )}

          {categories.map(category => {
            const catRates = rates.filter(r => r.category === category)
            const hasProvince = catRates.some(r => r.province)
            const equipCat = isEquip(category)

            return (
              <section className="panel" key={category}>
                <h2 style={{ marginBottom: '14px' }}>{category}</h2>
                <div className="table-wrap">
                  <table style={{ fontSize: '13px' }}>
                    <thead>
                      <tr>
                        <th style={thStyle}>Role</th>
                        {hasProvince && <th style={thStyle}>Province</th>}
                        {equipCat ? (
                          <>
                            <th style={{ ...thStyle, textAlign: 'right' }}>Hourly</th>
                            <th style={{ ...thStyle, textAlign: 'right' }}>Daily</th>
                            <th style={{ ...thStyle, textAlign: 'right' }}>Weekly</th>
                            <th style={{ ...thStyle, textAlign: 'right' }}>Monthly</th>
                          </>
                        ) : (
                          <>
                            <th style={{ ...thStyle, textAlign: 'right' }}>Straight Time</th>
                            <th style={{ ...thStyle, textAlign: 'right' }}>Overtime</th>
                          </>
                        )}
                        <th style={{ ...thStyle, width: '80px' }} />
                      </tr>
                    </thead>
                    <tbody>
                      {catRates.map(rate => (
                        <tr key={rate.id}>
                          <td style={tdStyle}><strong>{rate.personnel}</strong></td>
                          {hasProvince && <td style={{ ...tdStyle, color: 'var(--muted)', fontSize: '12px' }}>{rate.province || '—'}</td>}
                          {equipCat ? (
                            <>
                              <td style={{ ...tdStyle, textAlign: 'right' }}>{rate.hourly_rate  ? `$${Number(rate.hourly_rate).toFixed(2)}/hr`  : <span style={{ color: 'var(--muted)' }}>—</span>}</td>
                              <td style={{ ...tdStyle, textAlign: 'right', fontWeight: 700 }}>{rate.daily_rate   ? `$${Number(rate.daily_rate).toFixed(2)}/day`  : <span style={{ color: 'var(--muted)', fontWeight: 400 }}>—</span>}</td>
                              <td style={{ ...tdStyle, textAlign: 'right' }}>{rate.weekly_rate  ? `$${Number(rate.weekly_rate).toFixed(2)}/wk`   : <span style={{ color: 'var(--muted)' }}>—</span>}</td>
                              <td style={{ ...tdStyle, textAlign: 'right' }}>{rate.monthly_rate ? `$${Number(rate.monthly_rate).toFixed(2)}/mo`  : <span style={{ color: 'var(--muted)' }}>—</span>}</td>
                            </>
                          ) : (
                            <>
                              <td style={{ ...tdStyle, textAlign: 'right', fontWeight: 700 }}>${Number(rate.straight_rate).toFixed(2)}/hr</td>
                              <td style={{ ...tdStyle, textAlign: 'right', color: rate.overtime_rate ? 'inherit' : 'var(--muted)' }}>
                                {rate.overtime_rate ? `$${Number(rate.overtime_rate).toFixed(2)}/hr` : '—'}
                              </td>
                            </>
                          )}
                          <td style={{ ...tdStyle, textAlign: 'right' }}>
                            <div style={{ display: 'flex', gap: '6px', justifyContent: 'flex-end' }}>
                              <button className="small" onClick={() => openEdit(rate)}>Edit</button>
                              <button className="small" style={{ color: 'var(--danger)', borderColor: 'var(--danger)' }} onClick={() => setConfirmDelete(rate)}>×</button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>
            )
          })}
        </>
      )}
    </div>
  )
}
