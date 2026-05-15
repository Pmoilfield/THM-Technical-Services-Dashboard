import { createServerSupabase } from '@/lib/supabase-server'
import { money, pct, n, statusClass, calculateAccruals } from '@/lib/calculations'
import Link from 'next/link'
import ClickableRow from '@/components/ui/ClickableRow'

const STATUS_LIST = ['Estimating', 'Awarded', 'Active', 'Complete', 'On Hold', 'Cancelled', 'Archived']

function StatCard({ label, value, sub, cls }) {
  return (
    <div className={`card ${cls || ''}`}>
      <div className="label">{label}</div>
      <div className="value">{value}</div>
      {sub && <div className="sub">{sub}</div>}
    </div>
  )
}

export default async function DashboardPage() {
  const supabase = await createServerSupabase()

  // Fetch everything needed for portfolio view
  const [
    { data: projects },
    { data: tickets },
    { data: purchaseOrders },
    { data: invoices },
    { data: proposals },
    { data: expiringTickets },
    { data: expiringOrientations },
  ] = await Promise.all([
    supabase.from('projects').select('*').order('updated_at', { ascending: false }),
    supabase.from('field_tickets').select('project_id, subtotal, status'),
    supabase.from('purchase_orders').select('project_id, value, markup'),
    supabase.from('invoices').select('status, total'),
    supabase.from('proposals').select('id, status').not('status', 'in', '("Converted","Lost")'),
    supabase.from('worker_safety_tickets')
      .select('ticket_name, expiry_date, workers!inner(id, name, active)')
      .eq('workers.active', true)
      .lte('expiry_date', (() => { const d = new Date(); d.setDate(d.getDate() + 30); return d.toISOString().slice(0, 10) })())
      .gte('expiry_date', new Date().toISOString().slice(0, 10))
      .order('expiry_date'),
    supabase.from('worker_orientations')
      .select('site_name, expiry_date, workers!inner(id, name, active)')
      .eq('workers.active', true)
      .not('expiry_date', 'is', null)
      .lte('expiry_date', (() => { const d = new Date(); d.setDate(d.getDate() + 30); return d.toISOString().slice(0, 10) })())
      .gte('expiry_date', new Date().toISOString().slice(0, 10))
      .order('expiry_date'),
  ])

  const allProjects = projects || []
  const projectList = allProjects.filter(p => !p.archived)

  // Portfolio totals
  let portfolioEstimate = 0, portfolioAccruals = 0, portfolioInvoiced = 0, portfolioPending = 0

  const projectRows = projectList.map(project => {
    const projectTickets = (tickets || []).filter(t => t.project_id === project.id)
    const projectPOs = (purchaseOrders || []).filter(po => po.project_id === project.id)
    const { fieldTicketTotal, purchaseOrderTotal, accrualsToDate } = calculateAccruals(projectTickets, projectPOs)
    const estimate = n(project.estimate_subtotal)
    const remaining = estimate - accrualsToDate
    const spentPct = estimate ? accrualsToDate / estimate : 0

    portfolioEstimate += estimate
    portfolioAccruals += accrualsToDate

    return { project, fieldTicketTotal, purchaseOrderTotal, accrualsToDate, estimate, remaining, spentPct }
  })

  // Invoice totals
  ;(invoices || []).forEach(inv => {
    if (inv.status === 'paid' || inv.status === 'sent') portfolioInvoiced += n(inv.total)
    if (inv.status === 'draft') portfolioPending += n(inv.total)
  })

  const portfolioRemaining = portfolioEstimate - portfolioAccruals
  const portfolioSpent = portfolioEstimate ? portfolioAccruals / portfolioEstimate : 0

  // Status breakdown
  const statusCounts = {}
  STATUS_LIST.forEach(s => { statusCounts[s] = 0 })
  projectList.forEach(p => { statusCounts[p.status] = (statusCounts[p.status] || 0) + 1 })
  statusCounts['Archived'] = allProjects.filter(p => p.archived).length

  // Active + recently updated first
  const activeProjects = projectRows.slice(0, 10)

  // Pending invoices count
  const pendingApprovals = (tickets || []).filter(t => t.status === 'submitted').length
  const newProposals = (proposals || []).filter(p => p.status === 'New').length

  return (
    <div className="grid" style={{ gap: '20px' }}>
      <div className="page-header">
        <div className="split">
          <div>
            <h1>Portfolio Dashboard</h1>
            <p className="muted">THM Technical Services &mdash; {projectList.length} projects</p>
          </div>
          <div className="toolbar">
            <Link href="/projects/new"><button className="primary">+ New Project</button></Link>
            <Link href="/field-tickets/new"><button>+ Field Ticket</button></Link>
          </div>
        </div>
      </div>

      {/* Alerts */}
      {newProposals > 0 && (
        <div className="notice warn">
          <strong>{newProposals} new {newProposals === 1 ? 'proposal' : 'proposals'}</strong> waiting for review.{' '}
          <Link href="/proposals">View proposals →</Link>
        </div>
      )}
      {pendingApprovals > 0 && (
        <div className="notice warn">
          <strong>{pendingApprovals} field {pendingApprovals === 1 ? 'ticket' : 'tickets'}</strong> waiting for approval.{' '}
          <Link href="/field-tickets?status=submitted">Review now →</Link>
        </div>
      )}
      {(expiringTickets || []).length > 0 && (
        <div className="notice warn">
          <div style={{ marginBottom: '6px' }}>
            <strong>{(expiringTickets || []).length} safety {(expiringTickets || []).length === 1 ? 'ticket' : 'tickets'}</strong> expiring within 30 days:
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
            {(expiringTickets || []).map((t, i) => {
              const exp = new Date(t.expiry_date + 'T00:00:00')
              const daysLeft = Math.floor((exp - new Date().setHours(0,0,0,0)) / 86400000)
              return (
                <span key={i} style={{ fontSize: '12px', background: '#fff', border: '1px solid #fcd34d', borderRadius: '99px', padding: '2px 10px', fontWeight: 600 }}>
                  {t.workers?.name} — {t.ticket_name}
                  <span style={{ color: '#d97706', marginLeft: '6px' }}>({daysLeft}d)</span>
                </span>
              )
            })}
          </div>
          <div style={{ marginTop: '8px' }}>
            <Link href="/employees" style={{ fontSize: '13px', fontWeight: 600 }}>Manage employees →</Link>
          </div>
        </div>
      )}
      {(expiringOrientations || []).length > 0 && (
        <div className="notice warn">
          <div style={{ marginBottom: '6px' }}>
            <strong>{(expiringOrientations || []).length} site {(expiringOrientations || []).length === 1 ? 'orientation' : 'orientations'}</strong> expiring within 30 days:
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
            {(expiringOrientations || []).map((o, i) => {
              const exp = new Date(o.expiry_date + 'T00:00:00')
              const daysLeft = Math.floor((exp - new Date().setHours(0,0,0,0)) / 86400000)
              return (
                <span key={i} style={{ fontSize: '12px', background: '#fff', border: '1px solid #fcd34d', borderRadius: '99px', padding: '2px 10px', fontWeight: 600 }}>
                  {o.workers?.name} — {o.site_name}
                  <span style={{ color: '#d97706', marginLeft: '6px' }}>({daysLeft}d)</span>
                </span>
              )
            })}
          </div>
          <div style={{ marginTop: '8px' }}>
            <Link href="/employees" style={{ fontSize: '13px', fontWeight: 600 }}>Manage employees →</Link>
          </div>
        </div>
      )}

      {/* Portfolio KPIs */}
      <div className="cards" style={{ gridTemplateColumns: 'repeat(5, minmax(140px, 1fr))' }}>
        <StatCard label="Projects" value={String(projectList.length)} sub={`${(statusCounts['Active'] || 0) + (statusCounts['Estimating'] || 0) + (statusCounts['Awarded'] || 0)} active`} />
        <StatCard label="Portfolio Estimate" value={money(portfolioEstimate)} sub="Before GST" />
        <StatCard label="Accruals To Date" value={money(portfolioAccruals)} sub={`${pct(portfolioSpent)} spent`} cls={portfolioAccruals > portfolioEstimate && portfolioEstimate ? 'bad' : ''} />
        <StatCard label="Remaining" value={money(portfolioRemaining)} sub="Estimate minus accruals" cls={portfolioRemaining < 0 ? 'bad' : 'good'} />
        <StatCard label="Invoiced" value={money(portfolioInvoiced)} sub={`${money(portfolioPending)} in draft`} />
      </div>

      <div className="grid two">
        {/* Status breakdown */}
        <section className="panel">
          <div className="split">
            <h2>Status breakdown</h2>
            <Link href="/projects"><button className="ghost small">All projects</button></Link>
          </div>
          <div className="table-wrap" style={{ marginTop: '12px' }}>
            <table>
              <thead><tr><th>Status</th><th className="numeric">Projects</th><th className="numeric">Share</th></tr></thead>
              <tbody>
                {STATUS_LIST.map(status => (
                  <tr key={status}>
                    <td>
                      {status === 'Archived'
                        ? <Link href="/projects/archived"><span className="status-pill">{status}</span></Link>
                        : <span className={`status-pill ${statusClass(status)}`}>{status}</span>
                      }
                    </td>
                    <td className="numeric">{statusCounts[status] || 0}</td>
                    <td className="numeric">{allProjects.length ? pct((statusCounts[status] || 0) / allProjects.length) : '0.0%'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* Quick actions */}
        <section className="panel">
          <h2>Quick actions</h2>
          <div className="grid" style={{ gap: '10px', marginTop: '12px' }}>
            <Link href="/field-tickets/new" style={{ textDecoration: 'none' }}>
              <div style={{ border: '1px solid var(--line)', borderRadius: '12px', padding: '14px', cursor: 'pointer', background: '#fafcff' }}>
                <div style={{ fontWeight: 700, marginBottom: '4px' }}>New Field Ticket</div>
                <div className="fine-print">Assemble crew time entries into a client ticket</div>
              </div>
            </Link>
            <Link href="/invoices/new" style={{ textDecoration: 'none' }}>
              <div style={{ border: '1px solid var(--line)', borderRadius: '12px', padding: '14px', cursor: 'pointer', background: '#fafcff' }}>
                <div style={{ fontWeight: 700, marginBottom: '4px' }}>New Invoice</div>
                <div className="fine-print">Bundle approved tickets into a client invoice</div>
              </div>
            </Link>
            <Link href="/projects/new" style={{ textDecoration: 'none' }}>
              <div style={{ border: '1px solid var(--line)', borderRadius: '12px', padding: '14px', cursor: 'pointer', background: '#fafcff' }}>
                <div style={{ fontWeight: 700, marginBottom: '4px' }}> New Project</div>
                <div className="fine-print">Set up a new project with estimate and scope</div>
              </div>
            </Link>
          </div>
        </section>
      </div>

      {/* Active projects table */}
      <section className="panel">
        <div className="split">
          <div>
            <h2>Projects</h2>
            <p className="muted">Most recently updated projects.</p>
          </div>
          <Link href="/projects"><button className="ghost small">View all →</button></Link>
        </div>
        <div className="table-wrap" style={{ marginTop: '12px' }}>
          <table>
            <thead>
              <tr>
                <th>Project</th>
                <th>Client</th>
                <th>Status</th>
                <th>Manager</th>
                <th className="numeric">Estimate</th>
                <th className="numeric">Accruals</th>
                <th className="numeric">Remaining</th>
                <th className="numeric">Spent</th>
              </tr>
            </thead>
            <tbody>
              {activeProjects.length ? activeProjects.map(({ project, estimate, accrualsToDate, remaining, spentPct }) => {
                const progressWidth = Math.max(0, Math.min(100, spentPct * 100))
                const cls = remaining < 0 ? 'bad' : ''
                return (
                  <ClickableRow key={project.id} href={`/projects/${project.id}`}>
                    <td>
                      <strong>{project.name}</strong>
                      <div className="fine-print">{project.estimate_no || project.internal_job_no || '—'}</div>
                    </td>
                    <td>
                      {project.client_name || '—'}
                      <div className="fine-print">{project.location || ''}</div>
                      {project.client_job_no && <div className="fine-print">Job: {project.client_job_no}</div>}
                      {project.client_po_number && <div className="fine-print">PO: {project.client_po_number}</div>}
                    </td>
                    <td><span className={`status-pill ${statusClass(project.status)}`}>{project.status}</span></td>
                    <td>{project.project_manager || '—'}</td>
                    <td className="numeric">{money(estimate)}</td>
                    <td className="numeric">{money(accrualsToDate)}</td>
                    <td className={`numeric ${cls}`}>{money(remaining)}</td>
                    <td className="numeric" style={{ minWidth: '120px' }}>
                      <div className="progress"><span className="progress-bar" style={{ width: `${progressWidth}%` }} /></div>
                      <span className="fine-print">{pct(spentPct)}</span>
                    </td>
                  </ClickableRow>
                )
              }) : (
                <tr><td colSpan="9" className="empty">No active projects. <Link href="/projects/new">Create one →</Link></td></tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  )
}

