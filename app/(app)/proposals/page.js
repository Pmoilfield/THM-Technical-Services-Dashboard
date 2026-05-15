import { createServerSupabase } from '@/lib/supabase-server'
import Link from 'next/link'
import { formatDate, statusClass } from '@/lib/calculations'
import ProposalSubmittedDatePicker from '@/components/proposals/ProposalSubmittedDatePicker'
import OpenProposalsTable from '@/components/proposals/OpenProposalsTable'

function money(v) {
  if (!v) return '—'
  return '$' + parseFloat(v).toLocaleString('en-CA', { minimumFractionDigits: 0, maximumFractionDigits: 0 })
}

function shortDate(iso) {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('en-CA', { year: 'numeric', month: 'short', day: 'numeric' })
}

// Proposal tracking ends once estimate is sent to client (Awarded or beyond)
const PROPOSAL_STAGES = ['Estimating', 'Proposal submitted']

function PipelineBar({ status, submittedDate }) {
  const stages = [
    { label: 'Submitted', done: true },
    { label: submittedDate ? `Awarded ${shortDate(submittedDate)}` : 'Award', done: !!submittedDate },
  ]
  return (
    <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
      {stages.map((s, i) => (
        <div key={s.label} style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          {i > 0 && <div style={{ width: '16px', height: '2px', background: s.done ? '#b91c1c' : '#e5e7eb' }} />}
          <div style={{
            display: 'flex', alignItems: 'center', gap: '4px',
            fontSize: '11px', fontWeight: s.done ? 700 : 400,
            color: s.done ? '#b91c1c' : '#9ca3af',
          }}>
            <div style={{
              width: '8px', height: '8px', borderRadius: '50%',
              background: s.done ? '#b91c1c' : '#e5e7eb',
              border: s.done ? 'none' : '1px solid #d1d5db',
            }} />
            {s.label}
          </div>
        </div>
      ))}
    </div>
  )
}

export default async function ProposalsPage() {
  const supabase = await createServerSupabase()

  const [{ data: active }, { data: converted }] = await Promise.all([
    supabase.from('proposals')
      .select('*')
      .not('status', 'in', '("Converted","Lost")')
      .order('created_at', { ascending: false }),
    supabase.from('proposals')
      .select('*, projects:converted_project_id(id, name, status, estimate_no, internal_job_no)')
      .eq('status', 'Converted')
      .order('updated_at', { ascending: false }),
  ])

  const newCount = (active || []).filter(p => p.status === 'New').length

  return (
    <div className="grid">
      <div className="page-header">
        <div className="split">
          <div>
            <h1>Proposals</h1>
            <p className="muted">{(active || []).length} open · {(converted || []).length} converted to project</p>
          </div>
          <Link href="/proposals/new"><button className="primary">+ New Proposal</button></Link>
        </div>
      </div>

      {newCount > 0 && (
        <div className="notice warn">
          <strong>{newCount} new {newCount === 1 ? 'proposal' : 'proposals'}</strong> waiting for review.
        </div>
      )}

      <OpenProposalsTable proposals={active || []} />

      {/* Pipeline tracking — converted proposals */}
      {(converted || []).length > 0 && (
        <section className="panel">
          <h2>Pipeline tracking</h2>
          <p className="muted" style={{ fontSize: '12px', marginBottom: '12px' }}>Tracks from estimating until award.</p>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Client</th>
                  <th>Project</th>
                  <th>Job #</th>
                  <th className="numeric">Est. Value</th>
                  <th>Converted</th>
                  <th>Proposal submitted</th>
                  <th style={{ minWidth: '240px' }}>Stage</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {(converted || []).map(p => {
                  const proj = p.projects
                  return (
                    <tr key={p.id}>
                      <td><strong>{p.client_name || '—'}</strong></td>
                      <td>{proj?.name || '—'}</td>
                      <td>{proj?.estimate_no || proj?.internal_job_no || '—'}</td>
                      <td className="numeric">{money(p.estimated_value)}</td>
                      <td>{shortDate(p.updated_at)}</td>
                      <td style={{ position: 'relative' }}>
                        <ProposalSubmittedDatePicker proposalId={p.id} currentDate={p.proposal_submitted_date} />
                      </td>
                      <td>
                        {proj ? <PipelineBar status={proj.status} submittedDate={p.proposal_submitted_date} /> : <span className="muted">—</span>}
                      </td>
                      <td className="nowrap">
                        <div style={{ display: 'flex', gap: '6px' }}>
                          {proj && <Link href={`/projects/${proj.id}`}><button className="small primary">Project →</button></Link>}
                          <Link href={`/proposals/${p.id}`}><button className="small">Proposal</button></Link>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </div>
  )
}
