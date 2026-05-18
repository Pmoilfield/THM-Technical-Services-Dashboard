'use client'
import { useState, useMemo, useCallback, useRef } from 'react'
import { createBrowserSupabase } from '@/lib/supabase'

// ── Constants ─────────────────────────────────────────────────────────────────
const TRADE_GROUPS = [
  { label: 'Mechanical',          trades: ['Pipefitter', 'Labourer', 'Operator'] },
  { label: 'Weld',                trades: ['Weld – CWB', 'Weld – B-Pressure', 'Weld – Fire Watch'] },
  { label: 'Electrical',          trades: ['Electrical'] },
  { label: 'Instrumentation',     trades: ['Instrumentation'] },
  { label: 'Management & Support',trades: ['Construction Management', 'Project Management', 'Quality'] },
]

const TRADE_COLORS = {
  'Electrical':              { bg: '#dbeafe', color: '#1e40af' },
  'Instrumentation':         { bg: '#f3e8ff', color: '#6d28d9' },
  'Pipefitter':              { bg: '#dcfce7', color: '#166534' },
  'Construction Management': { bg: '#fef3c7', color: '#92400e' },
  'Project Management':      { bg: '#fef3c7', color: '#92400e' },
  'Labourer':                { bg: '#f3f4f6', color: '#374151' },
  'Operator':                { bg: '#f3f4f6', color: '#374151' },
  'Welder':                  { bg: '#f4f4f5', color: '#374151' },
  'Weld – CWB':              { bg: '#f4f4f5', color: '#374151' },
  'Weld – B-Pressure':       { bg: '#f4f4f5', color: '#374151' },
  'Weld – Fire Watch':       { bg: '#f4f4f5', color: '#374151' },
  'Quality':                 { bg: '#f3f4f6', color: '#374151' },
}

// ── Helpers ───────────────────────────────────────────────────────────────────
const ms   = d => d ? new Date(d).getTime() : 0
const fmt  = d => d ? new Date(d + 'T00:00:00').toLocaleDateString('en-CA', { month: 'short', day: 'numeric' }) : '—'
const todayStr = () => new Date().toISOString().split('T')[0]

function overlaps(aS, aE, bS, bE) {
  if (!aS || !aE || !bS || !bE) return false
  return !(new Date(aE) < new Date(bS) || new Date(bE) < new Date(aS))
}

