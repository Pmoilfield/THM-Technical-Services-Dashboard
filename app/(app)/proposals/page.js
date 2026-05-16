import { createServerSupabase } from '@/lib/supabase-server'
import Link from 'next/link'
import { formatDate } from '@/lib/calculations'
import ProposalSubmittedDatePicker from '@/components/proposals/ProposalSubmittedDatePicker'
import OpenProposalsTable from '@/components/proposals/OpenProposalsTable'
import AddToPipelineForm from '@/components/proposals/AddToPipelineForm'

function money(v) {
  if (!v) return '—'
  return '$' + parseFloat(v).toLocaleString('en-CA', { minimumFractionDigits: 0, maximumFractionDigits: 0 })
}

function shortDate(iso) {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('en-CA', { year: 'numeric', month: 'short', day: 'numeric' })
}

function PipelineBar({ status, submittedDate }) {
  const stages = [
    { label: 'Submitted', done: true },
    { label: submittedDate ? `Awarded ${shortDate(submittedDate)}` : 'Award', done: !!submittedDate },
  ]
  return (
    <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
      {stages.map((s, i) => (
        <div key={s.label} style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          {i > 0 && <div style={{ width: '16px', height: '2px', background: s.done ? '#9ca3af' : '#e5e7eb' }} />}
          <div style={{
            display: 'flex', alignItems: 'center', gap: '4px',
            fontSize: '11px', fontWeight: s.done ? 700 : 400,
            color: s.done ? '#6b7280' : '#9ca3af',
          }}>
            <div style={{
              width: '8px', height: '8px', borderRadius: '50%',
              background: s.done ? '#9ca3af' : '#e5e7eb',
              border: s.done ? 'none' : '1px solid #d1d5db',
            }} />
            {s.label}
          </div>
        </div>
      ))}
    </div>
  )
}

const STATUS_BADGE = {
  Pipeline:   { bg: '#f3f4f6', color: '#6b7280' },
  New:        { bg: '#dcfce7', color: '#166534' },
  'In Review':{ bg: '#fef9c3', color: '#854d0e' },
  Estimating: { bg: '#dbeafe', color: '#1e40af' },
  Submitted:  { bg: '#ede9fe', color: '#5b21b6' },
  Lost:       { bg: '#f4f4f5', color: '#374151' },
}

export default async function BDTrackerPage() {
  const supabase = await createServerSupabase()

  const [{ data: rfps }, { data: pipeline }, { data: converted }] = await Promise.all([
    // Active RFPs — New or In Review with a due date (actionable)
    supabase.from('proposals')
      .select('*')
      .in('status', ['New', 'In Review'])
      .order('due_date', { ascending: true }),

    // Pipeline — Pipeline or Estimating status
    supabase.from('proposals')
      .select('*')
      .in('status', ['Pipeline', 'Estimating', 'Submitted'])
      .order('created_at', { ascending: false }),

    // Converted — won and linked to a project
    supabase.from('proposals')
      .select('*, projects:converted_project_id(id, name, status, estimate_no, internal_job_no)')
      .eq('status', 'Converted')
      .order('updated_at', { ascending: false }),
  ])

  const rfpCount = (rfps || []).length
  const pipelineCount = (pipeline || []).length + (converted || []).length

  return (
    <div className="grid">
      <div className="page-header">
        <div className="split">
          <div>
            <h1>BD Tracker</h1>
            <p className="muted">{rfpCount} active RFPs · {pipelineCount} in pipeline</p>
          </div>
          <div className="toolbar">
            <AddToPipelineForm />
            <Link href="/proposals/new"><button className="primary">+ New RFP</button></Link>
          </div>
        </div>
      </div>

      {/* Active RFPs */}
      <OpenProposalsTable proposals={rfps || []} />

      {/* Pipeline */}
      <section className="panel">
        <h2>Pipeline</h2>
        <p className="muted" style={{ fontSize: '12px', marginBottom: '12px' }}>Tracking all known opportunities from pipeline through award.</p>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Client</th>
                <th>Description</th>
                <th>Location</th>
                <th>Status</th>
                <th className="numeric">Est. Value</th>
                <th>Added</th>
                <th>Notes</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {(pipeline || []).map(p => {
                const badge = STATUS_BADGE[p.status] || {}
                return (
                  <tr key={p.id}>
                    <td><strong>{p.client_name || '—'}</strong></td>
                    <td style={{ maxWidth: '260px' }}>{p.project_description || '—'}</td>
                    <td>{p.location || '—'}</td>
                    <td>
                      <span style={{
                        display: 'inline-block', padding: '2px 8px', borderRadius: '99px',
                        fontSize: '11px', fontWeight: 600,
                        background: badge.bg || '#f3f4f6', color: badge.color || '#374151',
                      }}>{p.status}</span>
                    </td>
                    <td className="numeric">{money(p.estimated_value)}</td>
                    <td className="fine-print">{p.proposal_added_date ? shortDate(p.proposal_added_date) : shortDate(p.created_at)}</td>
                    <td className="fine-print" style={{ maxWidth: '200px' }}>{p.notes || '—'}</td>
                    <td className="nowrap">
                      <div style={{ display: 'flex', gap: '6px' }}>
                        <Link href={`/proposals/${p.id}`}><button className="small">View</button></Link>
                        <Link href={`/proposals/${p.id}/edit`}><button className="small">Edit</button></Link>
                      </div>
                    </td>
                  </tr>
                )
              })}
              {!(pipeline || []).length && (
                <tr><td colSpan="8" className="empty">No pipeline items yet.</td></tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Converted — won projects */}
        {(converted || []).length > 0 && (
          <div style={{ marginTop: '24px', borderTop: '1px solid var(--line)', paddingTop: '16px' }}>
            <h3 style={{ fontSize: '13px', fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '10px' }}>Converted to Project</h3>
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
                    <th style={{ minWidth: '200px' }}>Stage</th>
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
                        <td className="fine-print">{proj?.internal_job_no || proj?.estimate_no || '—'}</td>
                        <td className="numeric">{money(p.estimated_value)}</td>
                        <td className="fine-print">{shortDate(p.updated_at)}</td>
                        <td>
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
          </div>
        )}
      </section>
    </div>
  )
}
