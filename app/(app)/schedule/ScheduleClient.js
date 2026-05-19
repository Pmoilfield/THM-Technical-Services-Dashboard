'use client'
import { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'


// ── Helpers ───────────────────────────────────────────────────────────────────
const ms   = d => d ? new Date(d).getTime() : 0
const fmt  = d => d ? new Date(d + 'T00:00:00').toLocaleDateString('en-CA', { month: 'short', day: 'numeric' }) : '—'
const todayStr = () => new Date().toISOString().split('T')[0]

function overlaps(aS, aE, bS, bE) {
  if (!aS || !aE || !bS || !bE) return false
  return !(new Date(aE) < new Date(bS) || new Date(bE) < new Date(aS))
}


// ── Component ─────────────────────────────────────────────────────────────────
export default function ScheduleClient({ projects, workers, windows, requirements, windowAssignments, holidays, rates }) {
  const router = useRouter()

  const [search,   setSearch]   = useState('')
  const [viewMode, setViewMode] = useState('month')


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
    if (viewMode === '2week') {
      const now = new Date(); now.setHours(0,0,0,0)
      const sunday = new Date(now.getTime() - now.getDay() * 86400000)
      const end2w  = new Date(sunday.getTime() + 13 * 86400000)
      const start  = sunday.toISOString().split('T')[0]
      const end    = end2w.toISOString().split('T')[0]
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
  // In week view add 1 day to end so bars fill the full day column
  const snapEnd = e => {
    if (!e || (viewMode !== 'week' && viewMode !== '2week')) return e
    const d = new Date(e + 'T00:00:00'); d.setDate(d.getDate() + 1)
    return d.toISOString().split('T')[0]
  }
  const pctW = (s, e) => s && e ? Math.max(0.5, ((ms(snapEnd(e)) - ms(s)) / spanMs) * 100) : 0.5

  const timeMarks = useMemo(() => {
    const marks = []
    if (viewMode === 'week' || viewMode === '2week') {
      // one tick per day
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

  // ── Conflict detection ────────────────────────────────────────────────────
  function workerConflict(workerId, windowId) {
    const win = windows.find(w => w.id === windowId)
    if (!win) return false
    for (const a of windowAssignments.filter(a => a.worker_id === workerId && a.window_id !== windowId)) {
      const ow = windows.find(w => w.id === a.window_id)
      if (ow && overlaps(win.start_date, win.end_date, ow.start_date, ow.end_date)) return true
    }
    for (const h of holidays.filter(h => h.worker_id === workerId)) {
      if (overlaps(win.start_date, win.end_date, h.start_date, h.end_date)) return true
    }
    return false
  }

  // ── Stats ──────────────────────────────────────────────────────────────────
  function windowStats(windowId) {
    const reqs     = requirements.filter(r => r.window_id === windowId)
    const asgns    = windowAssignments.filter(a => a.window_id === windowId)
    const required = reqs.reduce((s, r) => s + r.headcount, 0)
    return { required, assigned: asgns.length, open: Math.max(required - asgns.length, 0) }
  }

  const summaryStats = useMemo(() => {
    const t       = todayStr()
    const weekEnd = new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0]
    let thisWeek  = 0
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
          { label: 'Active Projects',    value: summaryStats.active },
          { label: 'Active This Week',   value: summaryStats.thisWeek },
          { label: 'Workers Dispatched', value: summaryStats.dispatched, color: '#16a34a' },
          { label: 'Conflict Windows',   value: summaryStats.conflictWindows, color: summaryStats.conflictWindows > 0 ? '#d97706' : '#16a34a' },
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
              {[['week','Week'],['2week','2 Week'],['month','Month'],['quarter','Quarter']].map(([v, label]) => (
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

            {filteredProjects.map((p, rowIdx) => {
              const projWins   = windows.filter(w => w.project_id === p.id)
              const hasConflict = projWins.some(w =>
                windowAssignments.filter(a => a.window_id === w.id).some(a => workerConflict(a.worker_id, w.id))
              )
              const totalReq  = projWins.reduce((s, w) => s + requirements.filter(r => r.window_id === w.id).reduce((ss, r) => ss + r.headcount, 0), 0)
              const totalAsgn = windowAssignments.filter(a => projWins.some(w => w.id === a.window_id)).length

              return (
                <div
                  key={p.id}
                  onClick={() => router.push(`/schedule/${p.id}`)}
                  style={{
                    display: 'grid', gridTemplateColumns: '280px 1fr', alignItems: 'center',
                    gap: '14px', padding: '6px 8px', borderRadius: '8px', cursor: 'pointer',
                    background: 'transparent',
                    border: '1px solid transparent',
                    transition: 'background 0.1s',
                  }}
                  onMouseEnter={e => e.currentTarget.style.background = '#f4f4f5'}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
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
                      {rowIdx === 0 && <div style={{ position: 'absolute', top: '-14px', left: '50%', transform: 'translateX(-50%)', fontSize: '9px', fontWeight: 800, color: '#111', whiteSpace: 'nowrap' }}>Today</div>}
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
                      const barColor = stats.required === 0 ? '#94a3b8' : stats.open === 0 ? '#16a34a' : '#d97706'
                      return (
                        <div
                          key={win.id}
                          title={`${win.description || 'Crew Window'} · ${fmt(win.start_date)} – ${fmt(win.end_date)} · ${stats.assigned}/${stats.required} assigned`}
                          onClick={e => { e.stopPropagation(); router.push(`/schedule/${p.id}`) }}
                          style={{
                            position: 'absolute', top: '11px', height: '14px',
                            left: pct(win.start_date) + '%',
                            width: pctW(win.start_date, win.end_date) + '%',
                            background: barColor, borderRadius: '3px', zIndex: 2, minWidth: '6px', cursor: 'pointer',
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

      {/* ── Empty state ── */}
      {projects.length === 0 && (
        <section className="panel" style={{ padding: '40px', textAlign: 'center' }}>
          <p style={{ color: 'var(--muted)', fontSize: '14px' }}>No active projects with scheduled dates yet.</p>
        </section>
      )}
    </div>
  )
}
