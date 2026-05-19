'use client'
import { useState, useMemo, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { createBrowserSupabase } from '@/lib/supabase'

// ── Constants ─────────────────────────────────────────────────────────────────
const TRADE_SECTION = {
  'Pipefitter':              'Mechanical',
  'Labourer':                'Mechanical',
  'Operator':                'Mechanical',
  'Weld':                    'Weld',
  'Welder':                  'Weld',
  'Electrical':              'Electrical',
  'Instrumentation':         'Instrumentation',
  'Construction Management': 'Management & Support',
  'Project Management':      'Management & Support',
  'Quality':                 'Management & Support',
  'Administration':          'Management & Support',
}
const SECTION_ORDER = ['Mechanical', 'Weld', 'Electrical', 'Instrumentation', 'Management & Support']

const TRADE_COLORS = {
  'Electrical':              { bg: '#dbeafe', color: '#1e40af' },
  'Instrumentation':         { bg: '#f3e8ff', color: '#6d28d9' },
  'Pipefitter':              { bg: '#dcfce7', color: '#166534' },
  'Construction Management': { bg: '#fef3c7', color: '#92400e' },
  'Project Management':      { bg: '#fef3c7', color: '#92400e' },
  'Labourer':                { bg: '#f3f4f6', color: '#374151' },
  'Operator':                { bg: '#f3f4f6', color: '#374151' },
  'Weld':                    { bg: '#f4f4f5', color: '#374151' },
  'Welder':                  { bg: '#f4f4f5', color: '#374151' },
  'Quality':                 { bg: '#f3f4f6', color: '#374151' },
}

// ── Helpers ───────────────────────────────────────────────────────────────────
const ms  = d => d ? new Date(d).getTime() : 0
const fmt = d => d ? new Date(d + 'T00:00:00').toLocaleDateString('en-CA', { month: 'short', day: 'numeric' }) : '—'

function overlaps(aS, aE, bS, bE) {
  if (!aS || !aE || !bS || !bE) return false
  return !(new Date(aE) < new Date(bS) || new Date(bE) < new Date(aS))
}

function TradeBadge({ trade, staffed = true }) {
  const parent = trade?.includes(' - ') ? trade.split(' - ')[0] : trade
  const c = staffed
    ? (TRADE_COLORS[trade] || TRADE_COLORS[parent] || { bg: '#f3f4f6', color: '#374151' })
    : { bg: '#f4f4f5', color: '#a1a1aa' }
  return (
    <span style={{ display: 'inline-block', padding: '1px 7px', borderRadius: '99px', fontSize: '11px', fontWeight: 700, background: c.bg, color: c.color, whiteSpace: 'nowrap' }}>
      {trade || '—'}
    </span>
  )
}

function CertBadge({ cert }) {
  const now = new Date(); now.setHours(0, 0, 0, 0)
  const exp = cert.expiry_date ? new Date(cert.expiry_date + 'T00:00:00') : null
  const expired = exp && exp < now
  const days    = exp ? Math.floor((exp - now) / 86400000) : 999
  const soon    = !expired && days >= 0 && days <= 30
  const bg     = expired ? '#f4f4f5' : soon ? '#fffbeb' : '#f0f0f0'
  const color  = expired ? '#111'    : soon ? '#b45309' : '#374151'
  const border = expired ? '#e4e4e7' : soon ? '#fde68a' : '#e5e7eb'
  return (
    <span style={{ fontSize: '10px', fontWeight: 700, padding: '1px 6px', borderRadius: '3px', background: bg, color, border: `1px solid ${border}`, whiteSpace: 'nowrap' }}>
      {cert.cert_type}{expired ? ' – EXPIRED' : soon ? ' – exp soon' : ''}
    </span>
  )
}

// ── Component ─────────────────────────────────────────────────────────────────
export default function DispatchClient({ project, workers, windows: initialWindows, allWindows, windowAssignments: initialAssignments, holidays, rates }) {
  const supabase = createBrowserSupabase()
  const router   = useRouter()

  const [windows,           setWindows]           = useState(initialWindows)
  const [windowAssignments, setWindowAssignments] = useState(initialAssignments)
  const [selectedWindow,    setSelectedWindow]    = useState(initialWindows[0]?.id || null)
  const [addingWindow,      setAddingWindow]      = useState(false)
  const [newWin,            setNewWin]            = useState({ description: '', start_date: '', end_date: '' })
  const [saving,            setSaving]            = useState(false)
  const [error,             setError]             = useState('')
  const [selectedTrade,     setSelectedTrade]     = useState(null)
  const [workerSearch,      setWorkerSearch]      = useState('')

  // Rate map + trade helpers
  const rateMap      = useMemo(() => Object.fromEntries(rates.map(r => [r.id, r.personnel ? `${r.category} - ${r.personnel}` : r.category])), [rates])
  const workerTrade  = useCallback(w => rateMap[w.default_rate_id] || null, [rateMap])
  const staffedTrades = useMemo(() => new Set(workers.map(w => workerTrade(w)).filter(Boolean)), [workers, workerTrade])

  // All trade groups from rate schedule
  const dynamicTradeGroups = useMemo(() => {
    const allTrades = [...new Set(rates.map(r => r.personnel ? `${r.category} - ${r.personnel}` : r.category))].sort()
    const sections = {}
    for (const trade of allTrades) {
      const parent  = trade.includes(' - ') ? trade.split(' - ')[0] : trade
      const section = TRADE_SECTION[parent] || 'Other'
      if (!sections[section]) sections[section] = []
      sections[section].push(trade)
    }
    const order = [...SECTION_ORDER, 'Other']
    return order.filter(s => sections[s]).map(s => ({ label: s, trades: sections[s] }))
  }, [rates])

  // Derived
  const selWin         = windows.find(w => w.id === selectedWindow)
  const winAssignments = selectedWindow ? windowAssignments.filter(a => a.window_id === selectedWindow) : []
  const assignedIds    = new Set(winAssignments.map(a => a.worker_id))
  const winReqs        = selWin ? (selWin.crew_window_requirements || []) : []

  // Conflict detection
  function workerConflict(workerId, windowId) {
    const win = windows.find(w => w.id === windowId)
    if (!win) return null
    for (const a of windowAssignments.filter(a => a.worker_id === workerId && a.window_id !== windowId)) {
      const ow = allWindows.find(w => w.id === a.window_id)
      if (ow && overlaps(win.start_date, win.end_date, ow.start_date, ow.end_date)) {
        return ow.project_id === project.id ? 'Double-booked on this project' : 'On another project'
      }
    }
    for (const h of holidays.filter(h => h.worker_id === workerId)) {
      if (overlaps(win.start_date, win.end_date, h.start_date, h.end_date)) return 'On holiday'
    }
    return null
  }

  const workerGroups = useMemo(() => {
    if (!selWin) return { assigned: [], available: [], unavailable: [] }
    const assigned = [], available = [], unavailable = []
    workers.forEach(w => {
      const conflict   = workerConflict(w.id, selWin.id)
      const isAssigned = assignedIds.has(w.id)
      if (isAssigned)    assigned.push({ ...w, conflict })
      else if (conflict) unavailable.push({ ...w, conflict })
      else               available.push(w)
    })
    return { assigned, available, unavailable }
  }, [selWin?.id, workers, windowAssignments, holidays])

  function windowStats(win) {
    const reqs   = win.crew_window_requirements || []
    const asgns  = windowAssignments.filter(a => a.window_id === win.id)
    const required = reqs.reduce((s, r) => s + r.headcount, 0)
    return { required, assigned: asgns.length, open: Math.max(required - asgns.length, 0) }
  }

  // ── Window CRUD ──────────────────────────────────────────────────────────────
  async function saveWindow() {
    if (!newWin.start_date || !newWin.end_date) { setError('Start and end date required'); return }
    setSaving(true); setError('')
    const { data, error: err } = await supabase
      .from('project_crew_windows')
      .insert({ project_id: project.id, description: newWin.description || null, start_date: newWin.start_date, end_date: newWin.end_date })
      .select('*, crew_window_requirements(*)').single()
    if (err) { setError(err.message); setSaving(false); return }
    setWindows(prev => [...prev, data])
    setSelectedWindow(data.id)
    setAddingWindow(false)
    setNewWin({ description: '', start_date: '', end_date: '' })
    setSaving(false)
  }

  async function deleteWindow(windowId) {
    if (!confirm('Delete this crew window and all its assignments?')) return
    await supabase.from('project_crew_windows').delete().eq('id', windowId)
    setWindows(prev => prev.filter(w => w.id !== windowId))
    setWindowAssignments(prev => prev.filter(a => a.window_id !== windowId))
    if (selectedWindow === windowId) setSelectedWindow(windows.find(w => w.id !== windowId)?.id || null)
  }

  async function updateWindow(windowId, field, value) {
    setWindows(prev => prev.map(w => w.id === windowId ? { ...w, [field]: value } : w))
    await supabase.from('project_crew_windows').update({ [field]: value }).eq('id', windowId)
  }

  // ── Requirement CRUD ─────────────────────────────────────────────────────────
  async function upsertRequirement(windowId, trade, headcount) {
    const win      = windows.find(w => w.id === windowId)
    const existing = win?.crew_window_requirements?.find(r => r.trade === trade)
    if (headcount <= 0 && existing) {
      await supabase.from('crew_window_requirements').delete().eq('id', existing.id)
      setWindows(prev => prev.map(w => w.id === windowId
        ? { ...w, crew_window_requirements: w.crew_window_requirements.filter(r => r.id !== existing.id) }
        : w))
    } else if (existing) {
      const { data } = await supabase.from('crew_window_requirements').update({ headcount }).eq('id', existing.id).select().single()
      setWindows(prev => prev.map(w => w.id === windowId
        ? { ...w, crew_window_requirements: w.crew_window_requirements.map(r => r.id === existing.id ? data : r) }
        : w))
    } else if (headcount > 0) {
      const { data } = await supabase.from('crew_window_requirements').insert({ window_id: windowId, trade, headcount }).select().single()
      setWindows(prev => prev.map(w => w.id === windowId
        ? { ...w, crew_window_requirements: [...(w.crew_window_requirements || []), data] }
        : w))
    }
  }

  // ── Assignment CRUD ──────────────────────────────────────────────────────────
  async function addAssignment(windowId, workerId, trade) {
    const win = windows.find(w => w.id === windowId)
    const { data, error: err } = await supabase
      .from('crew_window_assignments')
      .insert({ window_id: windowId, worker_id: workerId, trade, onsite_start: win?.start_date || null, onsite_end: win?.end_date || null })
      .select().single()
    if (!err && data) setWindowAssignments(prev => [...prev, data])
  }

  async function removeAssignment(assignmentId) {
    await supabase.from('crew_window_assignments').delete().eq('id', assignmentId)
    setWindowAssignments(prev => prev.filter(a => a.id !== assignmentId))
  }

  async function updateAssignmentDate(assignmentId, field, value) {
    setWindowAssignments(prev => prev.map(a => a.id === assignmentId ? { ...a, [field]: value } : a))
    await supabase.from('crew_window_assignments').update({ [field]: value }).eq('id', assignmentId)
  }

  const miniBtn = { background: 'none', border: '1px solid var(--line)', borderRadius: '3px', width: '20px', height: '20px', cursor: 'pointer', fontWeight: 700, fontSize: '13px', lineHeight: 1, color: 'var(--muted)', display: 'flex', alignItems: 'center', justifyContent: 'center' }

  // ── Gantt helpers ─────────────────────────────────────────────────────────────
  const ganttSpan = useMemo(() => {
    const dates = windows.flatMap(w => [w.start_date, w.end_date].filter(Boolean))
    if (!dates.length) return null
    const minMs = Math.min(...dates.map(d => ms(d))) - 3 * 86400000
    const maxMs = Math.max(...dates.map(d => ms(d))) + 3 * 86400000
    return { start: new Date(minMs).toISOString().split('T')[0], end: new Date(maxMs).toISOString().split('T')[0], spanMs: maxMs - minMs }
  }, [windows])

  const gpct    = d      => ganttSpan ? Math.max(0, ((ms(d) - ms(ganttSpan.start)) / ganttSpan.spanMs) * 100) : 0
  const snapEnd = e => { if (!e) return e; const d = new Date(e + 'T00:00:00'); d.setDate(d.getDate() + 1); return d.toISOString().split('T')[0] }
  const gpctW   = (s, e) => ganttSpan ? Math.max(1, ((ms(snapEnd(e)) - ms(s)) / ganttSpan.spanMs) * 100) : 1

  const ganttMarks = useMemo(() => {
    if (!ganttSpan) return []
    const spanDays = ganttSpan.spanMs / 86400000
    const marks = []

    if (spanDays <= 30) {
      // Daily marks
      let d = new Date(ganttSpan.start + 'T00:00:00')
      const end = new Date(ganttSpan.end + 'T00:00:00')
      while (d <= end) {
        const p = ((d.getTime() - ms(ganttSpan.start)) / ganttSpan.spanMs) * 100
        if (p >= 0 && p <= 100) marks.push({ label: d.toLocaleDateString('en-CA', { month: 'short', day: 'numeric' }), pct: p })
        d = new Date(d); d.setDate(d.getDate() + 1)
      }
    } else if (spanDays <= 90) {
      // Weekly marks — find first Monday on or after span start
      let d = new Date(ganttSpan.start + 'T00:00:00')
      const dow = d.getDay()
      if (dow !== 1) d.setDate(d.getDate() + (8 - dow) % 7)
      const end = new Date(ganttSpan.end + 'T00:00:00')
      while (d <= end) {
        const p = ((d.getTime() - ms(ganttSpan.start)) / ganttSpan.spanMs) * 100
        if (p >= 0 && p <= 100) marks.push({ label: d.toLocaleDateString('en-CA', { month: 'short', day: 'numeric' }), pct: p })
        d = new Date(d); d.setDate(d.getDate() + 7)
      }
    } else {
      // Monthly marks
      let d = new Date(new Date(ganttSpan.start).getFullYear(), new Date(ganttSpan.start).getMonth(), 1)
      const end = new Date(ganttSpan.end)
      while (d <= end) {
        const p = ((d.getTime() - ms(ganttSpan.start)) / ganttSpan.spanMs) * 100
        if (p >= 0 && p <= 100) marks.push({ label: d.toLocaleDateString('en-CA', { month: 'short', day: 'numeric' }), pct: p })
        d = new Date(d.getFullYear(), d.getMonth() + 1, 1)
      }
    }

    // Always add span-start label if no marks landed near the left edge
    if (!marks.length || marks[0].pct > 10) {
      const d = new Date(ganttSpan.start + 'T00:00:00')
      marks.unshift({ label: d.toLocaleDateString('en-CA', { month: 'short', day: 'numeric' }), pct: 0 })
    }
    return marks
  }, [ganttSpan])

  const todayStr = new Date().toISOString().split('T')[0]

  return (
    <div className="grid">

      {/* ── Header ── */}
      <div className="page-header">
        <div className="split">
          <div>
            <div style={{ display: 'flex', gap: '12px' }}>
            <button onClick={() => router.back()} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--muted)', fontSize: '13px', fontWeight: 600, padding: '0 0 4px 0', display: 'flex', alignItems: 'center', gap: '4px' }}>
              ← Back to Project
            </button>
            <button onClick={() => router.push('/schedule')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--muted)', fontSize: '13px', fontWeight: 600, padding: '0 0 4px 0', display: 'flex', alignItems: 'center', gap: '4px' }}>
              ← Schedule
            </button>
          </div>
            <h1>{project.name}</h1>
            <p className="muted">{[project.internal_job_no, project.client_name, project.location, `${fmt(project.start_date)} – ${fmt(project.end_date)}`].filter(Boolean).join(' · ')}</p>
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button onClick={() => window.open(`/print/dispatch/${project.id}`, '_blank')} style={{ fontSize: '13px', fontWeight: 600, padding: '7px 14px', borderRadius: '6px', border: '1px solid var(--line)', background: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}>🖨 Print Dispatches</button>
            <button className="primary" onClick={() => setAddingWindow(true)}>+ Add Window</button>
          </div>
        </div>
      </div>

      {/* ── Gantt strip ── */}
      {ganttSpan && windows.length > 0 && (
        <section className="panel" style={{ padding: '12px 20px 14px', overflow: 'hidden' }}>

          {/* Column label row */}
          <div style={{ display: 'grid', gridTemplateColumns: '160px 130px 1fr', marginBottom: '4px' }}>
            <div style={{ fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--muted)' }}>Window</div>
            <div style={{ fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--muted)' }}>Dates</div>
            <div />
          </div>

          {/* Date scale axis */}
          <div style={{ display: 'grid', gridTemplateColumns: '160px 130px 1fr', marginBottom: '6px' }}>
            <div /><div />
            <div style={{ position: 'relative', height: '22px', borderBottom: '1px solid var(--line)', marginTop: '16px' }}>
              {ganttMarks.map(m => (
                <div key={m.label} style={{ position: 'absolute', left: m.pct + '%', top: 0, bottom: 0 }}>
                  <div style={{ width: '1px', height: '100%', background: '#d1d5db' }} />
                  <span style={{ position: 'absolute', top: '2px', left: '4px', fontSize: '10px', fontWeight: 600, color: '#6b7280', whiteSpace: 'nowrap', textTransform: 'uppercase', letterSpacing: '0.04em' }}>{m.label}</span>
                </div>
              ))}
              {/* Today marker on scale */}
              <div style={{ position: 'absolute', left: gpct(todayStr) + '%', top: 0, bottom: 0, width: '2px', background: '#3b82f6', zIndex: 2 }}>
                <span style={{ position: 'absolute', top: '-16px', left: '4px', fontSize: '10px', fontWeight: 700, color: '#3b82f6', whiteSpace: 'nowrap', background: 'white', padding: '0 2px' }}>Today</span>
              </div>
            </div>
          </div>

          {/* Window rows */}
          <div style={{ display: 'grid', gridTemplateColumns: '160px 130px 1fr', gap: '0' }}>
            {windows.map(win => {
              const stats    = windowStats(win)
              const color    = stats.required === 0 ? '#94a3b8' : stats.open === 0 ? '#16a34a' : '#d97706'
              const isActive = win.id === selectedWindow
              return (
                <>
                  <div
                    key={win.id + '-label'}
                    onClick={() => { setSelectedWindow(isActive ? null : win.id); setSelectedTrade(null); setWorkerSearch('') }}
                    style={{ fontSize: '12px', fontWeight: isActive ? 700 : 500, color: isActive ? '#111' : 'var(--muted)', cursor: 'pointer', display: 'flex', alignItems: 'center', paddingRight: '12px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}
                  >
                    {win.description || 'Unnamed'}
                  </div>
                  <div
                    key={win.id + '-dates'}
                    onClick={() => { setSelectedWindow(isActive ? null : win.id); setSelectedTrade(null); setWorkerSearch('') }}
                    style={{ fontSize: '11px', color: 'var(--muted)', cursor: 'pointer', display: 'flex', alignItems: 'center', paddingRight: '12px', whiteSpace: 'nowrap' }}
                  >
                    {fmt(win.start_date)} – {fmt(win.end_date)}
                  </div>
                  <div key={win.id + '-bar'} style={{ position: 'relative', height: '28px' }}>
                    {/* Grid lines from scale */}
                    {ganttMarks.map(m => (
                      <div key={m.label} style={{ position: 'absolute', left: m.pct + '%', top: 0, bottom: 0, width: '1px', background: '#f0f0f0', zIndex: 0 }} />
                    ))}
                    {/* Today line */}
                    <div style={{ position: 'absolute', left: gpct(todayStr) + '%', top: 0, bottom: 0, width: '2px', background: '#bfdbfe', zIndex: 1, pointerEvents: 'none' }} />
                    <div
                      onClick={() => { setSelectedWindow(isActive ? null : win.id); setSelectedTrade(null); setWorkerSearch('') }}
                      title={`${fmt(win.start_date)} – ${fmt(win.end_date)} · ${stats.assigned}/${stats.required} dispatched`}
                      style={{
                        position: 'absolute', top: '6px', height: '16px',
                        left: gpct(win.start_date) + '%',
                        width: gpctW(win.start_date, win.end_date) + '%',
                        background: color, borderRadius: '4px', cursor: 'pointer', minWidth: '6px', zIndex: 2,
                        outline: isActive ? '2px solid #111' : 'none', outlineOffset: '2px',
                      }}
                    />
                  </div>
                </>
              )
            })}
          </div>
        </section>
      )}

      {/* ── Add window form ── */}
      {addingWindow && (
        <section className="panel" style={{ padding: '16px 20px' }}>
          <h3 style={{ fontSize: '13px', fontWeight: 700, marginBottom: '12px' }}>New Crew Window</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 160px 160px auto auto', gap: '10px', alignItems: 'end' }}>
            <label style={{ fontSize: '12px', fontWeight: 600 }}>
              Description (optional)
              <input value={newWin.description} onChange={e => setNewWin(p => ({ ...p, description: e.target.value }))} placeholder="e.g. Phase 1 – Mechanical" style={{ marginTop: '4px' }} />
            </label>
            <label style={{ fontSize: '12px', fontWeight: 600 }}>
              Start Date
              <input type="date" value={newWin.start_date} onChange={e => setNewWin(p => ({ ...p, start_date: e.target.value }))} style={{ marginTop: '4px' }} />
            </label>
            <label style={{ fontSize: '12px', fontWeight: 600 }}>
              End Date
              <input type="date" value={newWin.end_date} min={newWin.start_date} onChange={e => setNewWin(p => ({ ...p, end_date: e.target.value }))} style={{ marginTop: '4px' }} />
            </label>
            <button className="primary" onClick={saveWindow} disabled={saving} style={{ marginBottom: '1px' }}>{saving ? 'Saving…' : 'Save'}</button>
            <button onClick={() => { setAddingWindow(false); setError('') }} style={{ marginBottom: '1px' }}>Cancel</button>
          </div>
          {error && <p style={{ fontSize: '12px', color: 'var(--danger)', marginTop: '8px' }}>{error}</p>}
        </section>
      )}

      {/* ── No windows ── */}
      {windows.length === 0 && !addingWindow && (
        <section className="panel" style={{ padding: '40px', textAlign: 'center', color: 'var(--muted)', fontSize: '13px' }}>
          No crew windows yet — click "+ Add Window" to get started.
        </section>
      )}

      {/* ── Accordion window cards ── */}
      {windows.map(win => {
        const stats      = windowStats(win)
        const dot        = stats.required === 0 ? '#94a3b8' : stats.open === 0 ? '#16a34a' : '#d97706'
        const isExpanded = win.id === selectedWindow

        return (
          <section key={win.id} className="panel" style={{ overflow: 'hidden' }}>

            {/* Card header */}
            <div
              onClick={() => { setSelectedWindow(isExpanded ? null : win.id); setSelectedTrade(null); setWorkerSearch('') }}
              style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '14px 20px', cursor: 'pointer', userSelect: 'none', borderBottom: isExpanded ? '1px solid var(--line)' : 'none' }}
            >
              <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: dot, flexShrink: 0, display: 'inline-block' }} />
              <div style={{ flex: 1 }}>
                <span style={{ fontWeight: 700, fontSize: '14px' }}>{win.description || 'Unnamed Window'}</span>
                <span style={{ fontSize: '12px', color: 'var(--muted)', marginLeft: '10px' }}>{fmt(win.start_date)} – {fmt(win.end_date)}</span>
              </div>
              <span style={{
                fontSize: '11px', fontWeight: 700, padding: '2px 8px', borderRadius: '99px',
                background: stats.open > 0 ? '#fef3c7' : stats.required > 0 ? '#dcfce7' : '#f4f4f5',
                color:      stats.open > 0 ? '#92400e' : stats.required > 0 ? '#166534' : '#71717a',
              }}>
                {stats.assigned}/{stats.required} dispatched
              </span>
              <span style={{ fontSize: '12px', color: 'var(--muted)', marginLeft: '4px' }}>{isExpanded ? '▲' : '▼'}</span>
            </div>

            {/* Expanded body */}
            {isExpanded && (
              <div key={win.id} style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>

                {/* Edit fields */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 160px 160px auto', gap: '10px', alignItems: 'end' }}>
                  <label style={{ fontSize: '12px', fontWeight: 600 }}>
                    Description
                    <input defaultValue={win.description || ''} onBlur={e => updateWindow(win.id, 'description', e.target.value)} placeholder="e.g. Phase 1" style={{ marginTop: '4px' }} />
                  </label>
                  <label style={{ fontSize: '12px', fontWeight: 600 }}>
                    Start Date
                    <input type="date" defaultValue={win.start_date} onBlur={e => updateWindow(win.id, 'start_date', e.target.value)} style={{ marginTop: '4px' }} />
                  </label>
                  <label style={{ fontSize: '12px', fontWeight: 600 }}>
                    End Date
                    <input type="date" defaultValue={win.end_date} onBlur={e => updateWindow(win.id, 'end_date', e.target.value)} style={{ marginTop: '4px' }} />
                  </label>
                  <button className="small" style={{ color: '#111', borderColor: '#e4e4e7', marginBottom: '1px' }} onClick={() => deleteWindow(win.id)}>Delete</button>
                </div>

                {/* Manpower + Available */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 460px', gap: '20px' }}>

                  {/* Left: manpower required */}
                  <div>
                    <h4 style={{ fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--muted)', marginBottom: '10px' }}>Manpower Required</h4>
                    <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
                      <select id={`trade-select-${win.id}`} defaultValue="" style={{ flex: 1, fontSize: '13px' }}>
                        <option value="" disabled>Select a position…</option>
                        {dynamicTradeGroups.map(group => (
                          <optgroup key={group.label} label={group.label}>
                            {group.trades.map(trade => (
                              <option key={trade} value={trade} disabled={!staffedTrades.has(trade)}>
                                {trade}{!staffedTrades.has(trade) ? ' — no staff' : ''}
                              </option>
                            ))}
                          </optgroup>
                        ))}
                      </select>
                      <button className="small primary" onClick={() => {
                        const sel = document.getElementById(`trade-select-${win.id}`)
                        const trade = sel?.value
                        if (!trade) return
                        const existing = winReqs.find(r => r.trade === trade)
                        upsertRequirement(win.id, trade, (existing?.headcount || 0) + 1)
                        sel.value = ''
                      }}>+ Add</button>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      {winReqs.length === 0 && <p style={{ fontSize: '12px', color: 'var(--muted)', margin: 0 }}>No positions added yet.</p>}
                      {winReqs.map(req => {
                        const { trade, headcount: count } = req
                        const assigned        = winAssignments.filter(a => a.trade === trade)
                        const assignedWorkers = assigned.map(a => ({
                          ...workers.find(w => w.id === a.worker_id),
                          assignmentId: a.id, onsite_start: a.onsite_start, onsite_end: a.onsite_end,
                        })).filter(w => w?.id)
                        const isSelected = selectedTrade === trade
                        const isUnknownTrade = !dynamicTradeGroups.flatMap(g => g.trades).includes(trade)
                        return (
                          <div key={trade} onClick={() => setSelectedTrade(isSelected ? null : trade)} style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap', padding: '6px 10px', borderRadius: '6px', cursor: 'pointer', background: isSelected ? '#f0f4ff' : '#fafafa', border: `1px solid ${isSelected ? '#93c5fd' : isUnknownTrade ? '#fca5a5' : '#e4e4e7'}` }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', flexShrink: 0 }}>
                              <button style={miniBtn} onClick={e => { e.stopPropagation(); upsertRequirement(win.id, trade, count - 1) }}>−</button>
                              <span style={{ fontSize: '13px', fontWeight: 700, minWidth: '16px', textAlign: 'center' }}>{count}</span>
                              <button style={miniBtn} onClick={e => { e.stopPropagation(); upsertRequirement(win.id, trade, count + 1) }}>+</button>
                            </div>
                            {isUnknownTrade ? (
                              <div onClick={e => e.stopPropagation()} style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
                                <span style={{ fontSize: '11px', color: '#dc2626', fontWeight: 600 }}>⚠ Unknown trade: "{trade}"</span>
                                <select style={{ fontSize: '12px', padding: '2px 4px' }} defaultValue="" onChange={async e => {
                                  const newTrade = e.target.value
                                  if (!newTrade) return
                                  // Insert new req with correct trade, delete old
                                  const existing = winReqs.find(r => r.trade === newTrade)
                                  await upsertRequirement(win.id, newTrade, (existing?.headcount || 0) + count)
                                  await upsertRequirement(win.id, trade, 0)
                                  e.target.value = ''
                                }}>
                                  <option value="">Change to…</option>
                                  {dynamicTradeGroups.map(group => (
                                    <optgroup key={group.label} label={group.label}>
                                      {group.trades.filter(t => staffedTrades.has(t)).map(t => (
                                        <option key={t} value={t}>{t}</option>
                                      ))}
                                    </optgroup>
                                  ))}
                                </select>
                              </div>
                            ) : (
                              <div style={{ flexShrink: 0 }}><TradeBadge trade={trade} staffed={staffedTrades.has(trade)} /></div>
                            )}
                            {assignedWorkers.map(w => (
                              <div key={w.id} onClick={e => e.stopPropagation()} style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
                                <span style={{ fontSize: '12px', fontWeight: 600, whiteSpace: 'nowrap' }}>
                                  {w.name}{w.conflict && <span style={{ color: '#d97706', fontSize: '10px', marginLeft: '4px' }}>⚠</span>}
                                </span>
                                <input key={w.assignmentId + '-s'} type="date" defaultValue={w.onsite_start || win.start_date || ''} onBlur={e => updateAssignmentDate(w.assignmentId, 'onsite_start', e.target.value)} style={{ fontSize: '11px', padding: '2px 5px', width: '126px' }} />
                                <span style={{ fontSize: '11px', color: 'var(--muted)' }}>→</span>
                                <input key={w.assignmentId + '-e'} type="date" defaultValue={w.onsite_end || win.end_date || ''} onBlur={e => updateAssignmentDate(w.assignmentId, 'onsite_end', e.target.value)} style={{ fontSize: '11px', padding: '2px 5px', width: '126px' }} />
                                <button onClick={() => removeAssignment(w.assignmentId)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#aaa', fontSize: '14px', lineHeight: 1, padding: '0 2px' }} title="Remove">×</button>
                              </div>
                            ))}
                            {/* Delete requirement row */}
                            <button onClick={e => { e.stopPropagation(); upsertRequirement(win.id, trade, 0) }} style={{ marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer', color: '#d1d5db', fontSize: '16px', lineHeight: 1, padding: '0 2px', flexShrink: 0 }} title="Remove this requirement">×</button>
                          </div>
                        )
                      })}
                    </div>
                  </div>

                  {/* Right: available workers */}
                  <div style={{ borderLeft: '1px solid var(--line)', paddingLeft: '20px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                      <h4 style={{ fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--muted)', margin: 0 }}>
                        Available — {workerGroups.available.length}
                      </h4>
                      {selectedTrade && <TradeBadge trade={selectedTrade} staffed={staffedTrades.has(selectedTrade)} />}
                    </div>
                    <div style={{ position: 'relative', marginBottom: '8px' }}>
                      <input value={workerSearch} onChange={e => setWorkerSearch(e.target.value)} placeholder="Search name or trade…" style={{ width: '100%', paddingRight: workerSearch ? '28px' : undefined, fontSize: '13px', boxSizing: 'border-box' }} />
                      {workerSearch && <button onClick={() => setWorkerSearch('')} style={{ position: 'absolute', right: '8px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--muted)', fontSize: '14px', lineHeight: 1, padding: 0 }}>×</button>}
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', maxHeight: '500px', overflowY: 'auto' }}>
                      {[...workerGroups.available].filter(w => {
                        if (!workerSearch) return true
                        const q = workerSearch.toLowerCase()
                        return w.name.toLowerCase().includes(q) || (workerTrade(w) || '').toLowerCase().includes(q)
                      }).sort((a, b) => (workerTrade(a) === selectedTrade ? 0 : 1) - (workerTrade(b) === selectedTrade ? 0 : 1))
                        .map(w => {
                          const certs = w.worker_certifications || []
                          return (
                            <div key={w.id} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '7px 10px', background: '#f8fafc', border: '1px solid var(--line)', borderRadius: '6px' }}>
                              <div style={{ flex: 1 }}>
                                <div style={{ fontSize: '13px', fontWeight: 600 }}>{w.name}</div>
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginTop: '3px' }}>
                                  <TradeBadge trade={workerTrade(w)} staffed={true} />
                                  {certs.map(c => <CertBadge key={c.id} cert={c} />)}
                                </div>
                              </div>
                              <button className="small primary" style={{ flexShrink: 0 }} onClick={async () => {
                                const trade = workerTrade(w)
                                if (trade) { const req = winReqs.find(r => r.trade === trade); await upsertRequirement(win.id, trade, (req?.headcount || 0) + 1) }
                                addAssignment(win.id, w.id, trade)
                              }}>+ Add</button>
                            </div>
                          )
                        })}
                      {workerGroups.unavailable.length > 0 && (
                        <>
                          <div style={{ fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--muted)', padding: '8px 0 4px', borderTop: '1px solid var(--line)', marginTop: '4px' }}>
                            Unavailable — {workerGroups.unavailable.length}
                          </div>
                          {workerGroups.unavailable.map(w => {
                            const certs = w.worker_certifications || []
                            return (
                              <div key={w.id} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '7px 10px', background: '#fffbeb', border: '1px solid #fde68a', borderRadius: '6px', opacity: 0.85 }}>
                                <div style={{ flex: 1 }}>
                                  <div style={{ fontSize: '13px', fontWeight: 600 }}>{w.name}</div>
                                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginTop: '3px' }}>
                                    <TradeBadge trade={workerTrade(w)} staffed={true} />
                                    {certs.map(c => <CertBadge key={c.id} cert={c} />)}
                                    <span style={{ fontSize: '11px', color: '#d97706', fontWeight: 700 }}>⚠ {w.conflict}</span>
                                  </div>
                                </div>
                                <button className="small" style={{ flexShrink: 0 }} onClick={async () => {
                                  const trade = workerTrade(w)
                                  if (trade) { const req = winReqs.find(r => r.trade === trade); await upsertRequirement(win.id, trade, (req?.headcount || 0) + 1) }
                                  addAssignment(win.id, w.id, trade)
                                }} title="Add anyway">Add anyway</button>
                              </div>
                            )
                          })}
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </section>
        )
      })}
    </div>
  )
}
