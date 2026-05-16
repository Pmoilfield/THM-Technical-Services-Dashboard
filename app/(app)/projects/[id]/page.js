import { createServerSupabase, createAdminSupabase } from '@/lib/supabase-server'
import { money, pct, n, statusClass, formatDate, calculateProject, calculateAccruals, calculateVariance } from '@/lib/calculations'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import ArchiveButton from '@/components/projects/ArchiveButton'
import DeleteProjectButton from '@/components/projects/DeleteProjectButton'
import SendToProposalsButton from '@/components/projects/SendToProposalsButton'
import EstimateBreakdownPanel from '@/components/estimate/EstimateBreakdownPanel'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export default async function ProjectPage({ params }) {
  const supabase = await createServerSupabase()
  const adminSupabase = createAdminSupabase()
  const { id } = await params

  const { data: project } = await supabase.from('projects').select('*').eq('id', id).single()
  if (!project) notFound()

  const { data: sections } = await supabase.from('estimate_sections').select('*').eq('project_id', id).order('number')
  const sectionIds = (sections || []).map(s => s.id)

  const [
    { data: items },
    { data: tickets },
    { data: pos },
    { data: invoices },
    { data: proposal },
  ] = await Promise.all([

    sectionIds.length ? supabase.from('estimate_items').select('*').in('section_id', sectionIds).order('sort_order') : Promise.resolve({ data: [] }),
    supabase.from('field_tickets').select('*').eq('project_id', id).order('date', { ascending: false }),
    supabase.from('purchase_orders').select('*').eq('project_id', id).order('date', { ascending: false }),
    supabase.from('invoices').select('*').eq('project_id', id).order('date', { ascending: false }),
    adminSupabase.from('proposals').select('id, status').eq('converted_project_id', id).single(),
  ])

  const { sectionTotals, estimateSubtotal, gstAmount, totalIncludingTax } = calculateProject(project, sections, items)
  const { fieldTicketTotal, purchaseOrderTotal, accrualsToDate } = calculateAccruals(tickets, pos)
  const remaining = estimateSubtotal - accrualsToDate
  const spentPct = estimateSubtotal ? accrualsToDate / estimateSubtotal : 0
  const variance = calculateVariance(sectionTotals, tickets, pos)

  const approvedTickets = (tickets || []).filter(t => t.status === 'approved')
  const invoicedTotal = (invoices || []).reduce((s, inv) => s + n(inv.total), 0)
  const pendingApproval = (tickets || []).filter(t => t.status === 'submitted').length
  const openPOs = (pos || []).filter(p => p.status === 'Open').length

  return (
    <div className="grid">
      <div className="page-header">
        <div className="split">
          <div>
            <p style={{ fontSize: '18px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--muted)', marginBottom: '12px' }}>Project Overview</p>
            <h1>{project.name}</h1>
            <p className="muted">{project.client_name || 'No client'}{project.location ? ` · ${project.location}` : ''}{project.internal_job_no ? ` · ${project.internal_job_no}` : ''}</p>
            <p className="muted" style={{ fontSize: '12px', marginTop: '2px' }}>
              Client Job: {project.client_job_no || '—'} &nbsp;·&nbsp; Client PO: {project.client_po_number || '—'}
            </p>
          </div>
          <div className="toolbar" style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
            <span className={`status-pill ${statusClass(project.status)}`}>{project.status}</span>
            <Link href={`/projects/${id}/edit`}><button style={{ borderRadius: '8px' }}>Edit</button></Link>
            <ArchiveButton projectId={id} archived={project.archived} />
            <DeleteProjectButton projectId={id} projectName={project.name} />
            <SendToProposalsButton projectId={id} projectName={project.name} clientName={project.client_name} estimatedValue={project.estimate_subtotal} hasProposal={!!proposal} />
            <Link href={`/projects/${id}/pos/new`}><button style={{ borderRadius: '8px' }}>+ PO</button></Link>
            <Link href={`/projects/${id}/dispatch`}><button style={{ borderRadius: '8px' }}>Dispatch</button></Link>
            <Link href={`/field-tickets/new?project=${id}`}><button className="primary" style={{ borderRadius: '24px' }}>+ Field Ticket</button></Link>
          </div>
        </div>
      </div>

      {/* Alerts */}
      {pendingApproval > 0 && (
        <div className="notice warn">
          <strong>{pendingApproval} field {pendingApproval === 1 ? 'ticket' : 'tickets'}</strong> waiting for approval.{' '}
          <Link href={`/field-tickets?project=${id}&status=submitted`}>Review now &rarr;</Link>
        </div>
      )}

      {/* KPI cards */}
      <div className="cards" style={{ gridTemplateColumns: 'repeat(6, minmax(130px, 1fr))' }}>
        <Link href={`/projects/${id}/estimate`} style={{ textDecoration: 'none' }}>
          <div className="card" style={{ cursor: 'pointer' }}>
            <div className="label">Estimate</div>
            <div className="value">{money(n(project.estimate_subtotal))}</div>
            <div className="sub">+ GST {money(n(project.gst_amount))}</div>
          </div>
        </Link>
        <div className="card">
          <div className="label">Field Tickets</div>
          <div className="value">{money(fieldTicketTotal)}</div>
          <div className="sub">{(tickets || []).length} tickets · {approvedTickets.length} approved</div>
        </div>
        <div className="card">
          <div className="label">Purchase Orders</div>
          <div className="value">{money(purchaseOrderTotal)}</div>
          <div className="sub">{(pos || []).length} POs · {openPOs} open</div>
        </div>
        <div className="card">
          <div className="label">Accruals</div>
          <div className="value">{money(accrualsToDate)}</div>
          <div className="sub">{pct(spentPct)} of estimate</div>
        </div>
        <div className={`card ${remaining < 0 ? 'bad' : 'good'}`}>
          <div className="label">Remaining</div>
          <div className="value">{money(remaining)}</div>
          <div className="sub">Estimate minus accruals</div>
        </div>
        <div className="card">
          <div className="label">Invoiced</div>
          <div className="value">{money(invoicedTotal)}</div>
          <div className="sub">{(invoices || []).length} invoices</div>
        </div>
      </div>

      <EstimateBreakdownPanel
        projectId={id}
        sections={sections}
        items={items}
        gstRate={project.gst_rate}
        variance={variance}
      />

      <div className="grid two">
        {/* Field tickets */}
        <section className="panel">
          <div className="split">
            <h2>Field tickets</h2>
            <Link href={`/field-tickets/new?project=${id}`}><button className="primary small">+ New</button></Link>
          </div>
          <div className="table-wrap" style={{ marginTop: '12px' }}>
            <table>
              <thead><tr><th>Ticket #</th><th>Date</th><th>Status</th><th className="numeric">Total</th></tr></thead>
              <tbody>
                {(tickets || []).slice(0, 8).map(t => (
                  <tr key={t.id}>
                    <td><Link href={`/field-tickets/${t.id}`}><strong>{t.ticket_number}</strong></Link></td>
                    <td>{formatDate(t.date)}</td>
                    <td><span className={`status-pill ${statusClass(t.status)}`}>{t.status}</span></td>
                    <td className="numeric">{money(t.subtotal)}</td>
                  </tr>
                ))}
                {!(tickets || []).length && <tr><td colSpan="4" className="empty">No field tickets yet.</td></tr>}
              </tbody>
            </table>
          </div>
        </section>

        {/* Purchase orders */}
        <section className="panel">
          <div className="split">
            <h2>Purchase orders</h2>
            <Link href={`/projects/${id}/pos/new`}><button className="primary small">+ New PO</button></Link>
          </div>
          <div className="table-wrap" style={{ marginTop: '12px' }}>
            <table>
              <thead><tr><th>PO #</th><th>Vendor</th><th>Date</th><th>Status</th><th className="numeric">Value</th></tr></thead>
              <tbody>
                {(pos || []).map(po => (
                  <tr key={po.id}>
                    <td><strong>{po.po_number}</strong></td>
                    <td>{po.vendor}</td>
                    <td>{formatDate(po.date)}</td>
                    <td><span className={`status-pill ${po.status === 'Open' ? 'status-active' : 'status-complete'}`}>{po.status}</span></td>
                    <td className="numeric">{money(po.value)}</td>
                  </tr>
                ))}
                {!(pos || []).length && <tr><td colSpan="5" className="empty">No purchase orders yet.</td></tr>}
              </tbody>
            </table>
          </div>
        </section>
      </div>

      {/* Invoices */}
      {(invoices || []).length > 0 && (
        <section className="panel">
          <div className="split">
            <h2>Invoices</h2>
            <Link href={`/invoices/new?project=${id}`}><button className="primary small">+ New Invoice</button></Link>
          </div>
          <div className="table-wrap" style={{ marginTop: '12px' }}>
            <table>
              <thead><tr><th>Invoice #</th><th>Date</th><th>Due</th><th>Status</th><th className="numeric">Total</th></tr></thead>
              <tbody>
                {invoices.map(inv => (
                  <tr key={inv.id}>
                    <td><Link href={`/invoices/${inv.id}`}><strong>{inv.invoice_number}</strong></Link></td>
                    <td>{formatDate(inv.date)}</td>
                    <td>{formatDate(inv.due_date)}</td>
                    <td><span className={`status-pill ${statusClass(inv.status)}`}>{inv.status}</span></td>
                    <td className="numeric">{money(inv.total)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

    </div>
  )
}
