import { redirect } from 'next/navigation'
import { createServerSupabase } from '@/lib/supabase-server'

export const dynamic = 'force-dynamic'

const fmtDate = d => d
  ? new Date(d + 'T00:00:00').toLocaleDateString('en-CA', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })
  : '—'

const fmtShort = d => d
  ? new Date(d + 'T00:00:00').toLocaleDateString('en-CA', { month: 'short', day: 'numeric' })
  : '—'

export default async function MySchedulePage() {
  const supabase = await createServerSupabase()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Find the worker record linked to this auth user
  const { data: worker } = await supabase
    .from('workers')
    .select('id, name, default_rate_id')
    .eq('auth_user_id', user.id)
    .single()

  if (!worker) {
    return (
      <div className="grid">
        <div className="page-header">
          <h1>My Schedule</h1>
        </div>
        <section className="panel" style={{ textAlign: 'center', padding: '48px 24px' }}>
          <div style={{ fontSize: '32px', marginBottom: '12px' }}>🔗</div>
          <p style={{ fontWeight: 700, marginBottom: '8px' }}>No worker record linked</p>
          <p className="muted" style={{ maxWidth: '360px', margin: '0 auto' }}>
            Your account hasn't been linked to a worker record yet. Please ask your administrator to link your account on the Users page.
          </p>
        </section>
      </div>
    )
  }

  // Get all assignments for this worker
  const { data: assignments } = await supabase
    .from('crew_window_assignments')
    .select('*, project_crew_windows(*, projects(id, name, internal_job_no, location, client_name))')
    .eq('worker_id', worker.id)
    .order('created_at')

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  // Build enriched list sorted by start date
  const rows = (assignments || [])
    .map(a => {
      const win = a.project_crew_windows
      const project = win?.projects
      const start = a.onsite_start || win?.start_date
      const end   = a.onsite_end   || win?.end_date
      const startDate = start ? new Date(start + 'T00:00:00') : null
      const endDate   = end   ? new Date(end   + 'T00:00:00') : null
      const days = startDate && endDate
        ? Math.round((endDate - startDate) / 86400000) + 1
        : null
      const status = !startDate ? 'unknown'
        : endDate && endDate < today ? 'past'
        : startDate <= today && (!endDate || endDate >= today) ? 'active'
        : 'upcoming'
      return { a, win, project, start, end, startDate, endDate, days, status }
    })
    .sort((x, y) => {
      const order = { active: 0, upcoming: 1, past: 2, unknown: 3 }
      if (order[x.status] !== order[y.status]) return order[x.status] - order[y.status]
      return (x.start || '') > (y.start || '') ? 1 : -1
    })

  const active   = rows.filter(r => r.status === 'active')
  const upcoming = rows.filter(r => r.status === 'upcoming')
  const past     = rows.filter(r => r.status === 'past')

  const StatusPill = ({ status }) => {
    const map = {
      active:   { label: 'On Site',  bg: '#dcfce7', color: '#15803d' },
      upcoming: { label: 'Upcoming', bg: '#dbeafe', color: '#1d4ed8' },
      past:     { label: 'Complete', bg: '#f3f4f6', color: '#6b7280' },
      unknown:  { label: 'TBD',      bg: '#fef3c7', color: '#92400e' },
    }
    const s = map[status] || map.unknown
    return (
      <span style={{ display: 'inline-block', padding: '2px 8px', borderRadius: '99px', fontSize: '11px', fontWeight: 700, background: s.bg, color: s.color }}>
        {s.label}
      </span>
    )
  }

  function WindowCard({ r }) {
    const borderColor = r.status === 'active' ? '#22c55e' : r.status === 'upcoming' ? '#60a5fa' : '#e5e7eb'
    return (
      <div style={{ border: `1.5px solid ${borderColor}`, borderRadius: '8px', padding: '16px 18px', background: '#fff', display: 'grid', gridTemplateColumns: '1fr auto', gap: '8px 16px', alignItems: 'start' }}>
        <div>
          <div style={{ fontWeight: 700, fontSize: '15px', marginBottom: '2px' }}>
            {r.project?.name || '—'}
          </div>
          {r.project?.internal_job_no && (
            <div style={{ fontSize: '12px', color: 'var(--muted)', marginBottom: '4px' }}>Job #{r.project.internal_job_no}</div>
          )}
          <div style={{ fontSize: '13px', fontWeight: 600, color: '#374151', marginBottom: '4px' }}>
            {r.win?.description || 'Crew Window'}
          </div>
          {r.project?.location && (
            <div style={{ fontSize: '12px', color: 'var(--muted)' }}>📍 {r.project.location}</div>
          )}
          {r.project?.client_name && (
            <div style={{ fontSize: '12px', color: 'var(--muted)' }}>🏢 {r.project.client_name}</div>
          )}
        </div>
        <div style={{ textAlign: 'right' }}>
          <StatusPill status={r.status} />
          <div style={{ marginTop: '8px', fontSize: '12px', color: '#374151', fontWeight: 600, whiteSpace: 'nowrap' }}>
            {fmtShort(r.start)} → {fmtShort(r.end)}
          </div>
          {r.days && (
            <div style={{ fontSize: '11px', color: 'var(--muted)', marginTop: '2px' }}>
              {r.days} day{r.days !== 1 ? 's' : ''}
            </div>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="grid" style={{ maxWidth: '720px' }}>
      <div className="page-header">
        <div>
          <h1>My Schedule</h1>
          <p className="muted">Welcome, {worker.name}</p>
        </div>
      </div>

      {rows.length === 0 ? (
        <section className="panel" style={{ textAlign: 'center', padding: '48px 24px' }}>
          <div style={{ fontSize: '32px', marginBottom: '12px' }}>📅</div>
          <p style={{ fontWeight: 700, marginBottom: '8px' }}>No assignments yet</p>
          <p className="muted">Check back once your dispatcher has assigned you to a project window.</p>
        </section>
      ) : (
        <>
          {active.length > 0 && (
            <section className="panel">
              <h2 style={{ marginBottom: '12px' }}>Currently On Site</h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {active.map(r => <WindowCard key={r.a.id} r={r} />)}
              </div>
            </section>
          )}

          {upcoming.length > 0 && (
            <section className="panel">
              <h2 style={{ marginBottom: '12px' }}>Upcoming</h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {upcoming.map(r => <WindowCard key={r.a.id} r={r} />)}
              </div>
            </section>
          )}

          {past.length > 0 && (
            <section className="panel">
              <h2 style={{ marginBottom: '12px', color: 'var(--muted)' }}>Past</h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {past.map(r => <WindowCard key={r.a.id} r={r} />)}
              </div>
            </section>
          )}
        </>
      )}
    </div>
  )
}
