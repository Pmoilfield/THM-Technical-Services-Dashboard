'use client'
import { useState, useEffect, useRef } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createBrowserSupabase } from '@/lib/supabase'
import Link from 'next/link'

function FileDropModal({ onFile, onClose }) {
  const [dragging, setDragging] = useState(false)
  const inputRef = useRef()
  function handle(file) { if (!file) return; onFile(file); onClose() }
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={onClose}>
      <div style={{ background: '#fff', borderRadius: '16px', padding: '32px', width: '420px', boxShadow: '0 8px 40px rgba(0,0,0,0.18)' }} onClick={e => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h2 style={{ margin: 0, fontSize: '16px' }}>Attach document</h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: '22px', cursor: 'pointer', color: 'var(--muted)', lineHeight: 1 }}>×</button>
        </div>
        <div
          onDragOver={e => { e.preventDefault(); setDragging(true) }}
          onDragLeave={() => setDragging(false)}
          onDrop={e => { e.preventDefault(); setDragging(false); handle(e.dataTransfer.files[0]) }}
          onClick={() => inputRef.current.click()}
          style={{ border: `2px dashed ${dragging ? '#111' : '#d1d5db'}`, borderRadius: '12px', padding: '40px 24px', textAlign: 'center', cursor: 'pointer', background: dragging ? '#f4f4f5' : '#fafafa', transition: 'all 0.15s' }}
        >
          <div style={{ fontSize: '36px', marginBottom: '10px' }}>📎</div>
          <div style={{ fontWeight: 600, fontSize: '14px', marginBottom: '6px' }}>{dragging ? 'Drop to attach' : 'Drop file here or click to browse'}</div>
          <div style={{ fontSize: '12px', color: 'var(--muted)' }}>PDF, Word, Excel, or image</div>
          <input ref={inputRef} type="file" accept=".pdf,.doc,.docx,.xls,.xlsx,.png,.jpg" style={{ display: 'none' }} onChange={e => handle(e.target.files[0])} />
        </div>
      </div>
    </div>
  )
}

const ITEM_TYPES = ['Labour', 'Equipment', 'Material', 'Subcontractor']

function emptyItem(type) {
  return {
    _key: Math.random(),
    type,
    worker_name: '',
    role: '',
    rate_id: '',
    straight_hours: '',
    straight_rate: '',
    overtime_hours: '',
    overtime_rate: '',
    travel_hours: '',
    vendor: '',
    description: '',
    quantity: '',
    unit_cost: '',
    equip_period: 'daily',
    markup_pct: '',
    quote_url: '',
    quote_filename: '',
    total: 0,
  }
}

function equipRateForPeriod(rate, period) {
  const map = { hourly: rate.hourly_rate, daily: rate.daily_rate, weekly: rate.weekly_rate, monthly: rate.monthly_rate }
  return map[period]?.toString() || ''
}

function calcItemTotal(item) {
  if (item.type === 'Labour') {
    const st = (parseFloat(item.straight_hours) || 0) * (parseFloat(item.straight_rate) || 0)
    const ot = (parseFloat(item.overtime_hours) || 0) * (parseFloat(item.overtime_rate) || 0)
    const tr = (parseFloat(item.travel_hours) || 0) * (parseFloat(item.straight_rate) || 0)
    return st + ot + tr
  }
  if (item.type === 'Equipment') {
    return (parseFloat(item.quantity) || 0) * (parseFloat(item.unit_cost) || 0)
  }
  if (item.type === 'Material') {
    const base = (parseFloat(item.quantity) || 0) * (parseFloat(item.unit_cost) || 0)
    const markup = 1 + (parseFloat(item.markup_pct) || 0) / 100
    return base * markup
  }
  if (item.type === 'Subcontractor') {
    return parseFloat(item.total) || 0
  }
  return 0
}

