'use client'
import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { createBrowserSupabase } from '@/lib/supabase'
import Link from 'next/link'

function FileDropModal({ onFile, onClose }) {
  const [dragging, setDragging] = useState(false)
  const inputRef = useRef()
  function handle(file) { if (!file) return; onFile(file); onClose() }
  return (
    <div
      style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
      onClick={onClose}
    >
      <div
        style={{ background: '#fff', borderRadius: '16px', padding: '32px', width: '420px', boxShadow: '0 8px 40px rgba(0,0,0,0.18)' }}
        onClick={e => e.stopPropagation()}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h2 style={{ margin: 0, fontSize: '16px' }}>Attach ticket copy</h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: '22px', cursor: 'pointer', color: 'var(--muted)', lineHeight: 1 }}>×</button>
        </div>
        <div
          onDragOver={e => { e.preventDefault(); setDragging(true) }}
          onDragLeave={() => setDragging(false)}
          onDrop={e => { e.preventDefault(); setDragging(false); handle(e.dataTransfer.files[0]) }}
          onClick={() => inputRef.current.click()}
          style={{
            border: `2px dashed ${dragging ? '#b91c1c' : '#d1d5db'}`,
            borderRadius: '12px', padding: '40px 24px', textAlign: 'center',
            cursor: 'pointer', background: dragging ? '#fff5f5' : '#fafafa', transition: 'all 0.15s',
          }}
        >
          <div style={{ fontSize: '36px', marginBottom: '10px' }}>📎</div>
          <div style={{ fontWeight: 600, fontSize: '14px', marginBottom: '6px' }}>
            {dragging ? 'Drop to attach' : 'Drop file here or click to browse'}
          </div>
          <div style={{ fontSize: '12px', color: 'var(--muted)' }}>PDF, image, or Word document</div>
          <input
            ref={inputRef} type="file"
            accept=".pdf,.doc,.docx,.png,.jpg,.jpeg"
            style={{ display: 'none' }}
            onChange={e => handle(e.target.files[0])}
          />
        </div>
      </div>
    </div>
  )
}

const STANDARD_TICKETS = [
  'H2S Alive',
  'First Aid',
  'WHMIS',
  'Fall Protection',
  'Ground Disturbance',
  'CSTS',
  'NORMS',
  'TDG',
]

const EXTRA_SUGGESTIONS = [
  'Confined Space Entry',
  'Ground Disturbance Level 1',
  'Ground Disturbance Level 2',
  'OSSA',
  'Rigging & Hoisting',
  'Aerial Work Platform',
  'Forklift',
  'Skid Steer',
  'Boom Truck',
  'CSO',
  'Bear Awareness',
  'First Aid - OFA Level 1',
  'First Aid - OFA Level 2',
  'First Aid - OFA Level 3',
]

function ticketStatus(expiry_date) {
  if (!expiry_date) return null
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const exp = new Date(expiry_date + 'T00:00:00')
  const daysLeft = Math.floor((exp - today) / 86400000)
  if (daysLeft < 0)  return { label: 'Expired',       color: '#dc2626', bg: '#fef2f2' }
  if (daysLeft <= 30) return { label: 'Expiring soon', color: '#d97706', bg: '#fffbeb' }
  return { label: 'Valid', color: '#16a34a', bg: '#f0fdf4' }
}

