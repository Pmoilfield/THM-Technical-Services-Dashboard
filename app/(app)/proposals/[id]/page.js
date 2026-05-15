import { createServerSupabase } from '@/lib/supabase-server'
import { notFound } from 'next/navigation'
import { formatDate } from '@/lib/calculations'
import Link from 'next/link'
import ConvertToProjectButton from '@/components/proposals/ConvertToProjectButton'
import UpdateStatusButton from '@/components/proposals/UpdateStatusButton'

function money(v) {
  if (!v) return '—'
  return '$' + parseFloat(v).toLocaleString('en-CA', { minimumFractionDigits: 0, maximumFractionDigits: 0 })
}

export default async function ProposalDetailPage({ params }) {
  const { id } = await params
  const supabase = await createServerSupabase()
  const { data: proposal } = await supabase.from('proposals').select('*').eq('id', id).single()
  if (!proposal) notFound()

  const converted = proposal.status === 'Converted'

  return (
    <div className="grid" style={{ maxWidth: '800px' }}>
      <div className="page-header">
        <div className="split">
          <div>
            <h1>{proposal.client_name || 'Unnamed Proposal'}</h1>
            <p className="muted">Submitted by {proposal.submitted_by || 'unknown'} · {formatDate(proposal.created_at)}</p>
          </div>
          <div className="toolbar">
            <Link href="/proposals"><button>← Back</button></Link>
            {!converted && <UpdateStatusButton proposalId={id} currentStatus={proposal.status} />}
            {!converted && <ConvertToProjectButton proposal={proposal} />}
          </div>
        </div>
      </div>

      {converted && (
        <div className="notice good">
          This proposal has been converted to a project.{' '}
          {proposal.converted_project_id && (
            <Link href={`/projects/${proposal.converted_project_id}`}>View project →</Link>
          )}
        </div>
      )}

      <section className="panel">
        <h2>Proposal details</h2>
        <div className="form-grid two" style={{ marginTop: '14px', gap: '12px 24px' }}>
          <div><div className="label">Client</div><div>{proposal.client_name || '—'}</div></div>
          <div><div className="label">Location</div><div>{proposal.location || '—'}</div></div>
          <div><div className="label">Contact</div><div>{proposal.contact_name || '—'}</div></div>
          <div><div className="label">Phone</div><div>{proposal.contact_phone || '—'}</div></div>
          <div><div className="label">Email</div><div>{proposal.contact_email || '—'}</div></div>
          <div><div className="label">Est. Value</div><div>{money(proposal.estimated_value)}</div></div>
          <div><div className="label">Priority</div><div>{proposal.priority}</div></div>
          <div><div className="label">Due Date</div><div>{proposal.due_date ? formatDate(proposal.due_date) : '—'}</div></div>
          <div><div className="label">Status</div><div>{proposal.status}</div></div>
        </div>
        {proposal.project_description && (
          <div style={{ marginTop: '16px' }}>
            <div className="label">Description</div>
            <div style={{ marginTop: '4px', lineHeight: 1.6 }}>{proposal.project_description}</div>
          </div>
        )}
        {proposal.notes && (
          <div style={{ marginTop: '16px' }}>
            <div className="label">Notes</div>
            <div style={{ marginTop: '4px', lineHeight: 1.6 }}>{proposal.notes}</div>
          </div>
        )}
      </section>
    </div>
  )
}
