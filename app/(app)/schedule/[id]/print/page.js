import { createServerSupabase } from '@/lib/supabase-server'
import { notFound } from 'next/navigation'

export const dynamic = 'force-dynamic'
export const revalidate = 0

const fmt = d => d ? new Date(d + 'T00:00:00').toLocaleDateString('en-CA', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }) : '—'
const fmtShort = d => d ? new Date(d + 'T00:00:00').toLocaleDateString('en-CA', { year: 'numeric', month: 'short', day: 'numeric' }) : '—'

export default async function PrintDispatchPage({ params }) {
  const { id } = await params
  const supabase = await createServerSupabase()

  const [
    { data: project },
    { data: windows },
    { data: assignments },
    { data: workers },
    { data: rates },
  ] = await Promise.all([
    supabase.from('projects').select('*').eq('id', id).single(),
    supabase.from('project_crew_windows').select('*, crew_window_requirements(*)').eq('project_id', id).order('start_date'),
    supabase.from('crew_window_assignments').select('*').in('window_id', (await supabase.from('project_crew_windows').select('id').eq('project_id', id)).data?.map(w => w.id) || []),
    supabase.from('workers').select('id, name, default_rate_id').eq('active', true),
    supabase.from('rates').select('id, category, personnel'),
  ])

  if (!project) notFound()

  const rateMap = Object.fromEntries((rates || []).map(r => [r.id, r.personnel ? `${r.category} - ${r.personnel}` : r.category]))

  // Group assignments by worker
  const byWorker = {}
  for (const a of (assignments || [])) {
    const worker = (workers || []).find(w => w.id === a.worker_id)
    if (!worker) continue
    if (!byWorker[a.worker_id]) byWorker[a.worker_id] = { worker, trade: rateMap[worker.default_rate_id] || a.trade || '—', windows: [] }
    const win = (windows || []).find(w => w.id === a.window_id)
    if (win) byWorker[a.worker_id].windows.push({ win, assignment: a })
  }

  const dispatches = Object.values(byWorker).sort((a, b) => a.worker.name.localeCompare(b.worker.name))
  const printedOn = new Date().toLocaleDateString('en-CA', { year: 'numeric', month: 'long', day: 'numeric' })

  return (
    <html>
      <head>
        <title>Dispatch — {project.name}</title>
        <style>{`
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { font-family: Arial, sans-serif; font-size: 13px; color: #111; background: #fff; }

          .page {
            width: 210mm;
            min-height: 297mm;
            margin: 0 auto;
            padding: 18mm 18mm 14mm;
            page-break-after: always;
          }
          .page:last-child { page-break-after: avoid; }

          .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 18px; padding-bottom: 14px; border-bottom: 2px solid #111; }
          .company { font-size: 18px; font-weight: 800; letter-spacing: -0.5px; }
          .company-sub { font-size: 11px; color: #555; margin-top: 2px; }
          .doc-title { text-align: right; }
          .doc-title h2 { font-size: 15px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; }
          .doc-title p { font-size: 11px; color: #555; margin-top: 2px; }

          .project-box { background: #f8f8f8; border: 1px solid #ddd; border-radius: 6px; padding: 12px 16px; margin-bottom: 20px; display: grid; grid-template-columns: 1fr 1fr; gap: 6px 20px; }
          .project-box .field label { font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.06em; color: #666; }
          .project-box .field p { font-size: 13px; font-weight: 600; margin-top: 1px; }

          .worker-name { font-size: 20px; font-weight: 800; margin-bottom: 2px; }
          .worker-trade { font-size: 12px; color: #444; margin-bottom: 16px; }

          table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
          th { background: #111; color: #fff; font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.06em; padding: 7px 10px; text-align: left; }
          td { padding: 9px 10px; border-bottom: 1px solid #e5e5e5; font-size: 12px; vertical-align: top; }
          tr:last-child td { border-bottom: none; }
          tr:nth-child(even) td { background: #fafafa; }

          .signature { margin-top: 32px; display: grid; grid-template-columns: 1fr 1fr; gap: 30px; }
          .sig-block { border-top: 1px solid #333; padding-top: 6px; }
          .sig-block label { font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; color: #555; }
          .sig-space { height: 36px; }

          .footer { margin-top: 24px; padding-top: 10px; border-top: 1px solid #ddd; display: flex; justify-content: space-between; font-size: 10px; color: #888; }

          .no-print { position: fixed; top: 16px; right: 16px; z-index: 999; display: flex; gap: 8px; }
          .btn { padding: 8px 16px; border-radius: 6px; border: none; cursor: pointer; font-size: 13px; font-weight: 600; }
          .btn-primary { background: #111; color: #fff; }
          .btn-secondary { background: #f4f4f5; color: #111; border: 1px solid #ddd; }

          @media print {
            .no-print { display: none !important; }
            .page { margin: 0; }
            body { background: #fff; }
          }
        `}</style>
      </head>
      <body>

        {/* Print / Close buttons */}
        <div className="no-print">
          <button className="btn btn-secondary" onClick="window.close()">✕ Close</button>
          <button className="btn btn-primary" onClick="window.print()">🖨 Print / Save PDF</button>
        </div>

        {dispatches.length === 0 && (
          <div className="page" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <p style={{ color: '#888', fontSize: '16px' }}>No workers dispatched to this project yet.</p>
          </div>
        )}

        {dispatches.map(({ worker, trade, windows: workerWindows }) => (
          <div key={worker.id} className="page">

            {/* Header */}
            <div className="header">
              <div>
                <div className="company">THM Technical Services</div>
                <div className="company-sub">Dispatch Notice</div>
              </div>
              <div className="doc-title">
                <h2>Field Dispatch</h2>
                <p>Issued: {printedOn}</p>
              </div>
            </div>

            {/* Project info */}
            <div className="project-box">
              <div className="field"><label>Project</label><p>{project.name}</p></div>
              <div className="field"><label>Job #</label><p>{project.internal_job_no || '—'}</p></div>
              <div className="field"><label>Client</label><p>{project.client_name || '—'}</p></div>
              <div className="field"><label>Location</label><p>{project.location || '—'}</p></div>
            </div>

            {/* Worker */}
            <div className="worker-name">{worker.name}</div>
            <div className="worker-trade">{trade}</div>

            {/* Windows table */}
            <table>
              <thead>
                <tr>
                  <th>Phase / Window</th>
                  <th>Onsite Start</th>
                  <th>Onsite End</th>
                  <th>Duration</th>
                </tr>
              </thead>
              <tbody>
                {workerWindows.sort((a, b) => (a.assignment.onsite_start || '') > (b.assignment.onsite_start || '') ? 1 : -1).map(({ win, assignment }) => {
                  const s = assignment.onsite_start || win.start_date
                  const e = assignment.onsite_end   || win.end_date
                  const days = s && e ? Math.round((new Date(e) - new Date(s)) / 86400000) + 1 : null
                  return (
                    <tr key={win.id}>
                      <td style={{ fontWeight: 600 }}>{win.description || 'Crew Window'}</td>
                      <td>{fmtShort(s)}</td>
                      <td>{fmtShort(e)}</td>
                      <td>{days ? `${days} day${days !== 1 ? 's' : ''}` : '—'}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>

            {/* Signature */}
            <div className="signature">
              <div className="sig-block">
                <div className="sig-space" />
                <label>Worker Signature</label>
              </div>
              <div className="sig-block">
                <div className="sig-space" />
                <label>Date Acknowledged</label>
              </div>
            </div>

            {/* Footer */}
            <div className="footer">
              <span>THM Technical Services · Confidential</span>
              <span>{project.name} · {worker.name}</span>
            </div>

          </div>
        ))}

      </body>
    </html>
  )
}
