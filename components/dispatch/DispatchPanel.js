'use client'
import { useState, useMemo } from 'react'
import { createBrowserSupabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

const TRADE_GROUPS = [
  { label: 'Mechanical', trades: ['Pipefitter', 'Labourer', 'Operator'] },
  { label: 'Weld',       trades: ['Weld – CWB', 'Weld – B-Pressure', 'Weld – Fire Watch'] },
  { label: 'Electrical', trades: ['Electrical'] },
  { label: 'Instrumentation', trades: ['Instrumentation'] },
  { label: 'Management & Support', trades: ['Construction Management', 'Project Management', 'Quality'] },
]
const TRADES = TRADE_GROUPS.flatMap(g => g.trades)

const TRADE_COLORS = {
  'Electrical':              { bg: '#f0f0f0', color: '#374151' },
  'Instrumentation':         { bg: '#f0f0f0', color: '#374151' },
  'Pipefitter':              { bg: '#f0f0f0', color: '#374151' },
  'Construction Management': { bg: '#f0f0f0', color: '#374151' },
  'Project Management':      { bg: '#f0f0f0', color: '#374151' },
  'Welder':                  { bg: '#f0f0f0', color: '#374151' },
  'Weld – CWB':              { bg: '#f0f0f0', color: '#374151' },
  'Weld – B-Pressure':       { bg: '#f0f0f0', color: '#374151' },
  'Weld – Fire Watch':       { bg: '#f0f0f0', color: '#374151' },
  'Labourer':                { bg: '#f0f0f0', color: '#374151' },
  'Operator':                { bg: '#f0f0f0', color: '#374151' },
  'Quality':                 { bg: '#f0f0f0', color: '#374151' },
}

function TradeBadge({ trade }) {
  const c = TRADE_COLORS[trade] || { bg: '#f3f4f6', color: '#374151' }
  return (
    <span style={{ display: 'inline-block', padding: '1px 7px', borderRadius: '99px', fontSize: '11px', fontWeight: 700, background: c.bg, color: c.color, whiteSpace: 'nowrap' }}>
      {trade || '—'}
    </span>
  )
}

function overlaps(aS, aE, bS, bE) {
  if (!aS || !aE || !bS || !bE) return false
  return !(new Date(aE) < new Date(bS) || new Date(bE) < new Date(aS))
}

const fmt = d => d ? new Date(d + 'T00:00:00').toLocaleDateString('en-CA', { month: 'short', day: 'numeric', year: 'numeric' }) : '—'

export default function DispatchPanel({ project, initialWindows, initialRequirements, initialAssignments, workers, allWindows }) {
  const supabase = createBrowserSupabase()
  const router = useRouter()

  const [windows, setWindows] = useState(initialWindows)
  const [requirements, setRequirements] = useState(initialRequirements)
  const [assignments, setAssignments] = useState(initialAssignments)
  const [expandedWindow, setExpandedWindow] = useState(initialWindows[0]?.id || null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  // Worker trade lookup
  const workerTrade = w => w.rates?.category || null

  // Cert helpers
  const today = new Date(); today.setHours(0,0,0,0)
  const certExpired = c => c.expiry_date && new Date(c.expiry_date + 'T00:00:00') < today
  const certSoon    = c => {
    if (!c.expiry_date) return false
    const d = new Date(c.expiry_date + 'T00:00:00')
    const days = Math.floor((d - today) / 86400000)
    return days >= 0 && days <= 30
  }

  function CertBadge({ cert }) {
    const expired = certExpired(cert)
    const soon    = !expired && certSoon(cert)
    const bg    = expired ? '#f4f4f5' : soon ? '#fffbeb' : '#f0f0f0'
    const color = expired ? '#111' : soon ? '#b45309' : '#374151'
    const border = expired ? '#e4e4e7' : soon ? '#fde68a' : '#e5e7eb'
    return (
      <span style={{ fontSize: '10px', fontWeight: 700, padding: '1px 6px', borderRadius: '3px', background: bg, color, border: `1px solid ${border}`, whiteSpace: 'nowrap' }}>
        {cert.cert_type}{expired ? ' – EXPIRED' : soon ? ' – exp soon' : ''}
      </span>
    )
  }

  // ── Window CRUD ───────────────────────────────────────────────────────────
  const [newWindow, setNewWindow] = useState({ description: '', start_date: project.start_date || '', end_date: project.end_date || '' })
  const [addingWindow, setAddingWindow] = useState(false)

  async function saveWindow() {
    if (!newWindow.start_date || !newWindow.end_date) { setError('Start and end date required.'); return }
    setSaving(true); setError('')
    const { data, error: err } = await supabase
      .from('project_crew_windows')
      .insert({ project_id: project.id, description: newWindow.description || null, start_date: newWindow.start_date, end_date: newWindow.end_date })
      .select().single()
    if (err) { setError(err.message); setSaving(false); return }
    setWindows(prev => [...prev, data])
    setExpandedWindow(data.id)
    setNewWindow({ description: '', start_date: '', end_date: '' })
    setAddingWindow(false)
    setSaving(false)
  }

  async function deleteWindow(windowId) {
    if (!confirm('Delete this crew window and all its assignments?')) return
    await supabase.from('project_crew_windows').delete().eq('id', windowId)
    setWindows(prev => prev.filter(w => w.id !== windowId))
    setRequirements(prev => prev.filter(r => r.window_id !== windowId))
    setAssignments(prev => prev.filter(a => a.window_id !== windowId))
    if (expandedWindow === windowId) setExpandedWindow(null)
  }

  async function updateWindowDates(windowId, field, value) {
    setWindows(prev => prev.map(w => w.id === windowId ? { ...w, [field]: value } : w))
    await supabase.from('project_crew_windows').update({ [field]: value }).eq('id', windowId)
    router.refresh()
  }

  async function updateWindowDesc(windowId, value) {
    setWindows(prev => prev.map(w => w.id === windowId ? { ...w, description: value } : w))
    await supabase.from('project_crew_windows').update({ description: value }).eq('id', windowId)
  }

  // ── Requirement CRUD ──────────────────────────────────────────────────────
  async function upsertRequirement(windowId, trade, headcount) {
    const existing = requirements.find(r => r.window_id === windowId && r.trade === trade)
    if (existing) {
      const { data } = await supabase.from('crew_window_requirements')
        .update({ headcount }).eq('id', existing.id).select().single()
      setRequirements(prev => prev.map(r => r.id === existing.id ? data : r))
    } else {
      const { data } = await supabase.from('crew_window_requirements')
        .insert({ window_id: windowId, trade, headcount }).select().single()
      setRequirements(prev => [...prev, data])
    }
  }

  async function deleteRequirement(windowId, trade) {
    const existing = requirements.find(r => r.window_id === windowId && r.trade === trade)
    if (!existing) return
    await supabase.from('crew_window_requirements').delete().eq('id', existing.id)
    setRequirements(prev => prev.filter(r => r.id !== existing.id))
  }

  // ── Assignment CRUD ───────────────────────────────────────────────────────
  async function addAssignment(windowId, workerId, trade) {
    const { data, error: err } = await supabase.from('crew_window_assignments')
      .insert({ window_id: windowId, worker_id: workerId, trade }).select().single()
    if (!err && data) setAssignments(prev => [...prev, data])
  }

  async function removeAssignment(assignmentId) {
    await supabase.from('crew_window_assignments').delete().eq('id', assignmentId)
    setAssignments(prev => prev.filter(a => a.id !== assignmentId))
  }

  // ── Conflict detection ────────────────────────────────────────────────────
  function workerConflict(workerId, windowId) {
    const win = windows.find(w => w.id === windowId)
    if (!win) return null
    // Check other windows on OTHER projects
    for (const ow of allWindows) {
      if (ow.project_id === project.id) continue
      if (!overlaps(win.start_date, win.end_date, ow.start_date, ow.end_date)) continue
      const assigned = assignments.find(a => a.window_id === ow.id && a.worker_id === workerId)
      if (assigned) return `On ${ow.projects?.name || 'another project'}`
    }
    // Check other windows on SAME project
    for (const ow of windows) {
      if (ow.id === windowId) continue
      if (!overlaps(win.start_date, win.end_date, ow.start_date, ow.end_date)) continue
      const assigned = assignments.find(a => a.window_id === ow.id && a.worker_id === workerId)
      if (assigned) return 'Double-booked on this project'
    }
    return null
  }

  // ── Derived per-window ────────────────────────────────────────────────────
  function windowStats(windowId) {
    const reqs = requirements.filter(r => r.window_id === windowId)
    const asgns = assignments.filter(a => a.window_id === windowId)
    const required = reqs.reduce((s, r) => s + r.headcount, 0)
    const assigned = asgns.length
    return { required, assigned, open: Math.max(required - assigned, 0) }
  }

  const th = { fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--muted)', fontWeight: 700, padding: '6px 10px', borderBottom: '2px solid var(--line)', background: '#f8fafc', textAlign: 'left' }
  const td = { padding: '8px 10px', borderBottom: '1px solid var(--line)', fontSize: '13px', verticalAlign: 'middle' }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

      {/* ── Add window button ── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <p className="muted" style={{ fontSize: '13px' }}>
          {windows.length === 0 ? 'No crew windows yet — add one to start dispatching.' : `${windows.length} crew window${windows.length > 1 ? 's' : ''}`}
        </p>
        <button className="small primary" onClick={() => setAddingWindow(true)}>+ Add Window</button>
      </div>

      {/* ── New window form ── */}
      {addingWindow && (
        <div style={{ border: '1px solid var(--line)', borderRadius: '10px', padding: '14px', background: '#f8fafc', display: 'grid', gap: '10px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 160px 160px', gap: '10px' }}>
            <label style={{ fontSize: '12px', fontWeight: 600 }}>
              Description (optional)
              <input value={newWindow.description} onChange={e => setNewWindow(p => ({ ...p, description: e.target.value }))} placeholder="e.g. Phase 1 – Electrical, Commissioning…" style={{ marginTop: '4px' }} />
            </label>
            <label style={{ fontSize: '12px', fontWeight: 600 }}>
              Start Date
              <input type="date" value={newWindow.start_date} onChange={e => setNewWindow(p => ({ ...p, start_date: e.target.value }))} style={{ marginTop: '4px' }} />
            </label>
            <label style={{ fontSize: '12px', fontWeight: 600 }}>
              End Date
              <input type="date" value={newWindow.end_date} min={newWindow.start_date} onChange={e => setNewWindow(p => ({ ...p, end_date: e.target.value }))} style={{ marginTop: '4px' }} />
            </label>
          </div>
          {error && <div className="notice danger" style={{ fontSize: '12px' }}>{error}</div>}
          <div style={{ display: 'flex', gap: '8px' }}>
            <button className="primary" onClick={saveWindow} disabled={saving}>{saving ? 'Saving…' : 'Save Window'}</button>
            <button onClick={() => { setAddingWindow(false); setError('') }}>Cancel</button>
          </div>
        </div>
      )}

      {/* ── Windows ── */}
      {windows.map(win => {
        const isOpen = expandedWindow === win.id
        const stats = windowStats(win.id)
        const winAssignments = assignments.filter(a => a.window_id === win.id)
        const winReqs = requirements.filter(r => r.window_id === win.id)
        const assignedIds = winAssignments.map(a => a.worker_id)

        const statusColor = stats.required === 0 ? '#6b7280'
          : stats.open === 0 ? '#16a34a'
          : '#d97706'
        const statusLabel = stats.required === 0 ? 'No requirements set'
          : stats.open === 0 ? '✓ Fully Staffed'
          : `${stats.open} slot${stats.open > 1 ? 's' : ''} open`

        return (
          <div key={win.id} style={{ border: '1px solid var(--line)', borderRadius: '10px', overflow: 'hidden' }}>

            {/* Window header — always visible */}
            <div
              onClick={() => setExpandedWindow(isOpen ? null : win.id)}
              style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 16px', cursor: 'pointer', background: isOpen ? '#f4f4f5' : '#fff', borderBottom: isOpen ? '1px solid var(--line)' : 'none' }}
            >
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 700, fontSize: '14px' }}>{win.description || 'Crew Window'}</div>
                <div style={{ fontSize: '12px', color: 'var(--muted)', marginTop: '2px' }}>
                  {fmt(win.start_date)} – {fmt(win.end_date)}
                  {win.start_date && win.end_date && (
                    <span> · {Math.ceil((new Date(win.end_date) - new Date(win.start_date)) / 86400000) + 1} days</span>
                  )}
                </div>
              </div>
              <span style={{ fontSize: '12px', fontWeight: 700, color: statusColor }}>{statusLabel}</span>
              <span style={{ fontSize: '12px', fontWeight: 600, color: '#52525b', background: '#f4f4f5', padding: '2px 10px', borderRadius: '4px', border: '1px solid #e4e4e7' }}>{stats.assigned}/{stats.required} assigned</span>
              <span style={{ color: 'var(--muted)', fontSize: '16px' }}>{isOpen ? '▲' : '▼'}</span>
            </div>

            {/* Window detail — expanded */}
            {isOpen && (
              <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '16px' }}>

                {/* Edit dates + description */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 160px 160px auto', gap: '10px', alignItems: 'end' }}>
                  <label style={{ fontSize: '12px', fontWeight: 600 }}>
                    Description
                    <input defaultValue={win.description || ''} onBlur={e => updateWindowDesc(win.id, e.target.value)} placeholder="e.g. Phase 1 – Electrical" style={{ marginTop: '4px' }} />
                  </label>
                  <label style={{ fontSize: '12px', fontWeight: 600 }}>
                    Start Date
                    <input type="date" defaultValue={win.start_date} onBlur={e => updateWindowDates(win.id, 'start_date', e.target.value)} style={{ marginTop: '4px' }} />
                  </label>
                  <label style={{ fontSize: '12px', fontWeight: 600 }}>
                    End Date
                    <input type="date" defaultValue={win.end_date} onBlur={e => updateWindowDates(win.id, 'end_date', e.target.value)} style={{ marginTop: '4px' }} />
                  </label>
                  <button className="small" style={{ color: '#111', borderColor: '#e4e4e7', marginBottom: '1px' }} onClick={() => deleteWindow(win.id)}>Delete Window</button>
                </div>

                {/* Trade requirements — grouped */}
                <div>
                  <h4 style={{ fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--muted)', marginBottom: '10px' }}>Manpower Required</h4>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {TRADE_GROUPS.map(group => (
                      <div key={group.label}>
                        <div style={{ fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#aaa', marginBottom: '6px' }}>{group.label}</div>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                          {group.trades.map(trade => {
                            const req = winReqs.find(r => r.trade === trade)
                            const count = req?.headcount || 0
                            return (
                              <div key={trade} style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '5px 10px', borderRadius: '4px', border: `1px solid ${count > 0 ? '#111' : 'var(--line)'}`, background: count > 0 ? '#f9f9f9' : '#fafafa' }}>
                                <TradeBadge trade={trade} />
                                <button onClick={() => count > 0 && upsertRequirement(win.id, trade, count - 1)} style={{ background: 'none', border: '1px solid var(--line)', borderRadius: '3px', width: '20px', height: '20px', cursor: 'pointer', fontWeight: 700, fontSize: '13px', lineHeight: 1, color: 'var(--muted)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>−</button>
                                <span style={{ fontSize: '13px', fontWeight: 700, minWidth: '14px', textAlign: 'center' }}>{count}</span>
                                <button onClick={() => upsertRequirement(win.id, trade, count + 1)} style={{ background: 'none', border: '1px solid var(--line)', borderRadius: '3px', width: '20px', height: '20px', cursor: 'pointer', fontWeight: 700, fontSize: '13px', lineHeight: 1, color: 'var(--muted)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>+</button>
                              </div>
                            )
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Worker assignment — two columns */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>

                  {/* Assigned */}
                  <div>
                    <h4 style={{ fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--muted)', marginBottom: '8px' }}>
                      Assigned — {winAssignments.length}
                    </h4>
                    {winAssignments.length === 0 && <p style={{ fontSize: '13px', color: 'var(--muted)' }}>None yet — add from the right.</p>}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      {winAssignments.map(a => {
                        const w = workers.find(x => x.id === a.worker_id)
                        if (!w) return null
                        const conflict = workerConflict(w.id, win.id)
                        const wCerts = w.worker_certifications || []
                        return (
                          <div key={a.id} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '7px 10px', background: conflict ? '#fffbeb' : '#f8fafc', border: `1px solid ${conflict ? '#fde68a' : 'var(--line)'}`, borderRadius: '4px' }}>
                            <div style={{ flex: 1 }}>
                              <div style={{ fontSize: '13px', fontWeight: 600 }}>{w.name}</div>
                              <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '4px', marginTop: '3px' }}>
                                <TradeBadge trade={a.trade || workerTrade(w)} />
                                {wCerts.map(c => <CertBadge key={c.id} cert={c} />)}
                                {conflict && <span style={{ fontSize: '11px', color: '#d97706', fontWeight: 700 }}>⚠ {conflict}</span>}
                              </div>
                            </div>
                            <button className="small" onClick={() => removeAssignment(a.id)} style={{ color: '#111', borderColor: '#e4e4e7', fontSize: '11px' }}>Remove</button>
                          </div>
                        )
                      })}
                    </div>
                  </div>

                  {/* Available */}
                  <div>
                    <h4 style={{ fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--muted)', marginBottom: '8px' }}>
                      Available Workers
                    </h4>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', maxHeight: '280px', overflowY: 'auto' }}>
                      {workers
                        .filter(w => w.active && !assignedIds.includes(w.id))
                        .map(w => {
                          const trade = workerTrade(w)
                          const conflict = workerConflict(w.id, win.id)
                          const wCerts = w.worker_certifications || []
                          return (
                            <div key={w.id} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '7px 10px', background: conflict ? '#fffbeb' : '#f8fafc', border: `1px solid ${conflict ? '#fde68a' : 'var(--line)'}`, borderRadius: '4px', opacity: conflict ? 0.75 : 1 }}>
                              <div style={{ flex: 1 }}>
                                <div style={{ fontSize: '13px', fontWeight: 600 }}>{w.name}</div>
                                <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '4px', marginTop: '3px' }}>
                                  <TradeBadge trade={trade} />
                                  {wCerts.map(c => <CertBadge key={c.id} cert={c} />)}
                                  {conflict && <span style={{ fontSize: '11px', color: '#d97706', fontWeight: 600 }}>⚠ {conflict}</span>}
                                </div>
                              </div>
                              <button
                                className={conflict ? 'small' : 'small primary'}
                                onClick={() => addAssignment(win.id, w.id, trade)}
                                title={conflict ? 'Add anyway — will flag conflict' : ''}
                              >+ Add</button>
                            </div>
                          )
                        })}
                    </div>
                  </div>

                </div>
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
