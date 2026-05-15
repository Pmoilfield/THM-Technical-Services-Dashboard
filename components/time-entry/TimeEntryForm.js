'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createBrowserSupabase } from '@/lib/supabase'

function formatDate(d) {
  if (!d) return '—'
  return new Date(d).toLocaleDateString('en-CA', { weekday: 'short', month: 'short', day: 'numeric' })
}

export default function TimeEntryForm({ projects, workers, recentEntries }) {
  const supabase = createBrowserSupabase()
  const router = useRouter()
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState('')
  const [editingId, setEditingId] = useState(null)

  const today = new Date().toISOString().split('T')[0]

  const [form, setForm] = useState({
    worker_id: '',
    project_id: '',
    date: today,
    travel_hours: '',
    reg_hours: '',
    ot_hours: '',
    notes: '',
  })

  function set(f, v) { setForm(p => ({ ...p, [f]: v })) }

  const totalHours = (parseFloat(form.travel_hours) || 0) + (parseFloat(form.reg_hours) || 0) + (parseFloat(form.ot_hours) || 0)

  async function handleSubmit(e) {
    e.preventDefault()
    if (!form.worker_id || !form.project_id) { setError('Worker and project are required.'); return }
    setError('')
    setSaving(true)

    const payload = {
      worker_id: form.worker_id,
      project_id: form.project_id,
      date: form.date,
      travel_hours: parseFloat(form.travel_hours) || 0,
      reg_hours: parseFloat(form.reg_hours) || 0,
      ot_hours: parseFloat(form.ot_hours) || 0,
      notes: form.notes || null,
    }

    let err
    if (editingId) {
      ({ error: err } = await supabase.from('time_entries').update(payload).eq('id', editingId))
    } else {
      ({ error: err } = await supabase.from('time_entries').insert(payload))
    }

    if (err) { setError(err.message); setSaving(false); return }

    setSaving(false)
    setSaved(true)
    setEditingId(null)
    setForm({ worker_id: form.worker_id, project_id: form.project_id, date: today, travel_hours: '', reg_hours: '', ot_hours: '', notes: '' })
    setTimeout(() => setSaved(false), 3000)
    router.refresh()
  }

  function startEdit(entry) {
    setEditingId(entry.id)
    setForm({
      worker_id: entry.worker_id,
      project_id: entry.project_id,
      date: entry.date,
      travel_hours: entry.travel_hours?.toString() || '',
      reg_hours: entry.reg_hours?.toString() || '',
      ot_hours: entry.ot_hours?.toString() || '',
      notes: entry.notes || '',
    })
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  async function handleDelete(id) {
    if (!confirm('Delete this time entry?')) return
    await supabase.from('time_entries').delete().eq('id', id)
    router.refresh()
  }

  function cancelEdit() {
    setEditingId(null)
    setForm({ worker_id: '', project_id: '', date: today, travel_hours: '', reg_hours: '', ot_hours: '', notes: '' })
  }

  const inputNum = { type: 'number', step: '0.5', min: '0', style: { textAlign: 'center' } }

  return (
    <div className="grid" style={{ maxWidth: '860px' }}>
      <div className="page-header">
        <div className="split">
          <div>
            <h1>Time Entry</h1>
            <p className="muted">Record daily hours per worker per project</p>
          </div>
        </div>
      </div>

      <section className="panel">
        <h2>{editingId ? 'Edit Entry' : 'Log Time'}</h2>
        <form onSubmit={handleSubmit}>
          <div className="grid two" style={{ marginTop: '14px', gap: '12px' }}>
            <label>
              Worker *
              <select value={form.worker_id} onChange={e => set('worker_id', e.target.value)} required>
                <option value="">— Select worker —</option>
                {workers.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
              </select>
            </label>
            <label>
              Date
              <input type="date" value={form.date} onChange={e => set('date', e.target.value)} />
            </label>
            <label style={{ gridColumn: '1 / -1' }}>
              Project *
              <select value={form.project_id} onChange={e => set('project_id', e.target.value)} required>
                <option value="">— Select project —</option>
                {projects.map(p => <option key={p.id} value={p.id}>{p.name}{p.internal_job_no ? ` (${p.internal_job_no})` : ''}</option>)}
              </select>
            </label>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 80px', gap: '12px', marginTop: '12px', alignItems: 'end' }}>
            <label>
              Travel hrs
              <input {...inputNum} value={form.travel_hours} onChange={e => set('travel_hours', e.target.value)} placeholder="0" />
            </label>
            <label>
              ST hrs
              <input {...inputNum} value={form.reg_hours} onChange={e => set('reg_hours', e.target.value)} placeholder="0" />
            </label>
            <label>
              OT hrs
              <input {...inputNum} value={form.ot_hours} onChange={e => set('ot_hours', e.target.value)} placeholder="0" />
            </label>
            <div style={{ paddingBottom: '2px' }}>
              <div style={{ fontSize: '11px', color: 'var(--muted)', fontWeight: 600, marginBottom: '6px' }}>Total</div>
              <div style={{ fontWeight: 800, fontSize: '18px', textAlign: 'center' }}>{totalHours || '—'}</div>
            </div>
          </div>

          <label style={{ marginTop: '12px' }}>
            Notes
            <input value={form.notes} onChange={e => set('notes', e.target.value)} placeholder="Optional notes..." />
          </label>

          {error && <div className="notice danger" style={{ marginTop: '10px' }}>{error}</div>}
          {saved && <div className="notice good" style={{ marginTop: '10px' }}>Entry saved.</div>}

          <div style={{ marginTop: '14px', display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
            {editingId && <button type="button" onClick={cancelEdit}>Cancel</button>}
            <button type="submit" className="primary" disabled={saving}>
              {saving ? 'Saving...' : editingId ? 'Update entry' : 'Save entry'}
            </button>
          </div>
        </form>
      </section>

      {/* Recent entries */}
      <section className="panel">
        <h2>Recent entries</h2>
        <div className="table-wrap" style={{ marginTop: '10px' }}>
          <table>
            <thead>
              <tr>
                <th>Date</th>
                <th>Worker</th>
                <th>Project</th>
                <th className="numeric">Travel</th>
                <th className="numeric">ST</th>
                <th className="numeric">OT</th>
                <th className="numeric">Total</th>
                <th>Notes</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {recentEntries.length ? recentEntries.map(entry => {
                const total = (entry.travel_hours || 0) + (entry.reg_hours || 0) + (entry.ot_hours || 0)
                const isEditing = editingId === entry.id
                return (
                  <tr key={entry.id} style={{ background: isEditing ? '#fffbfa' : undefined }}>
                    <td style={{ whiteSpace: 'nowrap' }}>{formatDate(entry.date)}</td>
                    <td><strong>{entry.workers?.name || '—'}</strong></td>
                    <td>{entry.projects?.name || '—'}</td>
                    <td className="numeric">{entry.travel_hours || '—'}</td>
                    <td className="numeric" style={{ color: '#15803d', fontWeight: 700 }}>{entry.reg_hours || '—'}</td>
                    <td className="numeric" style={{ color: '#b91c1c', fontWeight: 700 }}>{entry.ot_hours || '—'}</td>
                    <td className="numeric" style={{ fontWeight: 800 }}>{total}</td>
                    <td style={{ color: 'var(--muted)', fontSize: '11px' }}>{entry.notes || ''}</td>
                    <td>
                      <div style={{ display: 'flex', gap: '4px' }}>
                        <button className="small" onClick={() => startEdit(entry)}>Edit</button>
                        <button className="small danger" onClick={() => handleDelete(entry.id)}>Del</button>
                      </div>
                    </td>
                  </tr>
                )
              }) : (
                <tr><td colSpan="9" className="empty">No time entries yet.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  )
}