export default function EmployeeForm({ worker, rates, initialTickets = [], initialOrientations = [], initialHolidays = [] }) {
  const router = useRouter()
  const supabase = createBrowserSupabase()
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const [form, setForm] = useState({
    name:                      worker.name || '',
    job_title:                 worker.job_title || '',
    phone:                     worker.phone || '',
    email:                     worker.email || '',
    emergency_contact_name:    worker.emergency_contact_name || '',
    emergency_contact_phone:   worker.emergency_contact_phone || '',
    default_rate_id:           worker.default_rate_id || '',
    worker_type:               worker.worker_type || 'employee',
    pay_rate_st:               worker.pay_rate_st?.toString() || '',
    pay_rate_ot:               worker.pay_rate_ot?.toString() || '',
    truck_rate:                worker.truck_rate?.toString() || '',
    notes:                     worker.notes || '',
    active:                    worker.active ?? true,
  })

  const [tickets, setTickets] = useState(() => {
    const standardRows = STANDARD_TICKETS.map(name => {
      const saved = initialTickets.find(t => t.ticket_name === name)
      return saved
        ? { ...saved, _key: saved.id, _standard: true }
        : { _key: `std-${name}`, _standard: true, ticket_name: name, expiry_date: '' }
    })
    const customRows = initialTickets
      .filter(t => !STANDARD_TICKETS.includes(t.ticket_name))
      .map(t => ({ ...t, _key: t.id, _standard: false }))
    return [...standardRows, ...customRows]
  })

  function set(field, value) { setForm(f => ({ ...f, [field]: value })) }

  const [orientations, setOrientations] = useState(
    initialOrientations.map(o => ({ ...o, _key: o.id }))
  )

  function addOrientation() {
    setOrientations(prev => [...prev, { _key: Math.random(), site_name: '', completed_date: '', expiry_date: '' }])
  }
  function removeOrientation(key) {
    setOrientations(prev => prev.filter(o => o._key !== key))
  }
  function updateOrientation(key, field, value) {
    setOrientations(prev => prev.map(o => o._key === key ? { ...o, [field]: value } : o))
  }

  const [holidays, setHolidays] = useState(
    initialHolidays.map(h => ({ ...h, _key: h.id }))
  )
  function addHoliday() {
    setHolidays(prev => [...prev, { _key: Math.random(), start_date: '', end_date: '', description: '' }])
  }
  function removeHoliday(key) { setHolidays(prev => prev.filter(h => h._key !== key)) }
  function updateHoliday(key, field, value) {
    setHolidays(prev => prev.map(h => h._key === key ? { ...h, [field]: value } : h))
  }

  const [fileModal, setFileModal] = useState(null) // ticket _key
  const [uploading, setUploading] = useState(null)
  const [uploadError, setUploadError] = useState('')

  async function uploadTicketFile(key, file) {
    setUploading(key)
    setUploadError('')
    const path = `safety-tickets/${worker.id}/${Date.now()}-${file.name}`
    const { error: upErr } = await supabase.storage.from('quotes').upload(path, file, { upsert: true })
    if (upErr) { setUploadError(`Upload failed: ${upErr.message}`); setUploading(null); return }
    const { data: urlData } = supabase.storage.from('quotes').getPublicUrl(path)
    const publicUrl = urlData?.publicUrl
    if (!publicUrl) { setUploadError('Upload succeeded but could not get public URL.'); setUploading(null); return }
    setTickets(prev => prev.map(t => t._key === key ? { ...t, file_url: publicUrl, file_name: file.name } : t))
    setUploading(null)
  }

  const [orientFileModal, setOrientFileModal] = useState(null)
  const [orientUploading, setOrientUploading] = useState(null)

  async function uploadOrientationFile(key, file) {
    setOrientUploading(key)
    const path = `orientations/${worker.id}/${Date.now()}-${file.name}`
    const { error: upErr } = await supabase.storage.from('quotes').upload(path, file, { upsert: true })
    if (upErr) { setUploadError(`Upload failed: ${upErr.message}`); setOrientUploading(null); return }
    const { data: urlData } = supabase.storage.from('quotes').getPublicUrl(path)
    const publicUrl = urlData?.publicUrl
    if (!publicUrl) { setUploadError('Could not get public URL.'); setOrientUploading(null); return }
    setOrientations(prev => prev.map(o => o._key === key ? { ...o, file_url: publicUrl, file_name: file.name } : o))
    setOrientUploading(null)
  }

  function addTicket() {
    setTickets(prev => [...prev, { _key: Math.random(), ticket_name: '', expiry_date: '' }])
  }

  function removeTicket(key) {
    setTickets(prev => prev.filter(t => t._key !== key))
  }

  function updateTicket(key, field, value) {
    setTickets(prev => prev.map(t => t._key === key ? { ...t, [field]: value } : t))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setSaving(true)

    // Save worker
    const { error: workerErr } = await supabase
      .from('workers')
      .update({
        name:                    form.name,
        job_title:               form.job_title || null,
        phone:                   form.phone || null,
        email:                   form.email || null,
        emergency_contact_name:  form.emergency_contact_name || null,
        emergency_contact_phone: form.emergency_contact_phone || null,
        default_rate_id:         form.default_rate_id || null,
        worker_type:             form.worker_type,
        pay_rate_st:             form.pay_rate_st ? parseFloat(form.pay_rate_st) : null,
        pay_rate_ot:             form.pay_rate_ot ? parseFloat(form.pay_rate_ot) : null,
        truck_rate:              form.truck_rate ? parseFloat(form.truck_rate) : null,
        notes:                   form.notes || null,
        active:                  form.active,
      })
      .eq('id', worker.id)

    if (workerErr) { setError(workerErr.message); setSaving(false); return }

    // Save tickets — delete all then reinsert
    await supabase.from('worker_safety_tickets').delete().eq('worker_id', worker.id)

    // Save all standard tickets + custom tickets that have a name
    const validTickets = tickets.filter(t => t._standard || t.ticket_name.trim())
    if (validTickets.length) {
      const { error: ticketErr } = await supabase.from('worker_safety_tickets').insert(
        validTickets.map(t => ({
          worker_id:   worker.id,
          ticket_name: t.ticket_name.trim(),
          expiry_date: t.expiry_date || null,
          file_url:    t.file_url || null,
          file_name:   t.file_name || null,
        }))
      )
      if (ticketErr) { setError(ticketErr.message); setSaving(false); return }
    }

    // Save orientations — delete all then reinsert
    await supabase.from('worker_orientations').delete().eq('worker_id', worker.id)
    const validOrientations = orientations.filter(o => o.site_name.trim())
    if (validOrientations.length) {
      const { error: orientErr } = await supabase.from('worker_orientations').insert(
        validOrientations.map(o => ({
          worker_id:      worker.id,
          site_name:      o.site_name.trim(),
          completed_date: o.completed_date || null,
          expiry_date:    o.expiry_date || null,
          file_url:       o.file_url || null,
          file_name:      o.file_name || null,
        }))
      )
      if (orientErr) { setError(orientErr.message); setSaving(false); return }
    }

    // Save holidays — delete all then reinsert
    await supabase.from('worker_holidays').delete().eq('worker_id', worker.id)
    const validHolidays = holidays.filter(h => h.start_date && h.end_date)
    if (validHolidays.length) {
      const { error: holErr } = await supabase.from('worker_holidays').insert(
        validHolidays.map(h => ({
          worker_id:   worker.id,
          start_date:  h.start_date,
          end_date:    h.end_date,
          description: h.description || null,
        }))
      )
      if (holErr) { setError(holErr.message); setSaving(false); return }
    }

    router.push('/employees')
    router.refresh()
  }

  return (
    <div className="grid" style={{ maxWidth: '1100px' }}>
      <div className="page-header">
        <div className="split">
          <div>
            <h1>Edit Employee</h1>
            <p className="muted">{worker.name}</p>
          </div>
          <Link href="/employees"><button>Cancel</button></Link>
        </div>
      </div>

      {fileModal && (
        <FileDropModal
          onFile={file => uploadTicketFile(fileModal, file)}
          onClose={() => setFileModal(null)}
        />
      )}
      {orientFileModal && (
        <FileDropModal
          onFile={file => uploadOrientationFile(orientFileModal, file)}
          onClose={() => setOrientFileModal(null)}
        />
      )}

      <form onSubmit={handleSubmit}>
        {/* Combined employee details panel */}
        <section className="panel">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px' }}>

            {/* Row 1: name spans all, then job title + status + phone + email */}
            <label style={{ gridColumn: '1 / -1' }}>
              Full name *
              <input value={form.name} onChange={e => set('name', e.target.value)} required />
            </label>
            <label>
              Job title
              <input value={form.job_title} onChange={e => set('job_title', e.target.value)} placeholder="e.g. Journeyman Electrician" />
            </label>
            <label>
              Status
              <select value={form.active ? 'active' : 'inactive'} onChange={e => set('active', e.target.value === 'active')}>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </label>
            <label>
              Phone
              <input type="tel" value={form.phone} onChange={e => set('phone', e.target.value)} placeholder="e.g. 780-555-0100" />
            </label>
            <label>
              Email
              <input type="email" value={form.email} onChange={e => set('email', e.target.value)} placeholder="e.g. name@example.com" />
            </label>

            {/* Divider */}
            <div style={{ gridColumn: '1 / -1', borderTop: '1px solid var(--line)', margin: '4px 0' }} />

            {/* Emergency contact */}
            <label style={{ gridColumn: 'span 2' }}>
              Emergency contact name
              <input value={form.emergency_contact_name} onChange={e => set('emergency_contact_name', e.target.value)} placeholder="e.g. Jane Smith" />
            </label>
            <label style={{ gridColumn: 'span 2' }}>
              Emergency contact phone
              <input type="tel" value={form.emergency_contact_phone} onChange={e => set('emergency_contact_phone', e.target.value)} placeholder="e.g. 780-555-0199" />
            </label>

            {/* Divider */}
            <div style={{ gridColumn: '1 / -1', borderTop: '1px solid var(--line)', margin: '4px 0' }} />

            {/* Rate & billing */}
            <label>
              Type
              <select value={form.worker_type} onChange={e => set('worker_type', e.target.value)}>
                <option value="employee">Employee</option>
                <option value="contractor">Contractor</option>
              </select>
            </label>
            <label style={{ gridColumn: 'span 3' }}>
              Default charge-out position
              <select value={form.default_rate_id} onChange={e => set('default_rate_id', e.target.value)}>
                <option value="">— No default —</option>
                {rates.map(r => (
                  <option key={r.id} value={r.id}>{r.category} — {r.personnel}</option>
                ))}
              </select>
            </label>
            <label>
              Pay rate ST ($/hr)
              <input type="number" step="0.01" min="0" value={form.pay_rate_st} onChange={e => set('pay_rate_st', e.target.value)} placeholder="0.00" />
            </label>
            <label>
              Pay rate OT ($/hr)
              <input type="number" step="0.01" min="0" value={form.pay_rate_ot} onChange={e => set('pay_rate_ot', e.target.value)} placeholder="0.00" />
            </label>
            <label>
              Truck rate ($/hr)
              <input type="number" step="0.01" min="0" value={form.truck_rate} onChange={e => set('truck_rate', e.target.value)} placeholder="0.00" />
            </label>
            <label>
              Notes
              <input value={form.notes} onChange={e => set('notes', e.target.value)} placeholder="Any relevant notes..." />
            </label>
          </div>
        </section>

        {/* Safety tickets */}
        <section className="panel">
          <div className="split" style={{ marginBottom: '16px' }}>
            <h2>Safety tickets</h2>
            <button type="button" className="small primary" onClick={addTicket}>+ Add ticket</button>
          </div>

          {tickets.length === 0 && (
            <p className="muted" style={{ fontSize: '13px' }}>
              No safety tickets recorded. Click <strong>+ Add ticket</strong> to add one.
            </p>
          )}

          <datalist id="ticket-names">
            {EXTRA_SUGGESTIONS.map(t => <option key={t} value={t} />)}
          </datalist>

          {tickets.length > 0 && (
            <div style={{ display: 'grid', gap: '2px' }}>
              {/* Header */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 150px 90px 120px 32px', gap: '8px', padding: '4px 0 8px', fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--muted)', borderBottom: '2px solid var(--line)' }}>
                <span>Ticket / Certification</span>
                <span>Expiry date</span>
                <span>Status</span>
                <span>Copy</span>
                <span />
              </div>

              {uploadError && <div className="notice danger" style={{ fontSize: '12px', padding: '6px 10px' }}>{uploadError}</div>}

              {tickets.map(t => {
                const status = ticketStatus(t.expiry_date)
                const isUploading = uploading === t._key
                return (
                  <div key={t._key} style={{ display: 'grid', gridTemplateColumns: '1fr 150px 90px 120px 32px', gap: '8px', alignItems: 'center', padding: '6px 0', borderBottom: '1px solid var(--line)' }}>
                    {t._standard ? (
                      <div style={{ fontSize: '13px', padding: '4px 8px', fontWeight: 600 }}>{t.ticket_name}</div>
                    ) : (
                      <input
                        list="ticket-names"
                        value={t.ticket_name}
                        onChange={e => updateTicket(t._key, 'ticket_name', e.target.value)}
                        placeholder="Ticket / certification name"
                        style={{ fontSize: '13px', padding: '4px 8px' }}
                      />
                    )}
                    <input
                      type="date"
                      value={t.expiry_date || ''}
                      onChange={e => updateTicket(t._key, 'expiry_date', e.target.value)}
                      style={{ fontSize: '13px', padding: '4px 8px' }}
                    />
                    <div>
                      {status ? (
                        <span style={{ fontSize: '11px', fontWeight: 700, padding: '2px 8px', borderRadius: '99px', background: status.bg, color: status.color, whiteSpace: 'nowrap' }}>
                          {status.label}
                        </span>
                      ) : (
                        <span style={{ fontSize: '11px', color: 'var(--muted)' }}>—</span>
                      )}
                    </div>
                    {/* File attach / view */}
                    <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
                      {t.file_url ? (
                        <>
                          <a href={t.file_url} target="_blank" rel="noreferrer">
                            <button type="button" className="small" style={{ fontSize: '11px', padding: '2px 8px' }} title={t.file_name}>View</button>
                          </a>
                          <button type="button" style={{ background: 'none', border: 'none', color: 'var(--muted)', fontSize: '14px', cursor: 'pointer', padding: '0 2px' }} onClick={() => { updateTicket(t._key, 'file_url', ''); updateTicket(t._key, 'file_name', '') }} title="Remove file">×</button>
                        </>
                      ) : (
                        <button type="button" className="small" style={{ fontSize: '11px', padding: '2px 8px' }} disabled={isUploading} onClick={() => setFileModal(t._key)}>
                          {isUploading ? '…' : '📎 Attach'}
                        </button>
                      )}
                    </div>
                    {t._standard ? <div /> : (
                      <button type="button" onClick={() => removeTicket(t._key)} style={{ background: 'none', border: 'none', color: 'var(--danger)', fontSize: '16px', cursor: 'pointer', padding: '2px 4px' }}>×</button>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </section>

        {/* Orientation records */}
        <section className="panel">
          <div className="split" style={{ marginBottom: '16px' }}>
            <h2>Orientation records</h2>
            <button type="button" className="small primary" onClick={addOrientation}>+ Add orientation</button>
          </div>

          {orientations.length === 0 && (
            <p className="muted" style={{ fontSize: '13px' }}>
              No orientations recorded. Click <strong>+ Add orientation</strong> to add one.
            </p>
          )}

          {orientations.length > 0 && (
            <div style={{ display: 'grid', gap: '2px' }}>
              {/* Header */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 140px 140px 90px 120px 32px', gap: '8px', padding: '4px 0 8px', fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--muted)', borderBottom: '2px solid var(--line)' }}>
                <span>Site / Client</span>
                <span>Date Completed</span>
                <span>Expiry Date</span>
                <span>Status</span>
                <span>Copy</span>
                <span />
              </div>

              {orientations.map(o => {
                const status = ticketStatus(o.expiry_date)
                const isOrientUploading = orientUploading === o._key
                return (
                  <div key={o._key} style={{ display: 'grid', gridTemplateColumns: '1fr 140px 140px 90px 120px 32px', gap: '8px', alignItems: 'center', padding: '6px 0', borderBottom: '1px solid var(--line)' }}>
                    <input
                      value={o.site_name}
                      onChange={e => updateOrientation(o._key, 'site_name', e.target.value)}
                      placeholder="e.g. Syncrude, Imperial Oil"
                      style={{ fontSize: '13px', padding: '4px 8px' }}
                    />
                    <input
                      type="date"
                      value={o.completed_date || ''}
                      onChange={e => updateOrientation(o._key, 'completed_date', e.target.value)}
                      style={{ fontSize: '13px', padding: '4px 8px' }}
                    />
                    <input
                      type="date"
                      value={o.expiry_date || ''}
                      onChange={e => updateOrientation(o._key, 'expiry_date', e.target.value)}
                      style={{ fontSize: '13px', padding: '4px 8px' }}
                    />
                    <div>
                      {status ? (
                        <span style={{
                          fontSize: '11px', fontWeight: 700, padding: '2px 8px',
                          borderRadius: '99px', background: status.bg, color: status.color,
                          whiteSpace: 'nowrap',
                        }}>
                          {status.label}
                        </span>
                      ) : (
                        <span style={{ fontSize: '11px', color: 'var(--muted)' }}>—</span>
                      )}
                    </div>
                    {/* File attach / view */}
                    <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
                      {o.file_url ? (
                        <>
                          <a href={o.file_url} target="_blank" rel="noreferrer">
                            <button type="button" className="small" style={{ fontSize: '11px', padding: '2px 8px' }} title={o.file_name}>View</button>
                          </a>
                          <button type="button" style={{ background: 'none', border: 'none', color: 'var(--muted)', fontSize: '14px', cursor: 'pointer', padding: '0 2px' }} onClick={() => { updateOrientation(o._key, 'file_url', ''); updateOrientation(o._key, 'file_name', '') }} title="Remove file">×</button>
                        </>
                      ) : (
                        <button type="button" className="small" style={{ fontSize: '11px', padding: '2px 8px' }} disabled={isOrientUploading} onClick={() => setOrientFileModal(o._key)}>
                          {isOrientUploading ? '…' : '📎 Attach'}
                        </button>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => removeOrientation(o._key)}
                      style={{ background: 'none', border: 'none', color: 'var(--danger)', fontSize: '16px', cursor: 'pointer', padding: '2px 4px' }}
                    >
                      ×
                    </button>
                  </div>
                )
              })}
            </div>
          )}
        </section>

        {/* Scheduled time off / holidays */}
        <section className="panel">
          <div className="split" style={{ marginBottom: '16px' }}>
            <div>
              <h2>Scheduled Time Off</h2>
              <p className="muted" style={{ fontSize: '12px', marginTop: '2px' }}>Holidays and unavailable dates — shown on the schedule Gantt and blocks dispatch assignments.</p>
            </div>
            <button type="button" className="small primary" onClick={addHoliday}>+ Add Time Off</button>
          </div>

          {holidays.length === 0 && (
            <p className="muted" style={{ fontSize: '13px' }}>No time off recorded.</p>
          )}

          {holidays.length > 0 && (
            <div style={{ display: 'grid', gap: '2px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '140px 140px 1fr 32px', gap: '8px', padding: '4px 0 8px', fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--muted)', borderBottom: '2px solid var(--line)' }}>
                <span>Start Date</span>
                <span>End Date</span>
                <span>Description</span>
                <span />
              </div>
              {holidays.map(h => (
                <div key={h._key} style={{ display: 'grid', gridTemplateColumns: '140px 140px 1fr 32px', gap: '8px', alignItems: 'center', padding: '6px 0', borderBottom: '1px solid var(--line)' }}>
                  <input
                    type="date"
                    value={h.start_date || ''}
                    onChange={e => updateHoliday(h._key, 'start_date', e.target.value)}
                    style={{ fontSize: '13px', padding: '4px 8px' }}
                  />
                  <input
                    type="date"
                    value={h.end_date || ''}
                    min={h.start_date || ''}
                    onChange={e => updateHoliday(h._key, 'end_date', e.target.value)}
                    style={{ fontSize: '13px', padding: '4px 8px' }}
                  />
                  <input
                    value={h.description || ''}
                    onChange={e => updateHoliday(h._key, 'description', e.target.value)}
                    placeholder="e.g. Summer vacation, Medical leave…"
                    style={{ fontSize: '13px', padding: '4px 8px' }}
                  />
                  <button
                    type="button"
                    onClick={() => removeHoliday(h._key)}
                    style={{ background: 'none', border: 'none', color: 'var(--danger)', fontSize: '16px', cursor: 'pointer', padding: '2px 4px' }}
                  >×</button>
                </div>
              ))}
            </div>
          )}
        </section>

        {error && <div className="notice danger">{error}</div>}

        <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
          <Link href="/employees"><button type="button">Cancel</button></Link>
          <button type="submit" className="primary" disabled={saving}>
            {saving ? 'Saving...' : 'Save changes'}
          </button>
        </div>
      </form>
    </div>
  )
}
