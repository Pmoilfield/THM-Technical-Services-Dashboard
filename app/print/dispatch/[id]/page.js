import { createAdminSupabase } from '@/lib/supabase-server'
import { notFound } from 'next/navigation'
import PrintButtons from './PrintButtons'

export const dynamic = 'force-dynamic'
export const revalidate = 0

const fmtShort = d => d ? new Date(d + 'T00:00:00').toLocaleDateString('en-CA', { year: 'numeric', month: 'short', day: 'numeric' }) : '—'

export default async function PrintDispatchPage({ params }) {
  const { id } = await params
  const supabase = createAdminSupabase()

  const { data: windowIds } = await supabase.from('project_crew_windows').select('id').eq('project_id', id)
  const ids = (windowIds || []).map(w => w.id)

  const [
    { data: project },
    { data: windows },
    { data: assignments },
    { data: workers },
    { data: rates },
  ] = await Promise.all([
    supabase.from('projects').select('*').eq('id', id).single(),
    supabase.from('project_crew_windows').select('*').eq('project_id', id).order('start_date'),
    ids.length ? supabase.from('crew_window_assignments').select('*').in('window_id', ids) : { data: [] },
    supabase.from('workers').select('id, name, default_rate_id').eq('active', true),
    supabase.from('rates').select('id, category, personnel'),
  ])

  if (!project) notFound()

  const rateMap = Object.fromEntries((rates || []).map(r => [r.id, r.personnel ? `${r.category} - ${r.personnel}` : r.category]))

  const byWorker = {}
  for (const a of (assignments || [])) {
    const worker = (workers || []).find(w => w.id === a.worker_id)
    if (!worker) continue
    if (!byWorker[a.worker_id]) byWorker[a.worker_id] = { worker, trade: rateMap[worker.default_rate_id] || a.trade || '—', wins: [] }
    const win = (windows || []).find(w => w.id === a.window_id)
    if (win) byWorker[a.worker_id].wins.push({ win, a })
  }

  const dispatches = Object.values(byWorker).sort((x, y) => x.worker.name.localeCompare(y.worker.name))
  const printedOn  = new Date().toLocaleDateString('en-CA', { year: 'numeric', month: 'long', day: 'numeric' })

  const s = { fontFamily: 'Arial, sans-serif', color: '#111', fontSize: '13px' }
  const th = { padding: '7px 10px', fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', background: '#111', color: '#fff', textAlign: 'left', WebkitPrintColorAdjust: 'exact', printColorAdjust: 'exact' }
  const td = { padding: '9px 10px', borderBottom: '1px solid #e5e5e5', fontSize: '12px', verticalAlign: 'top' }

  return (
    <div style={s}>
      <style>{`
        @media print {
          .no-print { display: none !important; }
          @page { margin: 12mm; }
        }
        body { background: #e5e7eb; }
        @media print { body { background: #fff; } }
      `}</style>

      <PrintButtons />

      {dispatches.length === 0 && (
        <div style={{ width: '210mm', margin: '40px auto', padding: '40px', background: '#fff', textAlign: 'center', color: '#888', fontSize: '16px' }}>
          No workers dispatched to this project yet.
        </div>
      )}

      {dispatches.map(({ worker, trade, wins }) => (
        <div key={worker.id} style={{ width: '210mm', minHeight: '270mm', margin: '20px auto', padding: '18mm 18mm 14mm', background: '#fff', boxShadow: '0 2px 12px rgba(0,0,0,0.12)', pageBreakAfter: 'always' }}>

          {/* Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '18px', paddingBottom: '14px', borderBottom: '2px solid #111' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/logo.png" alt="THM Technical Services" style={{ height: '52px', width: 'auto', objectFit: 'contain' }} />
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '15px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Dispatch</div>
              <div style={{ fontSize: '11px', color: '#555', marginTop: '2px' }}>Issued: {printedOn}</div>
            </div>
          </div>

          {/* Project info */}
          <div style={{ background: '#f8f8f8', border: '1px solid #ddd', borderRadius: '6px', padding: '12px 16px', marginBottom: '20px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px 20px' }}>
            {[['Project', project.name], ['Job #', project.internal_job_no || '—'], ['Client', project.client_name || '—'], ['Location', project.location || '—']].map(([label, val]) => (
              <div key={label}>
                <div style={{ fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#666' }}>{label}</div>
                <div style={{ fontSize: '13px', fontWeight: 600, marginTop: '1px' }}>{val}</div>
              </div>
            ))}
          </div>

          {/* Worker */}
          <div style={{ fontSize: '20px', fontWeight: 800, marginBottom: '2px' }}>{worker.name}</div>
          <div style={{ fontSize: '12px', color: '#444', marginBottom: '16px' }}>{trade}</div>

          {/* Windows table */}
          <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '24px' }}>
            <thead>
              <tr>
                <th style={th}>Phase / Window</th>
                <th style={th}>Onsite Start</th>
                <th style={th}>Onsite End</th>
                <th style={th}>Duration</th>
              </tr>
            </thead>
            <tbody>
              {wins
                .sort((x, y) => (x.a.onsite_start || '') > (y.a.onsite_start || '') ? 1 : -1)
                .map(({ win, a }, i) => {
                  const start = a.onsite_start || win.start_date
                  const end   = a.onsite_end   || win.end_date
                  const days  = start && end ? Math.round((new Date(end) - new Date(start)) / 86400000) + 1 : null
                  return (
                    <tr key={win.id}>
                      <td style={{ ...td, fontWeight: 600, background: i % 2 === 1 ? '#fafafa' : '#fff' }}>{win.description || 'Crew Window'}</td>
                      <td style={{ ...td, background: i % 2 === 1 ? '#fafafa' : '#fff' }}>{fmtShort(start)}</td>
                      <td style={{ ...td, background: i % 2 === 1 ? '#fafafa' : '#fff' }}>{fmtShort(end)}</td>
                      <td style={{ ...td, background: i % 2 === 1 ? '#fafafa' : '#fff' }}>{days ? `${days} day${days !== 1 ? 's' : ''}` : '—'}</td>
                    </tr>
                  )
                })}
            </tbody>
          </table>

          {/* Signature */}
          <div style={{ marginTop: '32px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '30px' }}>
            {['Worker Signature', 'Date Acknowledged'].map(label => (
              <div key={label} style={{ borderTop: '1px solid #333', paddingTop: '6px' }}>
                <div style={{ height: '40px' }} />
                <div style={{ fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#555' }}>{label}</div>
              </div>
            ))}
          </div>

          {/* Footer */}
          <div style={{ marginTop: '28px', paddingTop: '10px', borderTop: '1px solid #ddd', display: 'flex', justifyContent: 'space-between', fontSize: '10px', color: '#999' }}>
            <span>THM Technical Services · Confidential</span>
            <span>{project.name} · {worker.name}</span>
          </div>
        </div>
      ))}
    </div>
  )
}
