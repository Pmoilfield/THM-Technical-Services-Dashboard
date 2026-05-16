'use client'
import { useState, useMemo, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createBrowserSupabase } from '@/lib/supabase'

// ── Helpers ───────────────────────────────────────────────────────────────────
const ms   = d => d ? new Date(d).getTime() : 0
const fmt  = d => d ? new Date(d + 'T00:00:00').toLocaleDateString('en-CA', { month: 'short', day: 'numeric' }) : '—'
const fmtL = d => d ? new Date(d + 'T00:00:00').toLocaleDateString('en-CA', { year: 'numeric', month: 'short', day: 'numeric' }) : '—'

function overlaps(aS, aE, bS, bE) {
  if (!aS || !aE || !bS || !bE) return false
  return !(new Date(aE) < new Date(bS) || new Date(bE) < new Date(aS))
}

function today() { return new Date().toISOString().split('T')[0] }

// Trade colour mapping
const TRADE_COLORS = {
  'Electrical':           { bg: '#dbeafe', color: '#1e40af' },
  'Instrumentation':      { bg: '#f3e8ff', color: '#6d28d9' },
  'Pipefitter':           { bg: '#dcfce7', color: '#166534' },
  'Mechanical':           { bg: '#dcfce7', color: '#166534' },
  'Construction Management': { bg: '#fef3c7', color: '#92400e' },
  'Project Management':   { bg: '#fef3c7', color: '#92400e' },
  'Labourer':             { bg: '#f3f4f6', color: '#374151' },
  'Welder':               { bg: '#f4f4f5', color: '#374151' },
}
function tradeBadge(trade) {
  const c = TRADE_COLORS[trade] || { bg: '#f3f4f6', color: '#374151' }
  return (
    <span style={{ display: 'inline-block', padding: '1px 7px', borderRadius: '99px', fontSize: '11px', fontWeight: 700, background: c.bg, color: c.color }}>
      {trade || 'Unassigned'}
    </span>
  )
}