function TradeBadge({ trade }) {
  const c = TRADE_COLORS[trade] || { bg: '#f3f4f6', color: '#374151' }
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
export default function ScheduleClient({ projects, workers, windows: initialWindows, requirements: initialRequirements, windowAssignments: initialWindowAssignments, holidays, rates }) {
  const supabase    = createBrowserSupabase()
  const dispatchRef = useRef(null)

  const [windows,           setWindows]           = useState(initialWindows)
  const [requirements,      setRequirements]      = useState(initialRequirements)
  const [windowAssignments, setWindowAssignments] = useState(initialWindowAssignments)
  const [selectedProject,   setSelectedProject]   = useState(null)
  const [selectedWindow,    setSelectedWindow]    = useState(null)
  const [addingWindow,      setAddingWindow]      = useState(false)
  const [newWin,            setNewWin]            = useState({ description: '', start_date: '', end_date: '' })
  const [saving,            setSaving]            = useState(false)
  const [error,             setError]             = useState('')
  const [search,            setSearch]            = useState('')
  const [viewMode,          setViewMode]          = useState('month')

  // Rate map: rate_id → category
  const rateMap    = useMemo(() => Object.fromEntries(rates.map(r => [r.id, r.category])), [rates])
  const workerTrade = useCallback(w => rateMap[w.default_rate_id] || null, [rateMap])

  // ── Gantt span ─────────────────────────────────────────────────────────────
  const { spanStart, spanEnd, spanMs } = useMemo(() => {
    if (viewMode === 'week') {
      const now = new Date(); now.setHours(0,0,0,0)
      const sunday = new Date(now.getTime() - now.getDay() * 86400000)
      const saturday = new Date(sunday.getTime() + 6 * 86400000)
      const start = sunday.toISOString().split('T')[0]
      const end   = saturday.toISOString().split('T')[0]
      return { spanStart: start, spanEnd: end, spanMs: ms(end) - ms(start) + 86400000 }
    }
    const valid = projects.filter(p => p.start_date)
    if (!valid.length) { const t = todayStr(); return { spanStart: t, spanEnd: t, spanMs: 1 } }
    const s = Math.min(...valid.map(p => ms(p.start_date)))
    const e = Math.max(...valid.map(p => ms(p.end_date || p.start_date)))
    return {
      spanStart: new Date(s - 14 * 86400000).toISOString().split('T')[0],
      spanEnd:   new Date(e + 14 * 86400000).toISOString().split('T')[0],
      spanMs:    (e + 14 * 86400000) - (s - 14 * 86400000),
    }
  }, [projects, viewMode])

  const pct  = d      => d ? Math.max(0, ((ms(d) - ms(spanStart)) / spanMs) * 100) : 0
  const pctW = (s, e) => s && e ? Math.max(0.5, ((ms(e) - ms(s)) / spanMs) * 100) : 0.5

  const timeMarks = useMemo(() => {
    const marks = []
    if (viewMode === 'week') {
      // one tick per day Sun–Sat
      let d = new Date(spanStart + 'T00:00:00')
      const end = new Date(spanEnd + 'T00:00:00')
      while (d <= end) {
        const p = ((d.getTime() - ms(spanStart)) / spanMs) * 100
        if (p >= 0 && p <= 100) marks.push({ label: d.toLocaleDateString('en-CA', { weekday: 'short', month: 'short', day: 'numeric' }), pct: p })
        d = new Date(d.getTime() + 86400000)
      }
    } else if (viewMode === 'quarter') {
      const qMonths = [0, 3, 6, 9]
      let year = new Date(spanStart).getFullYear() - 1
      const endYear = new Date(spanEnd).getFullYear() + 1
      while (year <= endYear) {
        for (const m of qMonths) {
          const d = new Date(year, m, 1)
          const p = ((d.getTime() - ms(spanStart)) / spanMs) * 100
          if (p >= 0 && p <= 100) marks.push({ label: `Q${Math.floor(m / 3) + 1} '${String(year).slice(2)}`, pct: p })
        }
        year++
      }
    } else {
      let d = new Date(new Date(spanStart).getFullYear(), new Date(spanStart).getMonth(), 1)
      const end = new Date(spanEnd)
      while (d <= end) {
        const p = ((d.getTime() - ms(spanStart)) / spanMs) * 100
        if (p >= 0 && p <= 100) marks.push({ label: d.toLocaleDateString('en-CA', { month: 'short', year: '2-digit' }), pct: p })
        d = new Date(d.getFullYear(), d.getMonth() + 1, 1)
      }
    }
    return marks
  }, [spanStart, spanEnd, spanMs, viewMode])

  // ── Stats helpers ──────────────────────────────────────────────────────────
  function windowStats(windowId) {
    const reqs  = requirements.filter(r => r.window_id === windowId)
    const asgns = windowAssignments.filter(a => a.window_id === windowId)
    const required = reqs.reduce((s, r) => s + r.headcount, 0)
    return { required, assigned: asgns.length, open: Math.max(required - asgns.length, 0) }
  }

  function workerConflict(workerId, windowId) {
    const win = windows.find(w => w.id === windowId)
    if (!win) return null
    for (const a of windowAssignments.filter(a => a.worker_id === workerId && a.window_id !== windowId)) {
      const ow = windows.find(w => w.id === a.window_id)
      if (ow && overlaps(win.start_date, win.end_date, ow.start_date, ow.end_date)) {
        const proj = projects.find(p => p.id === ow.project_id)
        return ow.project_id === win.project_id ? 'Double-booked on this project' : `On ${proj?.name || 'another project'}`
      }
    }
    for (const h of holidays.filter(h => h.worker_id === workerId)) {
      if (overlaps(win.start_date, win.end_date, h.start_date, h.end_date)) return 'On holiday'
    }
    return null
  }

  const summaryStats = useMemo(() => {
    const t = todayStr()
    const weekEnd = new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0]
    let thisWeek = 0
    projects.forEach(p => { if (overlaps(p.start_date, p.end_date || p.start_date, t, weekEnd)) thisWeek++ })
    const dispatched = new Set(windowAssignments.map(a => a.worker_id)).size
    const conflictWindows = windows.filter(w =>
      windowAssignments.filter(a => a.window_id === w.id).some(a => workerConflict(a.worker_id, w.id))
    ).length
    return { active: projects.length, thisWeek, dispatched, conflictWindows }
  }, [projects, windows, windowAssignments, holidays])

  const filteredProjects = useMemo(() => {
    const q = search.toLowerCase()
    return projects.filter(p => !q || [p.name, p.client_name, p.internal_job_no, p.location, p.project_manager].join(' ').toLowerCase().includes(q))
  }, [projects, search])

  // ── Window CRUD ────────────────────────────────────────────────────────────
  async function saveWindow() {
    if (!newWin.start_date || !newWin.end_date) { setError('Start and end date required'); return }
    setSaving(true); setError('')
    const { data, error: err } = await supabase
      .from('project_crew_windows')
      .insert({ project_id: selectedProject, description: newWin.description || null, start_date: newWin.start_date, end_date: newWin.end_date })
      .select().single()
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
    setRequirements(prev => prev.filter(r => r.window_id !== windowId))
    setWindowAssignments(prev => prev.filter(a => a.window_id !== windowId))
    if (selectedWindow === windowId) setSelectedWindow(null)
  }

  async function updateWindow(windowId, field, value) {
    setWindows(prev => prev.map(w => w.id === windowId ? { ...w, [field]: value } : w))
    await supabase.from('project_crew_windows').update({ [field]: value }).eq('id', windowId)
  }

  // ── Requirement CRUD ───────────────────────────────────────────────────────
  async function upsertRequirement(windowId, trade, headcount) {
    const existing = requirements.find(r => r.window_id === windowId && r.trade === trade)
    if (headcount <= 0 && existing) {
      await supabase.from('crew_window_requirements').delete().eq('id', existing.id)
      setRequirements(prev => prev.filter(r => r.id !== existing.id))
    } else if (existing) {
      const { data } = await supabase.from('crew_window_requirements').update({ headcount }).eq('id', existing.id).select().single()
      setRequirements(prev => prev.map(r => r.id === existing.id ? data : r))
    } else if (headcount > 0) {
      const { data } = await supabase.from('crew_window_requirements').insert({ window_id: windowId, trade, headcount }).select().single()
      setRequirements(prev => [...prev, data])
    }
  }

  // ── Assignment CRUD ────────────────────────────────────────────────────────
  async function addAssignment(windowId, workerId, trade) {
    const { data, error: err } = await supabase.from('crew_window_assignments').insert({ window_id: windowId, worker_id: workerId, trade }).select().single()
    if (!err && data) setWindowAssignments(prev => [...prev, data])
  }

  async function removeAssignment(assignmentId) {
    await supabase.from('crew_window_assignments').delete().eq('id', assignmentId)
    setWindowAssignments(prev => prev.filter(a => a.id !== assignmentId))
  }

  // ── Select helpers ─────────────────────────────────────────────────────────
  function openProject(projId) {
    if (projId === selectedProject) { setSelectedProject(null); setSelectedWindow(null); return }
    setSelectedProject(projId)
    setAddingWindow(false)
    const first = windows.find(w => w.project_id === projId)
    setSelectedWindow(first?.id || null)
    setTimeout(() => dispatchRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 50)
  }

  function openWindow(winId) {
    setSelectedWindow(winId)
    setAddingWindow(false)
  }

  // ── Derived for dispatch panel ─────────────────────────────────────────────
  const selProj        = projects.find(p => p.id === selectedProject)
  const selWin         = windows.find(w => w.id === selectedWindow)
  const projWindows    = selectedProject ? windows.filter(w => w.project_id === selectedProject).sort((a, b) => ms(a.start_date) - ms(b.start_date)) : []
  const winAssignments = selectedWindow  ? windowAssignments.filter(a => a.window_id === selectedWindow) : []
  const assignedIds    = new Set(winAssignments.map(a => a.worker_id))
  const winReqs        = selectedWindow  ? requirements.filter(r => r.window_id === selectedWindow) : []

  const workerGroups = useMemo(() => {
    if (!selWin) return { assigned: [], available: [], unavailable: [] }
    const assigned = [], available = [], unavailable = []
    workers.forEach(w => {
      const conflict   = workerConflict(w.id, selWin.id)
      const isAssigned = assignedIds.has(w.id)
      if (isAssigned)        assigned.push({ ...w, conflict })
      else if (conflict)     unavailable.push({ ...w, conflict })
      else                   available.push(w)
    })
    return { assigned, available, unavailable }
  }, [selWin?.id, workers, windowAssignments, holidays])

  // ── Shared styles ──────────────────────────────────────────────────────────
  const miniBtn = { background: 'none', border: '1px solid var(--line)', borderRadius: '3px', width: '20px', height: '20px', cursor: 'pointer', fontWeight: 700, fontSize: '13px', lineHeight: 1, color: 'var(--muted)', display: 'flex', alignItems: 'center', justifyContent: 'center' }

  return (
    <div className="grid">

      {/* ── Header ── */}
      <div className="page-header">
        <div className="split">
          <div><h1>Schedule</h1><p className="muted">Manpower loading · Outage planning · Dispatch</p></div>
        </div>
      </div>

      {/* ── Summary strip ── */}
      <div style={{ display: 'flex', background: '#fff', border: '1px solid var(--line)', borderRadius: '12px', overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
        {[
          { label: 'Active Projects',   value: summaryStats.active },
          { label: 'Active This Week',  value: summaryStats.thisWeek },
          { label: 'Workers Dispatched',value: summaryStats.dispatched,       color: '#16a34a' },
          { label: 'Conflict Windows',  value: summaryStats.conflictWindows,  color: summaryStats.conflictWindows > 0 ? '#d97706' : '#16a34a' },
        ].map((s, i) => (
          <div key={s.label} style={{ flex: 1, padding: '12px 20px', borderLeft: i > 0 ? '1px solid var(--line)' : 'none' }}>
            <div style={{ fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--muted)' }}>{s.label}</div>
            <div style={{ fontSize: '24px', fontWeight: 800, marginTop: '2px', color: s.color || 'var(--ink)' }}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* ── Search ── */}
      <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search project, job #, client, location…" style={{ maxWidth: '360px' }} />
        {search && <button className="small" onClick={() => setSearch('')}>Clear</button>}
        <span className="muted" style={{ fontSize: '12px', marginLeft: 'auto' }}>
          {filteredProjects.length} of {projects.length} projects · Click a row to dispatch
        </span>
      </div>

      {/* ── Gantt ── */}
      <section className="panel" style={{ overflow: 'hidden' }}>
        <div style={{ padding: '11px 16px', borderBottom: '1px solid var(--line)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <h2 style={{ fontSize: '14px', fontWeight: 700 }}>Manpower Loading</h2>
            <div style={{ display: 'flex', gap: '3px', background: '#f4f4f5', borderRadius: '6px', padding: '2px' }}>
              {[['week','Week'],['month','Month'],['quarter','Quarter']].map(([v, label]) => (
                <button key={v} onClick={() => setViewMode(v)} style={{
                  fontSize: '11px', fontWeight: 600, padding: '3px 10px', borderRadius: '4px', border: 'none', cursor: 'pointer',
                  background: viewMode === v ? '#fff' : 'transparent',
                  color: viewMode === v ? '#111' : '#71717a',
                  boxShadow: viewMode === v ? '0 1px 3px rgba(0,0,0,0.12)' : 'none',
                  transition: 'all 0.15s',
                }}>{label}</button>
              ))}
            </div>
          </div>
          {selectedProject && <button className="small" onClick={() => { setSelectedProject(null); setSelectedWindow(null) }}>Clear selection</button>}
        </div>

        <div style={{ overflowX: 'auto' }}>
          {/* Month axis */}
          <div style={{ display: 'grid', gridTemplateColumns: '280px 1fr', padding: '0 14px', borderBottom: '1px solid var(--line)', background: '#f8fafc', minHeight: '26px' }}>
            <div style={{ fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--muted)', display: 'flex', alignItems: 'center' }}>Project</div>
            <div style={{ position: 'relative', minWidth: '700px', height: '26px' }}>
              {timeMarks.map(m => (
                <div key={m.label} style={{ position: 'absolute', left: m.pct + '%', top: 0, bottom: 0, display: 'flex', alignItems: 'center' }}>
                  <div style={{ width: '1px', height: '100%', background: 'var(--line)' }} />
                  <span style={{ fontSize: '10px', fontWeight: 600, color: 'var(--muted)', paddingLeft: '3px', whiteSpace: 'nowrap', textTransform: 'uppercase' }}>{m.label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Project rows */}
          <div style={{ padding: '4px 14px 8px', display: 'flex', flexDirection: 'column', gap: '2px' }}>
            {filteredProjects.length === 0 && (
              <div style={{ padding: '24px', textAlign: 'center', color: 'var(--muted)', fontSize: '13px' }}>No projects with scheduled dates.</div>
            )}

            {filteredProjects.map(p => {
              const projWins  = windows.filter(w => w.project_id === p.id)
              const isSelected = p.id === selectedProject
              const hasConflict = projWins.some(w =>
                windowAssignments.filter(a => a.window_id === w.id).some(a => workerConflict(a.worker_id, w.id))
              )
              const totalReq = projWins.reduce((s, w) => s + requirements.filter(r => r.window_id === w.id).reduce((ss, r) => ss + r.headcount, 0), 0)
              const totalAsgn = windowAssignments.filter(a => projWins.some(w => w.id === a.window_id)).length

              return (
                <div
                  key={p.id}
                  onClick={() => openProject(p.id)}
                  style={{
                    display: 'grid', gridTemplateColumns: '280px 1fr', alignItems: 'center',
                    gap: '14px', padding: '6px 8px', borderRadius: '8px', cursor: 'pointer',
                    background: isSelected ? '#f4f4f5' : 'transparent',
                    border: `1px solid ${isSelected ? '#e4e4e7' : 'transparent'}`,
                    transition: 'background 0.1s',
                  }}
                >
                  {/* Label */}
                  <div>
                    <div style={{ fontWeight: 600, fontSize: '13px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{p.name}</div>
                    <div style={{ fontSize: '11px', color: 'var(--muted)', marginTop: '2px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span>{p.internal_job_no || '—'}</span>
                      {hasConflict
                        ? <span style={{ background: '#fdf7f0', color: '#7a4c15', fontSize: '10px', fontWeight: 700, padding: '1px 6px', borderRadius: '4px', border: '1px solid #e8d0aa' }}>⚠ Conflict</span>
                        : projWins.length > 0
                          ? <span style={{ background: '#f4f4f5', color: '#52525b', fontSize: '10px', fontWeight: 600, padding: '1px 6px', borderRadius: '4px', border: '1px solid #e4e4e7' }}>{totalAsgn}/{totalReq} dispatched</span>
                          : <span style={{ background: '#f4f4f5', color: '#94a3b8', fontSize: '10px', fontWeight: 600, padding: '1px 6px', borderRadius: '4px', border: '1px solid #e4e4e7' }}>No windows</span>
                      }
                    </div>
                  </div>

                  {/* Bar area */}
                  <div style={{ position: 'relative', minWidth: '700px', height: '36px' }}>
                    {/* Today line */}
                    <div style={{ position: 'absolute', left: pct(todayStr()) + '%', top: 0, bottom: 0, width: '2px', background: '#111', zIndex: 10, borderRadius: '2px', pointerEvents: 'none' }}>
                      <div style={{ position: 'absolute', top: '-14px', left: '50%', transform: 'translateX(-50%)', fontSize: '9px', fontWeight: 800, color: '#111', whiteSpace: 'nowrap' }}>Today</div>
                    </div>

                    {/* Project background bar */}
                    {p.start_date && (
                      <div style={{
                        position: 'absolute', top: '15px', height: '6px',
                        left: pct(p.start_date) + '%',
                        width: pctW(p.start_date, p.end_date || p.start_date) + '%',
                        background: '#e2e8f0', borderRadius: '3px',
                      }} />
                    )}

                    {/* Crew window sub-bars */}
                    {projWins.map(win => {
                      const stats = windowStats(win.id)
                      const isSelWin = win.id === selectedWindow
                      const barColor = stats.required === 0 ? '#94a3b8' : stats.open === 0 ? '#16a34a' : '#d97706'
                      return (
                        <div
                          key={win.id}
                          title={`${win.description || 'Crew Window'} · ${fmt(win.start_date)} – ${fmt(win.end_date)} · ${stats.assigned}/${stats.required} assigned`}
                          onClick={e => { e.stopPropagation(); setSelectedProject(p.id); openWindow(win.id); setTimeout(() => dispatchRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 50) }}
                          style={{
                            position: 'absolute', top: '11px', height: '14px',
                            left: pct(win.start_date) + '%',
                            width: pctW(win.start_date, win.end_date) + '%',
                            background: barColor, borderRadius: '3px', zIndex: 2, minWidth: '6px', cursor: 'pointer',
                            outline: isSelWin ? '2px solid #111' : 'none',
                            outlineOffset: '1px',
                          }}
                        />
                      )
                    })}
                  </div>
                </div>
              )
            })}

            {/* Holiday rows */}
            {(() => {
              const byWorker = {}
              holidays.forEach(h => {
                const w = workers.find(x => x.id === h.worker_id)
                if (!w) return
                if (!byWorker[h.worker_id]) byWorker[h.worker_id] = { name: w.name, blocks: [] }
                byWorker[h.worker_id].blocks.push(h)
              })
              const entries = Object.values(byWorker)
              if (!entries.length) return null
              return (
                <>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 8px 4px' }}>
                    <div style={{ flexShrink: 0, width: '280px', fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--muted)' }}>Time Off / Holidays</div>
                    <div style={{ flex: 1, height: '1px', background: 'var(--line)', minWidth: '700px' }} />
                  </div>
                  {entries.map(({ name, blocks }) => (
                    <div key={name} style={{ display: 'grid', gridTemplateColumns: '280px 1fr', alignItems: 'center', gap: '14px', padding: '4px 8px' }}>
                      <div style={{ fontSize: '12px', color: 'var(--muted)', fontWeight: 500 }}>{name}</div>
                      <div style={{ position: 'relative', minWidth: '700px', height: '22px' }}>
                        <div style={{ position: 'relative', height: '22px', background: '#f8fafc', borderRadius: '3px', border: '1px solid var(--line)' }}>
                          {blocks.map(b => (
                            <div key={b.id} title={b.description || 'Time off'} style={{
                              position: 'absolute', top: '4px', height: '14px',
                              left: pct(b.start_date) + '%',
                              width: pctW(b.start_date, b.end_date) + '%',
                              background: 'linear-gradient(90deg,#6b7280,#4b5563)', borderRadius: '3px', minWidth: '4px',
                            }} />
                          ))}
                        </div>
                      </div>
                    </div>
                  ))}
                </>
              )
            })()}
          </div>
        </div>
      </section>

      {/* ── Dispatch panel ── */}
      {selectedProject && (
        <section className="panel" ref={dispatchRef}>

          {/* Project header */}
          <div style={{ padding: '12px 18px', borderBottom: '1px solid var(--line)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h2 style={{ fontSize: '15px', fontWeight: 700 }}>{selProj?.name}</h2>
              <p style={{ fontSize: '12px', color: 'var(--muted)', marginTop: '2px' }}>
                {[selProj?.internal_job_no, selProj?.client_name, selProj?.location, `${fmt(selProj?.start_date)} – ${fmt(selProj?.end_date)}`].filter(Boolean).join(' · ')}
              </p>
            </div>
            <button className="small primary" onClick={() => { setSelectedWindow(null); setAddingWindow(true) }}>+ Add Window</button>
          </div>

          {/* Window tabs */}
          {(projWindows.length > 0 || addingWindow) && (
            <div style={{ display: 'flex', borderBottom: '1px solid var(--line)', overflowX: 'auto' }}>
              {projWindows.map((win, idx) => {
                const stats   = windowStats(win.id)
                const isActive = win.id === selectedWindow && !addingWindow
                const dot     = stats.required === 0 ? '#94a3b8' : stats.open === 0 ? '#16a34a' : '#d97706'
                return (
                  <button
                    key={win.id}
                    onClick={() => openWindow(win.id)}
                    style={{
                      background: 'none', border: 'none', padding: '10px 16px', cursor: 'pointer', whiteSpace: 'nowrap',
                      borderBottom: isActive ? '2px solid #111' : '2px solid transparent', borderRadius: 0,
                      fontWeight: isActive ? 700 : 500, fontSize: '13px', color: isActive ? '#111' : 'var(--muted)',
                    }}
                  >
                    <span style={{ display: 'inline-block', width: '8px', height: '8px', borderRadius: '50%', background: dot, marginRight: '6px' }} />
                    {win.description || `Window ${idx + 1}`}
                    <span style={{ fontSize: '11px', color: 'var(--muted)', marginLeft: '6px' }}>{fmt(win.start_date)} – {fmt(win.end_date)}</span>
                  </button>
                )
              })}
              {addingWindow && (
                <button style={{ background: 'none', border: 'none', padding: '10px 16px', fontWeight: 700, fontSize: '13px', color: '#111', borderBottom: '2px solid #111', borderRadius: 0, whiteSpace: 'nowrap' }}>
                  New Window…
                </button>
              )}
            </div>
          )}

          {/* No windows yet */}
          {projWindows.length === 0 && !addingWindow && (
            <div style={{ padding: '32px', textAlign: 'center', color: 'var(--muted)', fontSize: '13px' }}>
              No crew windows yet.
              <button className="small primary" style={{ marginLeft: '10px' }} onClick={() => setAddingWindow(true)}>+ Add Window</button>
            </div>
          )}

          {/* Add window form */}
          {addingWindow && (
            <div style={{ padding: '16px 18px', borderBottom: projWindows.length > 0 ? '1px solid var(--line)' : 'none', background: '#f8fafc' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 160px 160px auto auto', gap: '10px', alignItems: 'end' }}>
                <label style={{ fontSize: '12px', fontWeight: 600 }}>
                  Description (optional)
                  <input value={newWin.description} onChange={e => setNewWin(p => ({ ...p, description: e.target.value }))} placeholder="e.g. Phase 1 – Electrical, Commissioning…" style={{ marginTop: '4px' }} />
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
            </div>
          )}

          {/* Window detail */}
          {selWin && !addingWindow && (
            <div style={{ padding: '16px 18px', display: 'flex', flexDirection: 'column', gap: '18px' }}>

              {/* Edit dates */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 160px 160px auto', gap: '10px', alignItems: 'end' }}>
                <label style={{ fontSize: '12px', fontWeight: 600 }}>
                  Description
                  <input defaultValue={selWin.description || ''} onBlur={e => updateWindow(selWin.id, 'description', e.target.value)} placeholder="e.g. Phase 1" style={{ marginTop: '4px' }} />
                </label>
                <label style={{ fontSize: '12px', fontWeight: 600 }}>
                  Start Date
                  <input type="date" defaultValue={selWin.start_date} onBlur={e => updateWindow(selWin.id, 'start_date', e.target.value)} style={{ marginTop: '4px' }} />
                </label>
                <label style={{ fontSize: '12px', fontWeight: 600 }}>
                  End Date
                  <input type="date" defaultValue={selWin.end_date} onBlur={e => updateWindow(selWin.id, 'end_date', e.target.value)} style={{ marginTop: '4px' }} />
                </label>
                <button className="small" style={{ color: '#111', borderColor: '#e4e4e7', marginBottom: '1px' }} onClick={() => deleteWindow(selWin.id)}>Delete Window</button>
              </div>

              {/* Trade requirements */}
              <div>
                <h4 style={{ fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--muted)', marginBottom: '10px' }}>Manpower Required</h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {TRADE_GROUPS.map(group => (
                    <div key={group.label}>
                      <div style={{ fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#aaa', marginBottom: '6px' }}>{group.label}</div>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                        {group.trades.map(trade => {
                          const req   = winReqs.find(r => r.trade === trade)
                          const count = req?.headcount || 0
                          return (
                            <div key={trade} style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '5px 10px', borderRadius: '4px', border: `1px solid ${count > 0 ? '#111' : 'var(--line)'}`, background: count > 0 ? '#f9f9f9' : '#fafafa' }}>
                              <TradeBadge trade={trade} />
                              <button style={miniBtn} onClick={() => count > 0 && upsertRequirement(selWin.id, trade, count - 1)}>−</button>
                              <span style={{ fontSize: '13px', fontWeight: 700, minWidth: '14px', textAlign: 'center' }}>{count}</span>
                              <button style={miniBtn} onClick={() => upsertRequirement(selWin.id, trade, count + 1)}>+</button>
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Worker assignment */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', borderTop: '1px solid var(--line)', paddingTop: '16px' }}>

                {/* Assigned */}
                <div>
                  <h4 style={{ fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--muted)', marginBottom: '8px' }}>
                    Assigned — {workerGroups.assigned.length}
                  </h4>
                  {workerGroups.assigned.length === 0 && <p style={{ fontSize: '13px', color: 'var(--muted)' }}>None yet — add from the right.</p>}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    {workerGroups.assigned.map(w => {
                      const a     = winAssignments.find(a => a.worker_id === w.id)
                      const certs = w.worker_certifications || []
                      return (
                        <div key={w.id} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '7px 10px', background: w.conflict ? '#fffbeb' : '#f8fafc', border: `1px solid ${w.conflict ? '#fde68a' : 'var(--line)'}`, borderRadius: '6px' }}>
                          <div style={{ flex: 1 }}>
                            <div style={{ fontSize: '13px', fontWeight: 600 }}>{w.name}</div>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginTop: '3px' }}>
                              <TradeBadge trade={a?.trade || workerTrade(w)} />
                              {certs.map(c => <CertBadge key={c.id} cert={c} />)}
                              {w.conflict && <span style={{ fontSize: '11px', color: '#d97706', fontWeight: 700 }}>⚠ {w.conflict}</span>}
                            </div>
                          </div>
                          <button className="small" style={{ color: '#111', borderColor: '#e4e4e7' }} onClick={() => a && removeAssignment(a.id)}>Remove</button>
                        </div>
                      )
                    })}
                  </div>
                </div>

                {/* Available */}
                <div>
                  <h4 style={{ fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--muted)', marginBottom: '8px' }}>
                    Available — {workerGroups.available.length}
                  </h4>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', maxHeight: '340px', overflowY: 'auto' }}>
                    {workerGroups.available.map(w => {
                      const certs = w.worker_certifications || []
                      return (
                        <div key={w.id} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '7px 10px', background: '#f8fafc', border: '1px solid var(--line)', borderRadius: '6px' }}>
                          <div style={{ flex: 1 }}>
                            <div style={{ fontSize: '13px', fontWeight: 600 }}>{w.name}</div>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginTop: '3px' }}>
                              <TradeBadge trade={workerTrade(w)} />
                              {certs.map(c => <CertBadge key={c.id} cert={c} />)}
                            </div>
                          </div>
                          <button className="small primary" onClick={() => addAssignment(selWin.id, w.id, workerTrade(w))}>+ Add</button>
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
                                  <TradeBadge trade={workerTrade(w)} />
                                  {certs.map(c => <CertBadge key={c.id} cert={c} />)}
                                  <span style={{ fontSize: '11px', color: '#d97706', fontWeight: 700 }}>⚠ {w.conflict}</span>
                                </div>
                              </div>
                              <button className="small" onClick={() => addAssignment(selWin.id, w.id, workerTrade(w))} title="Add anyway">Add anyway</button>
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
      )}

      {/* ── Empty state ── */}
      {projects.length === 0 && (
        <section className="panel" style={{ padding: '40px', textAlign: 'center' }}>
          <p style={{ color: 'var(--muted)', fontSize: '14px' }}>No active projects with scheduled dates yet.</p>
        </section>
      )}
    </div>
  )
}