function money(v) {
  return '$' + (parseFloat(v) || 0).toLocaleString('en-CA', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}


export default function NewFieldTicketPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const supabase = createBrowserSupabase()

  const [projects, setProjects] = useState([])
  const [rates, setRates] = useState([])
  const [workers, setWorkers] = useState([])
  const [saving, setSaving] = useState(false)
  const [exporting, setExporting] = useState(false)
  const [error, setError] = useState('')
  const [quoteModal, setQuoteModal] = useState(null)
  const [uploading, setUploading] = useState(null)

  const [form, setForm] = useState({
    project_id: searchParams.get('project') || '',
    date: new Date().toISOString().split('T')[0],
    section_number: '',
    description: '',
    default_markup: '10',
  })

  const [items, setItems] = useState([emptyItem('Labour')])

  useEffect(() => {
    async function load() {
      const [{ data: p }, { data: r }, { data: w }] = await Promise.all([
        supabase.from('projects').select('id, name, client_name').order('name'),
        supabase.from('rates').select('*').order('category').order('personnel'),
        supabase.from('workers').select('*').eq('active', true).order('name'),
      ])
      setProjects(p || [])
      setRates(r || [])
      setWorkers(w || [])
    }
    load()
  }, [])

  const equipmentCategories = ['Equipment', 'TC Equipment', 'Operator']
  const labourRates = rates.filter(r => !equipmentCategories.includes(r.category))
  const equipmentRates = rates.filter(r => equipmentCategories.includes(r.category))

  function setField(f, v) { setForm(prev => ({ ...prev, [f]: v })) }

  async function uploadQuote(itemKey, file) {
    setUploading(itemKey)
    const path = `field-tickets/materials/${Date.now()}-${file.name}`
    const { error: upErr } = await supabase.storage.from('quotes').upload(path, file, { upsert: true })
    if (upErr) { setUploading(null); return }
    const { data: urlData } = supabase.storage.from('quotes').getPublicUrl(path)
    if (urlData?.publicUrl) {
      setItems(prev => prev.map(i => i._key === itemKey ? { ...i, quote_url: urlData.publicUrl, quote_filename: file.name } : i))
    }
    setUploading(null)
  }

  function addItem(type) {
    const item = emptyItem(type)
    if (type === 'Material') item.markup_pct = form.default_markup
    setItems(prev => [...prev, item])
  }

  function removeItem(key) {
    setItems(prev => prev.filter(i => i._key !== key))
  }

  function updateItem(key, field, value) {
    setItems(prev => prev.map(item => {
      if (item._key !== key) return item
      const updated = { ...item, [field]: value }

      // Auto-fill default rate when worker selected
      if (field === 'worker_name' && item.type === 'Labour') {
        const worker = workers.find(w => w.name === value)
        if (worker?.default_rate_id) {
          const rate = rates.find(r => r.id === worker.default_rate_id)
          if (rate) {
            updated.rate_id = rate.id
            updated.role = `${rate.category} — ${rate.personnel}`
            updated.straight_rate = rate.straight_rate?.toString() || ''
            updated.overtime_rate = rate.overtime_rate?.toString() || ''
          }
        } else {
          updated.rate_id = ''
          updated.role = ''
          updated.straight_rate = ''
          updated.overtime_rate = ''
        }
      }

      // Auto-fill rates when position selected (Labour)
      if (field === 'rate_id' && item.type === 'Labour') {
        const rate = rates.find(r => r.id === value)
        if (rate) {
          updated.role = `${rate.category} — ${rate.personnel}`
          updated.straight_rate = rate.straight_rate?.toString() || ''
          updated.overtime_rate = rate.overtime_rate?.toString() || ''
        }
      }

      // Auto-fill unit cost when equipment selected
      if (field === 'rate_id' && item.type === 'Equipment') {
        const rate = equipmentRates.find(r => r.id === value)
        if (rate) {
          updated.description = rate.personnel
          updated.unit_cost = equipRateForPeriod(rate, item.equip_period || 'daily')
        }
      }
      if (field === 'equip_period' && item.type === 'Equipment' && item.rate_id) {
        const rate = equipmentRates.find(r => r.id === item.rate_id)
        if (rate) updated.unit_cost = equipRateForPeriod(rate, value)
      }

      updated.total = calcItemTotal(updated)
      return updated
    }))
  }

  const labourTotal = items.filter(i => i.type === 'Labour').reduce((s, i) => s + calcItemTotal(i), 0)
  const equipmentTotal = items.filter(i => i.type === 'Equipment').reduce((s, i) => s + calcItemTotal(i), 0)
  const materialTotal = items.filter(i => i.type === 'Material').reduce((s, i) => s + calcItemTotal(i), 0)
  const subTotal = items.filter(i => i.type === 'Subcontractor').reduce((s, i) => s + calcItemTotal(i), 0)
  const subtotal = labourTotal + equipmentTotal + materialTotal + subTotal

  async function exportDraft() {
    if (!form.project_id) { setError('Please select a project before exporting.'); return }
    setError('')
    setExporting(true)

    const date = form.date.replace(/-/g, '')
    const rand = Math.floor(Math.random() * 900) + 100
    const ticket_number = `FT-${date}-${rand}`

    const { data: ticket, error: ticketErr } = await supabase
      .from('field_tickets')
      .insert({
        project_id: form.project_id,
        ticket_number,
        date: form.date,
        section_number: form.section_number ? parseInt(form.section_number) : null,
        description: form.description || null,
        status: 'draft',
        labour_total: labourTotal,
        equipment_total: equipmentTotal,
        material_total: materialTotal,
        subcontractor_total: subTotal,
        subtotal,
      })
      .select()
      .single()

    if (ticketErr) { setError(ticketErr.message); setExporting(false); return }

    const lineItems = items
      .filter(i => calcItemTotal(i) > 0 || i.description || i.worker_name)
      .map((item, idx) => ({
        ticket_id: ticket.id,
        type: item.type,
        worker_name: item.worker_name || null,
        role: item.role || null,
        rate_id: item.rate_id || null,
        description: item.description || null,
        vendor: item.vendor || null,
        markup: item.markup_pct ? parseFloat(item.markup_pct) / 100 : null,
        straight_hours: parseFloat(item.straight_hours) || null,
        straight_rate: parseFloat(item.straight_rate) || null,
        overtime_hours: parseFloat(item.overtime_hours) || null,
        overtime_rate: parseFloat(item.overtime_rate) || null,
        travel_hours: parseFloat(item.travel_hours) || null,
        quantity: parseFloat(item.quantity) || null,
        unit_cost: parseFloat(item.unit_cost) || null,
        equip_period: item.type === 'Equipment' ? (item.equip_period || 'daily') : null,
        quote_url: item.quote_url || null,
        quote_filename: item.quote_filename || null,
        total: calcItemTotal(item),
        sort_order: idx,
      }))

    if (lineItems.length) {
      await supabase.from('field_ticket_items').insert(lineItems)
    }

    setExporting(false)
    window.open(`/print/field-ticket/${ticket.id}`, '_blank')
    router.push(`/field-tickets/${ticket.id}`)
  }

  async function save(status) {
    if (!form.project_id) { setError('Please select a project.'); return }
    setError('')
    setSaving(true)

    // Generate ticket number
    const date = form.date.replace(/-/g, '')
    const rand = Math.floor(Math.random() * 900) + 100
    const ticket_number = `FT-${date}-${rand}`

    const { data: ticket, error: ticketErr } = await supabase
      .from('field_tickets')
      .insert({
        project_id: form.project_id,
        ticket_number,
        date: form.date,
        section_number: form.section_number ? parseInt(form.section_number) : null,
        description: form.description || null,
        status,
        labour_total: labourTotal,
        equipment_total: equipmentTotal,
        material_total: materialTotal,
        subcontractor_total: subTotal,
        subtotal,
      })
      .select()
      .single()

    if (ticketErr) { setError(ticketErr.message); setSaving(false); return }

    // Insert line items
    const lineItems = items
      .filter(i => calcItemTotal(i) > 0 || i.description || i.worker_name)
      .map((item, idx) => ({
        ticket_id: ticket.id,
        type: item.type,
        worker_name: item.worker_name || null,
        role: item.role || null,
        rate_id: item.rate_id || null,
        description: item.description || null,
        vendor: item.vendor || null,
        markup: item.markup_pct ? parseFloat(item.markup_pct) / 100 : null,
        straight_hours: parseFloat(item.straight_hours) || null,
        straight_rate: parseFloat(item.straight_rate) || null,
        overtime_hours: parseFloat(item.overtime_hours) || null,
        overtime_rate: parseFloat(item.overtime_rate) || null,
        travel_hours: parseFloat(item.travel_hours) || null,
        quantity: parseFloat(item.quantity) || null,
        unit_cost: parseFloat(item.unit_cost) || null,
        equip_period: item.type === 'Equipment' ? (item.equip_period || 'daily') : null,
        quote_url: item.quote_url || null,
        quote_filename: item.quote_filename || null,
        total: calcItemTotal(item),
        sort_order: idx,
      }))

    if (lineItems.length) {
      const { error: itemsErr } = await supabase.from('field_ticket_items').insert(lineItems)
      if (itemsErr) { setError(itemsErr.message); setSaving(false); return }
    }

    router.push(`/field-tickets/${ticket.id}`)
  }

  return (
    <div className="grid" style={{ maxWidth: '1200px' }}>
      {quoteModal && (
        <FileDropModal
          onFile={file => uploadQuote(quoteModal, file)}
          onClose={() => setQuoteModal(null)}
        />
      )}

      <div className="page-header">
        <div className="split">
          <div>
            <h1>New Field Ticket</h1>
            <p className="muted">Assemble crew time and equipment into a billable ticket</p>
          </div>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <button type="button" onClick={exportDraft} disabled={exporting}>{exporting ? 'Saving…' : 'Export PDF'}</button>
            <Link href="/field-tickets"><button>Cancel</button></Link>
          </div>
        </div>
      </div>

      {/* Ticket header */}
      <section className="panel">
        <h2>Ticket details</h2>
        <div className="grid two" style={{ marginTop: '16px', gap: '14px' }}>
          <label style={{ gridColumn: '1 / -1' }}>
            Project *
            <select value={form.project_id} onChange={e => setField('project_id', e.target.value)} required>
              <option value="">-- Select project --</option>
              {projects.map(p => (
                <option key={p.id} value={p.id}>{p.name}{p.client_name ? ` (${p.client_name})` : ''}</option>
              ))}
            </select>
          </label>
          <label>
            Date *
            <input type="date" value={form.date} onChange={e => setField('date', e.target.value)} required />
          </label>
          <label>
            Area / Section number
            <input type="number" value={form.section_number} onChange={e => setField('section_number', e.target.value)} placeholder="e.g. 1" />
          </label>
          <label>
            Default material markup %
            <input type="number" step="1" min="0" value={form.default_markup} onChange={e => setField('default_markup', e.target.value)} placeholder="10" />
          </label>
          <div />
          <label style={{ gridColumn: '1 / -1' }}>
            Description / work performed
            <textarea value={form.description} onChange={e => setField('description', e.target.value)} rows={2} placeholder="Brief description of work performed..." />
          </label>
        </div>
      </section>

      {/* Line items */}
      <section className="panel">
        <h2>Line items</h2>

        {ITEM_TYPES.map(type => {
          const typeItems = items.filter(i => i.type === type)
          if (!typeItems.length) return null
          return (
            <div key={type} style={{ marginTop: '20px' }}>
              <h3 style={{ fontSize: '13px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--muted)', marginBottom: '10px' }}>{type}</h3>
              <div style={{ display: 'grid', gap: '8px' }}>
                {typeItems.map(item => (
                  <ItemRow
                    key={item._key}
                    item={item}
                    workers={workers}
                    labourRates={labourRates}
                    equipmentRates={equipmentRates}
                    onChange={(f, v) => updateItem(item._key, f, v)}
                    onRemove={() => removeItem(item._key)}
                    onAttach={() => setQuoteModal(item._key)}
                    isUploading={uploading === item._key}
                  />
                ))}
              </div>
            </div>
          )
        })}

        {/* Add buttons */}
        <div style={{ marginTop: '20px', display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          {ITEM_TYPES.map(type => (
            <button key={type} type="button" className="small" onClick={() => addItem(type)}>
              + {type}
            </button>
          ))}
        </div>
      </section>

      {/* Totals */}
      <section className="panel">
        <h2>Totals</h2>
        <div className="grid two" style={{ marginTop: '12px', gap: '8px', fontSize: '14px' }}>
          {[['Labour', labourTotal], ['Equipment', equipmentTotal], ['Material', materialTotal], ['Subcontractor', subTotal]].map(([label, val]) => (
            <div key={label} className="split">
              <span className="muted">{label}</span>
              <strong>{money(val)}</strong>
            </div>
          ))}
        </div>
        <div className="split" style={{ marginTop: '14px', paddingTop: '14px', borderTop: '2px solid var(--line)' }}>
          <span style={{ fontWeight: 700, fontSize: '16px' }}>Subtotal</span>
          <strong style={{ fontSize: '24px' }}>{money(subtotal)}</strong>
        </div>
      </section>

      {error && <div className="notice danger">{error}</div>}

      <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
        <Link href="/field-tickets"><button type="button">Cancel</button></Link>
        <button type="button" onClick={() => save('draft')} disabled={saving}>Save as draft</button>
        <button type="button" className="primary" onClick={() => save('submitted')} disabled={saving}>
          {saving ? 'Saving...' : 'Submit ticket'}
        </button>
      </div>
    </div>
  )
}

function ItemRow({ item, workers, labourRates, equipmentRates, onChange, onRemove, onAttach, isUploading }) {
  const rowStyle = {
    display: 'grid',
    gap: '8px',
    alignItems: 'end',
    background: '#fafcff',
    border: '1px solid var(--line)',
    borderRadius: '10px',
    padding: '12px',
  }

  if (item.type === 'Labour') {
    return (
      <div style={{ ...rowStyle, gridTemplateColumns: '180px 1fr 60px 60px 90px 60px 90px 90px auto' }}>
        <label style={{ margin: 0 }}>
          <span style={{ fontSize: '12px', color: 'var(--muted)' }}>Worker</span>
          <select value={item.worker_name} onChange={e => onChange('worker_name', e.target.value)}>
            <option value="">-- Select worker --</option>
            {workers.map(w => (
              <option key={w.id} value={w.name}>{w.name}</option>
            ))}
          </select>
        </label>
        <label style={{ margin: 0 }}>
          <span style={{ fontSize: '12px', color: 'var(--muted)' }}>Position / Rate</span>
          <select value={item.rate_id} onChange={e => onChange('rate_id', e.target.value)}>
            <option value="">-- Select position --</option>
            {labourRates.map(r => (
              <option key={r.id} value={r.id}>{r.category} — {r.personnel}</option>
            ))}
          </select>
        </label>
        <label style={{ margin: 0 }}>
          <span style={{ fontSize: '12px', color: 'var(--muted)' }}>Travel Hrs</span>
          <input type="number" step="0.5" min="0" value={item.travel_hours} onChange={e => onChange('travel_hours', e.target.value)} placeholder="0" />
        </label>
        <label style={{ margin: 0 }}>
          <span style={{ fontSize: '12px', color: 'var(--muted)' }}>ST Hrs</span>
          <input type="number" step="0.5" min="0" value={item.straight_hours} onChange={e => onChange('straight_hours', e.target.value)} placeholder="0" />
        </label>
        <label style={{ margin: 0 }}>
          <span style={{ fontSize: '12px', color: 'var(--muted)' }}>ST Rate</span>
          <div style={{ position: 'relative' }}><span style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--muted)', pointerEvents: 'none', fontSize: '12px' }}>$</span><input type="number" step="0.01" min="0" value={item.straight_rate} onChange={e => onChange('straight_rate', e.target.value)} placeholder="0.00" style={{ paddingLeft: '20px' }} /></div>
        </label>
        <label style={{ margin: 0 }}>
          <span style={{ fontSize: '12px', color: 'var(--muted)' }}>OT Hrs</span>
          <input type="number" step="0.5" min="0" value={item.overtime_hours} onChange={e => onChange('overtime_hours', e.target.value)} placeholder="0" />
        </label>
        <label style={{ margin: 0 }}>
          <span style={{ fontSize: '12px', color: 'var(--muted)' }}>OT Rate</span>
          <div style={{ position: 'relative' }}><span style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--muted)', pointerEvents: 'none', fontSize: '12px' }}>$</span><input type="number" step="0.01" min="0" value={item.overtime_rate} onChange={e => onChange('overtime_rate', e.target.value)} placeholder="0.00" style={{ paddingLeft: '20px' }} /></div>
        </label>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: '12px', color: 'var(--muted)' }}>Total</div>
          <strong>{money(calcItemTotal(item))}</strong>
        </div>
        <button type="button" style={{ background: 'none', color: 'var(--danger)', padding: '4px 8px', fontSize: '18px', lineHeight: 1 }} onClick={onRemove}>&#x2715;</button>
      </div>
    )
  }

  if (item.type === 'Equipment') {
    return (
      <div style={{ ...rowStyle, gridTemplateColumns: '2fr 120px 80px 1fr 1fr auto' }}>
        <label style={{ margin: 0 }}>
          <span style={{ fontSize: '12px', color: 'var(--muted)' }}>Equipment</span>
          <select value={item.rate_id} onChange={e => onChange('rate_id', e.target.value)}>
            <option value="">-- Select equipment --</option>
            {equipmentRates.map(r => (
              <option key={r.id} value={r.id}>{r.personnel}</option>
            ))}
            <option value="__manual">Other (manual entry)</option>
          </select>
        </label>
        <label style={{ margin: 0 }}>
          <span style={{ fontSize: '12px', color: 'var(--muted)' }}>Period</span>
          <select value={item.equip_period || 'daily'} onChange={e => onChange('equip_period', e.target.value)}>
            <option value="hourly">Hourly</option>
            <option value="daily">Daily</option>
            <option value="weekly">Weekly</option>
            <option value="monthly">Monthly</option>
          </select>
        </label>
        <label style={{ margin: 0 }}>
          <span style={{ fontSize: '12px', color: 'var(--muted)' }}>Qty</span>
          <input type="number" step="0.5" min="0" value={item.quantity} onChange={e => onChange('quantity', e.target.value)} placeholder="0" />
        </label>
        <label style={{ margin: 0 }}>
          <span style={{ fontSize: '12px', color: 'var(--muted)' }}>Rate</span>
          {(() => { const r = equipmentRates.find(r => r.id === item.rate_id); const na = r && item.rate_id !== '__manual' && !equipRateForPeriod(r, item.equip_period || 'daily'); return na ? <div style={{ padding: '6px 10px', background: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: '8px', color: '#9ca3af', fontSize: '13px', marginTop: '4px' }}>N/A</div> : <div style={{ position: 'relative' }}><span style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--muted)', pointerEvents: 'none', fontSize: '12px' }}>$</span><input type="number" step="0.01" min="0" value={item.unit_cost} onChange={e => onChange('unit_cost', e.target.value)} placeholder="0.00" style={{ paddingLeft: '20px' }} /></div> })()}
        </label>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: '12px', color: 'var(--muted)' }}>Total</div>
          <strong>{money(calcItemTotal(item))}</strong>
        </div>
        <button type="button" style={{ background: 'none', color: 'var(--danger)', padding: '4px 8px', fontSize: '18px', lineHeight: 1 }} onClick={onRemove}>&#x2715;</button>
      </div>
    )
  }

  if (item.type === 'Material') {
    return (
      <div style={{ ...rowStyle, gridTemplateColumns: '1fr 2fr 70px 110px 70px 90px 100px 90px auto' }}>
        <label style={{ margin: 0 }}>
          <span style={{ fontSize: '12px', color: 'var(--muted)' }}>Vendor</span>
          <input value={item.vendor || ''} onChange={e => onChange('vendor', e.target.value)} placeholder="Vendor name" />
        </label>
        <label style={{ margin: 0 }}>
          <span style={{ fontSize: '12px', color: 'var(--muted)' }}>Description</span>
          <input value={item.description} onChange={e => onChange('description', e.target.value)} placeholder="Material description" />
        </label>
        <label style={{ margin: 0 }}>
          <span style={{ fontSize: '12px', color: 'var(--muted)' }}>Qty</span>
          <input type="number" step="0.01" min="0" value={item.quantity} onChange={e => onChange('quantity', e.target.value)} placeholder="0" />
        </label>
        <label style={{ margin: 0 }}>
          <span style={{ fontSize: '12px', color: 'var(--muted)' }}>Unit cost</span>
          <div style={{ position: 'relative' }}>
            <span style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--muted)', pointerEvents: 'none' }}>$</span>
            <input type="number" step="0.01" min="0" value={item.unit_cost} onChange={e => onChange('unit_cost', e.target.value)} placeholder="0.00" style={{ paddingLeft: '22px' }} />
          </div>
        </label>
        <label style={{ margin: 0 }}>
          <span style={{ fontSize: '12px', color: 'var(--muted)' }}>Markup %</span>
          <input type="number" step="1" min="0" value={item.markup_pct || ''} onChange={e => onChange('markup_pct', e.target.value)} placeholder="0" />
        </label>
        <label style={{ margin: 0 }}>
          <span style={{ fontSize: '12px', color: 'var(--muted)' }}>Mark-up</span>
          <input readOnly value={money(((parseFloat(item.quantity) || 0) * (parseFloat(item.unit_cost) || 0)) * ((parseFloat(item.markup_pct) || 0) / 100))} style={{ background: '#f5f5f5', cursor: 'default' }} />
        </label>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '12px', color: 'var(--muted)', marginBottom: '4px' }}>Receipt</div>
          {item.quote_url ? (
            <div style={{ display: 'flex', gap: '4px', justifyContent: 'center', alignItems: 'center' }}>
              <a href={item.quote_url} target="_blank" rel="noreferrer">
                <button type="button" className="small" style={{ fontSize: '11px', padding: '2px 8px' }} title={item.quote_filename}>View</button>
              </a>
              <button type="button" style={{ background: 'none', border: 'none', color: 'var(--muted)', fontSize: '14px', cursor: 'pointer', padding: '0 2px' }} onClick={() => { onChange('quote_url', ''); onChange('quote_filename', '') }}>×</button>
            </div>
          ) : (
            <button type="button" className="small" style={{ fontSize: '11px', padding: '2px 8px' }} disabled={isUploading} onClick={onAttach}>
              {isUploading ? '…' : '📎 Attach'}
            </button>
          )}
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: '12px', color: 'var(--muted)' }}>Total</div>
          <strong>{money(calcItemTotal(item))}</strong>
        </div>
        <button type="button" style={{ background: 'none', color: 'var(--danger)', padding: '4px 8px', fontSize: '18px', lineHeight: 1 }} onClick={onRemove}>&#x2715;</button>
      </div>
    )
  }

  // Subcontractor
  return (
    <div style={{ ...rowStyle, gridTemplateColumns: '3fr 1fr auto' }}>
      <label style={{ margin: 0 }}>
        <span style={{ fontSize: '12px', color: 'var(--muted)' }}>Description</span>
        <input value={item.description} onChange={e => onChange('description', e.target.value)} placeholder="Subcontractor / description" />
      </label>
      <label style={{ margin: 0 }}>
        <span style={{ fontSize: '12px', color: 'var(--muted)' }}>Total</span>
        <input type="number" step="0.01" min="0" value={item.total} onChange={e => onChange('total', e.target.value)} placeholder="0.00" />
      </label>
      <button type="button" style={{ background: 'none', color: 'var(--danger)', padding: '4px 8px', fontSize: '18px', lineHeight: 1 }} onClick={onRemove}>&#x2715;</button>
    </div>
  )
}