export default function ScheduleClient({ projects, workers, assignments: initialAssignments, holidays, rates }) {
  const router = useRouter()
  const supabase = createBrowserSupabase()

  const [assignments, setAssignments] = useState(initialAssignments)
  const [selectedProject, setSelectedProject] = useState(null)
  const [search, setSearch] = useState('')
  const dispatchRef = useRef(null)

  // Worker trade lookup via rates
  const rateMap = useMemo(() => Object.fromEntries(rates.map(r => [r.id, r.category])), [rates])
  const workerTrade = useCallback(w => rateMap[w.default_rate_id] || null, [rateMap])

  // ── Date span for Gantt ───────────────────────────────────────────────────
  const { spanStart, spanEnd, spanMs } = useMemo(() => {
    const validProjects = projects.filter(p => p.start_date)
    if (!validProjects.length) return { spanStart: today(), spanEnd: today(), spanMs: 1 }
    const starts = validProjects.map(p => ms(p.start_date))
    const ends   = validProjects.map(p => ms(p.end_date || p.start_date))
    const s = Math.min(...starts)
    const e = Math.max(...ends)
    // Pad 2 weeks each side
    return { spanStart: new Date(s - 14*86400000).toISOString().split('T')[0], spanEnd: new Date(e + 14*86400000).toISOString().split('T')[0], spanMs: (e + 14*86400000) - (s - 14*86400000) }
  }, [projects])

  const pct  = d  => d ? Math.max(0, ((ms(d) - ms(spanStart)) / spanMs) * 100) : 0
  const pctW = (s, e) => s && e ? Math.max(1, ((ms(e) - ms(s)) / spanMs) * 100) : 1

  // ── Month axis labels ─────────────────────────────────────────────────────
  const monthMarks = useMemo(() => {
    const marks = []
    let d = new Date(new Date(spanStart).getFullYear(), new Date(spanStart).getMonth(), 1)
    const end = new Date(spanEnd)
    while (d <= end) {
      const p = ((d.getTime() - ms(spanStart)) / spanMs) * 100
      if (p >= 0 && p <= 100) marks.push({ label: d.toLocaleDateString('en-CA', { month: 'short', year: '2-digit' }), pct: p })
      d = new Date(d.getFullYear(), d.getMonth() + 1, 1)
    }
    return marks
  }, [spanStart, spanEnd, spanMs])

  // ── Derived stats ─────────────────────────────────────────────────────────
  const assignedWorkerIds = useCallback((projId) =>
    assignments.filter(a => a.project_id === projId).map(a => a.worker_id)
  , [assignments])

  const workerConflicts = useCallback((workerId, projId) => {
    const proj = projects.find(p => p.id === projId)
    if (!proj) return false
    // Check other project assignments
    const otherAssigned = assignments.filter(a => a.worker_id === workerId && a.project_id !== projId)
    for (const a of otherAssigned) {
      const other = projects.find(p => p.id === a.project_id)
      if (other && overlaps(proj.start_date, proj.end_date, other.start_date, other.end_date)) return 'project'
    }
    // Check holidays
    const workerHols = holidays.filter(h => h.worker_id === workerId)
    for (const h of workerHols) {
      if (overlaps(proj.start_date, proj.end_date, h.start_date, h.end_date)) return 'holiday'
    }
    return false
  }, [assignments, holidays, projects])

  const summaryStats = useMemo(() => {
    const todayStr = today()
    const weekEnd  = new Date(Date.now() + 7*86400000).toISOString().split('T')[0]
    let active = 0, thisWeek = 0, assigned = 0, conflicts = 0
    projects.forEach(p => {
      if (!p.start_date) return
      active++
      if (overlaps(p.start_date, p.end_date || p.start_date, todayStr, weekEnd)) thisWeek++
      const ids = assignedWorkerIds(p.id)
      assigned += ids.length
      if (ids.some(id => workerConflicts(id, p.id))) conflicts++
    })
    return { active, thisWeek, assigned, conflicts }
  }, [projects, assignments, holidays])

  // ── Filtered project list ─────────────────────────────────────────────────
  const filteredProjects = useMemo(() => {
    const q = search.toLowerCase()
    return projects.filter(p => {
      if (!q) return true
      return [p.name, p.client_name, p.internal_job_no, p.location, p.project_manager].join(' ').toLowerCase().includes(q)
    })
  }, [projects, search])

  // ── Assignment actions ────────────────────────────────────────────────────
  async function addAssignment(projectId, workerId, trade) {
    const { data, error } = await supabase
      .from('project_assignments')
      .insert({ project_id: projectId, worker_id: workerId, trade })
      .select()
      .single()
    if (!error && data) setAssignments(prev => [...prev, data])
  }

  async function removeAssignment(assignmentId) {
    await supabase.from('project_assignments').delete().eq('id', assignmentId)
    setAssignments(prev => prev.filter(a => a.id !== assignmentId))
  }

  // ── Dispatch view for selected project ────────────────────────────────────
  const selProj = projects.find(p => p.id === selectedProject)
  const selAssignments = assignments.filter(a => a.project_id === selectedProject)
  const assignedIds = selAssignments.map(a => a.worker_id)

  // Workers grouped: assigned first, then available, then conflicted
  const workerGroups = useMemo(() => {
    if (!selProj) return { assigned: [], available: [], unavailable: [] }
    const assigned = [], available = [], unavailable = []
    workers.forEach(w => {
      const conflict = workerConflicts(w.id, selProj.id)
      const isAssigned = assignedIds.includes(w.id)
      if (isAssigned) assigned.push({ ...w, conflict })
      else if (conflict) unavailable.push({ ...w, conflict })
      else available.push(w)
    })
    return { assigned, available, unavailable }
  }, [selProj, workers, assignedIds, workerConflicts])

  // ── Styles ────────────────────────────────────────────────────────────────
  const thStyle = { fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--muted)', fontWeight: 700, padding: '7px 10px', borderBottom: '2px solid var(--line)', textAlign: 'left', background: '#f8fafc', whiteSpace: 'nowrap' }
  const tdStyle = { padding: '8px 10px', borderBottom: '1px solid var(--line)', fontSize: '13px', verticalAlign: 'middle' }

  return (
    <div className="grid">

      {/* ── Header ── */}
      <div className="page-header">
        <div className="split">
          <div>
            <h1>Schedule</h1>
            <p className="muted">Manpower loading · Outage planning · Dispatch</p>
          </div>
        </div>
      </div>

      {/* ── Summary strip ── */}
      <div style={{ display: 'flex', gap: '0', background: '#fff', border: '1px solid var(--line)', borderRadius: '12px', overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
        {[
          { label: 'Active Projects',  value: summaryStats.active,   color: 'var(--text)' },
          { label: 'Active This Week', value: summaryStats.thisWeek, color: 'var(--text)' },
          { label: 'Workers Assigned', value: summaryStats.assigned, color: '#16a34a' },
          { label: 'Conflicts',        value: summaryStats.conflicts, color: summaryStats.conflicts > 0 ? '#111' : '#16a34a' },
        ].map((s, i) => (
          <div key={s.label} style={{ flex: 1, padding: '12px 20px', borderLeft: i > 0 ? '1px solid var(--line)' : 'none' }}>
            <div style={{ fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--muted)' }}>{s.label}</div>
            <div style={{ fontSize: '24px', fontWeight: 800, marginTop: '2px', color: s.color }}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* ── Search ── */}
      <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search project, job #, client, location…"
          style={{ maxWidth: '360px' }}
        />
        {search && <button className="small" onClick={() => setSearch('')}>Clear</button>}
        <span className="muted" style={{ fontSize: '12px', marginLeft: 'auto' }}>
          {filteredProjects.length} of {projects.length} projects · Click a row to dispatch
        </span>
      </div>

      {/* ── Gantt panel ── */}
      <section className="panel" style={{ overflow: 'hidden' }}>
        <div style={{ padding: '11px 16px', borderBottom: '1px solid var(--line)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2 style={{ fontSize: '14px', fontWeight: 700 }}>Manpower Loading</h2>
          {selectedProject && (
            <button className="small" onClick={() => setSelectedProject(null)}>Clear selection</button>
          )}
        </div>

        <div style={{ overflowX: 'auto' }}>
          {/* Month axis */}
          <div style={{ display: 'grid', gridTemplateColumns: '280px 1fr', padding: '0 14px', borderBottom: '1px solid var(--line)', background: '#f8fafc', minHeight: '26px' }}>
            <div style={{ fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--muted)', display: 'flex', alignItems: 'center' }}>Project</div>
            <div style={{ position: 'relative', minWidth: '700px', height: '26px' }}>
              {monthMarks.map(m => (
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
              const ids = assignedWorkerIds(p.id)
              const hasConflict = ids.some(id => workerConflicts(id, p.id))
              const isSelected = p.id === selectedProject
              const barColor = hasConflict ? 'linear-gradient(90deg,#d97706,#b45309)' : ids.length > 0 ? 'linear-gradient(90deg,#16a34a,#15803d)' : 'linear-gradient(90deg,#2563eb,#1d4ed8)'

              return (
                <div
                  key={p.id}
                  onClick={() => {
                    const next = isSelected ? null : p.id
                    setSelectedProject(next)
                    if (next) setTimeout(() => dispatchRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 50)
                  }}
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
                        : ids.length > 0
                          ? <span style={{ background: '#f3f6f4', color: '#2d5a3d', fontSize: '10px', fontWeight: 700, padding: '1px 6px', borderRadius: '4px', border: '1px solid #ccddd3' }}>{ids.length} assigned</span>
                          : <span style={{ background: '#f4f4f5', color: '#52525b', fontSize: '10px', fontWeight: 600, padding: '1px 6px', borderRadius: '4px', border: '1px solid #e4e4e7' }}>Unassigned</span>}
                    </div>
                  </div>

                  {/* Bar */}
                  <div style={{ position: 'relative', minWidth: '700px' }}>
                    {/* Today line */}
                    <div style={{ position: 'absolute', left: pct(today()) + '%', top: '-3px', bottom: '-3px', width: '2px', background: '#111', zIndex: 10, borderRadius: '2px', pointerEvents: 'none' }}>
                      <div style={{ position: 'absolute', top: '-14px', left: '50%', transform: 'translateX(-50%)', fontSize: '9px', fontWeight: 800, color: '#111', whiteSpace: 'nowrap' }}>Today</div>
                    </div>
                    <div style={{ position: 'relative', height: '22px', background: '#f1f5f9', borderRadius: '3px', border: '1px solid var(--line)', overflow: 'visible' }}>
                      {p.start_date && (
                        <div style={{
                          position: 'absolute', top: '3px', height: '14px',
                          left: pct(p.start_date) + '%',
                          width: pctW(p.start_date, p.end_date || p.start_date) + '%',
                          background: barColor, borderRadius: '3px', zIndex: 1, minWidth: '4px',
                        }} title={`${fmt(p.start_date)} – ${fmt(p.end_date)}`} />
                      )}
                    </div>
                  </div>
                </div>
              )
            })}

            {/* ── Holiday rows ── */}
            {holidays.length > 0 && (() => {
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
                      <div style={{ position: 'relative', minWidth: '700px' }}>
                        <div style={{ position: 'relative', height: '22px', background: '#f8fafc', borderRadius: '3px', border: '1px solid var(--line)' }}>
                          {blocks.map(b => (
                            <div key={b.id} title={b.description || 'Time off'} style={{
                              position: 'absolute', top: '3px', height: '14px',
                              left: pct(b.start_date) + '%',
                              width: pctW(b.start_date, b.end_date) + '%',
                              background: 'linear-gradient(90deg,#6b7280,#4b5563)',
                              borderRadius: '3px', zIndex: 1, minWidth: '4px',
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
      {selProj && (
        <section className="panel" ref={dispatchRef}>
          <div style={{ padding: '12px 18px', borderBottom: '1px solid var(--line)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h2 style={{ fontSize: '15px', fontWeight: 700 }}>{selProj.name}</h2>
              <p style={{ fontSize: '12px', color: 'var(--muted)', marginTop: '2px' }}>
                {selProj.internal_job_no} · {selProj.client_name} · {selProj.location} · {fmt(selProj.start_date)} – {fmt(selProj.end_date)}
              </p>
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <Link href={`/projects/${selProj.id}`}>
                <button className="small">Open Project →</button>
              </Link>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0', minHeight: '200px' }}>

            {/* Assigned workers */}
            <div style={{ borderRight: '1px solid var(--line)', padding: '14px 16px' }}>
              <h3 style={{ fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--muted)', marginBottom: '10px' }}>
                Assigned — {selAssignments.length} worker{selAssignments.length !== 1 ? 's' : ''}
              </h3>
              {selAssignments.length === 0 && (
                <p style={{ fontSize: '13px', color: 'var(--muted)' }}>No workers assigned yet. Add from the right.</p>
              )}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                {selAssignments.map(a => {
                  const w = workers.find(x => x.id === a.worker_id)
                  if (!w) return null
                  const conflict = workerConflicts(w.id, selProj.id)
                  return (
                    <div key={a.id} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '7px 10px', background: conflict ? '#fffbeb' : '#f8fafc', border: `1px solid ${conflict ? '#fde68a' : 'var(--line)'}`, borderRadius: '4px' }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: '13px', fontWeight: 600 }}>{w.name}</div>
                        <div style={{ fontSize: '11px', color: 'var(--muted)', marginTop: '1px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                          {tradeBadge(a.trade || workerTrade(w))}
                          {conflict === 'project' && <span style={{ color: '#d97706', fontWeight: 700 }}>⚠ Double-booked</span>}
                          {conflict === 'holiday' && <span style={{ color: '#d97706', fontWeight: 700 }}>⚠ On holiday</span>}
                        </div>
                      </div>
                      <button
                        className="small"
                        onClick={() => removeAssignment(a.id)}
                        style={{ color: '#111', borderColor: '#e4e4e7' }}
                      >Remove</button>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Available workers */}
            <div style={{ padding: '14px 16px' }}>
              <h3 style={{ fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--muted)', marginBottom: '10px' }}>
                Available — {workerGroups.available.length} workers
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', maxHeight: '320px', overflowY: 'auto' }}>
                {workerGroups.available.map(w => {
                  const trade = workerTrade(w)
                  return (
                    <div key={w.id} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '7px 10px', background: '#f8fafc', border: '1px solid var(--line)', borderRadius: '4px' }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: '13px', fontWeight: 600 }}>{w.name}</div>
                        <div style={{ fontSize: '11px', marginTop: '1px' }}>{tradeBadge(trade)}</div>
                      </div>
                      <button
                        className="small primary"
                        onClick={() => addAssignment(selProj.id, w.id, trade)}
                      >+ Add</button>
                    </div>
                  )
                })}

                {/* Unavailable / conflicted */}
                {workerGroups.unavailable.length > 0 && (
                  <>
                    <div style={{ fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--muted)', padding: '8px 0 4px', borderTop: '1px solid var(--line)', marginTop: '4px' }}>
                      Unavailable — {workerGroups.unavailable.length}
                    </div>
                    {workerGroups.unavailable.map(w => (
                      <div key={w.id} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '7px 10px', background: '#fafafa', border: '1px solid var(--line)', borderRadius: '8px', opacity: 0.6 }}>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: '13px', fontWeight: 600 }}>{w.name}</div>
                          <div style={{ fontSize: '11px', color: '#d97706', fontWeight: 600, marginTop: '1px' }}>
                            {w.conflict === 'holiday' ? '⚠ On holiday' : '⚠ On another project'}
                          </div>
                        </div>
                        <button
                          className="small"
                          onClick={() => addAssignment(selProj.id, w.id, workerTrade(w))}
                          style={{ opacity: 0.6, fontSize: '11px' }}
                          title="Add anyway (will flag conflict)"
                        >Add anyway</button>
                      </div>
                    ))}
                  </>
                )}
              </div>
            </div>

          </div>
        </section>
      )}

      {/* ── Empty state ── */}
      {projects.length === 0 && (
        <section className="panel" style={{ padding: '40px', textAlign: 'center' }}>
          <p style={{ color: 'var(--muted)', fontSize: '14px' }}>No active projects with scheduled dates yet.</p>
          <p style={{ color: 'var(--muted)', fontSize: '13px', marginTop: '8px' }}>
            Set start and end dates on a <Link href="/projects" style={{ color: '#111' }}>project</Link> to see it here.
          </p>
        </section>
      )}

    </div>
  )
}
