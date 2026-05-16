import { createServerSupabase } from '@/lib/supabase-server'
import { money, formatDate, n } from '@/lib/calculations'
import Link from 'next/link'

function ageBucket(days) {
  if (days <= 0) return 0
  if (days <= 30) return 1
  if (days <= 60) return 2
  if (days <= 90) return 3
  return 4
}

const AGING_BUCKETS = [
  { key: 0, label: 'Current',     color: '#16a34a' },
  { key: 1, label: '1–30 days',   color: '#ca8a04' },
  { key: 2, label: '31–60 days',  color: '#ea580c' },
  { key: 3, label: '61–90 days',  color: '#374151' },
  { key: 4, label: '90+ days',    color: '#111' },
]

export default async function FinancialsPage() {
  const supabase = await createServerSupabase()

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const [
    { data: invoices },
    { data: tickets },
    { data: junctions },
  ] = await Promise.all([
    supabase.from('invoices').select('*, projects(id, name, client_name)').neq('status', 'void').order('date', { ascending: false }),
    supabase.from('field_tickets').select('*, projects(id, name, client_name)').eq('status', 'approved').order('date'),
    supabase.from('invoice_tickets').select('field_ticket_id, invoices!inner(status)'),
  ])

  const allInvoices = invoices || []
  const allTickets = tickets || []

  // ── KPIs ──────────────────────────────────────────────────────────────────────
  const totalInvoiced  = allInvoices.reduce((s, i) => s + n(i.total), 0)
  const totalCollected = allInvoices.filter(i => i.status === 'paid').reduce((s, i) => s + n(i.total), 0)
  const outstanding    = allInvoices.filter(i => i.status === 'sent').reduce((s, i) => s + n(i.total), 0)
  const totalDraft     = allInvoices.filter(i => i.status === 'draft').reduce((s, i) => s + n(i.total), 0)

  const invoicedTicketIds = new Set(
    (junctions || []).filter(j => j.invoices?.status !== 'void').map(j => j.field_ticket_id)
  )
  const wipTickets = allTickets.filter(t => !invoicedTicketIds.has(t.id))
  const wipTotal   = wipTickets.reduce((s, t) => s + n(t.subtotal), 0)

  // ── Invoice aging ─────────────────────────────────────────────────────────────
  const sentInvoices = allInvoices
    .filter(i => i.status === 'sent')
    .map(inv => {
      const due  = inv.due_date ? new Date(inv.due_date) : null
      const days = due ? Math.floor((today - due) / 86400000) : 0
      return { ...inv, daysOverdue: days, bucket: ageBucket(days) }
    })
    .sort((a, b) => b.daysOverdue - a.daysOverdue)

  const agingTotals = AGING_BUCKETS.map(b => ({
    ...b,
    invoices: sentInvoices.filter(i => i.bucket === b.key),
    total:    sentInvoices.filter(i => i.bucket === b.key).reduce((s, i) => s + n(i.total), 0),
  }))

  // ── Monthly revenue (last 6 months) ──────────────────────────────────────────
  const months = Array.from({ length: 6 }, (_, i) => {
    const d = new Date()
    d.setDate(1)
    d.setMonth(d.getMonth() - (5 - i))
    return {
      key:       d.toISOString().slice(0, 7),
      label:     d.toLocaleDateString('en-CA', { month: 'short', year: '2-digit' }),
      invoiced:  0,
      collected: 0,
    }
  })
  allInvoices.forEach(inv => {
    const m = months.find(m => m.key === inv.date?.slice(0, 7))
    if (!m) return
    m.invoiced += n(inv.total)
    if (inv.status === 'paid') m.collected += n(inv.total)
  })
  const maxMonthly = Math.max(...months.map(m => m.invoiced), 1)

  // ── WIP by project ────────────────────────────────────────────────────────────
  const wipByProject = Object.values(
    wipTickets.reduce((acc, t) => {
      const key = t.project_id
      if (!acc[key]) acc[key] = { project: t.projects, tickets: [], total: 0 }
      acc[key].tickets.push(t)
      acc[key].total += n(t.subtotal)
      return acc
    }, {})
  ).sort((a, b) => b.total - a.total)

  // ── Styles ────────────────────────────────────────────────────────────────────
  const kpi = {
    base:  { background: '#fff', borderRadius: '12px', padding: '20px 24px', border: '1px solid var(--line)', boxShadow: '0 1px 4px rgba(0,0,0,0.05)' },
  }

  return (
    <div className="grid">
      <div className="page-header">
        <div className="split">
          <div>
            <h1>Financials</h1>
            <p className="muted">Revenue, outstanding balances &amp; work in progress</p>
          </div>
        </div>
      </div>

      {/* ── KPI strip ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '12px' }}>
        <div style={kpi.base}>
          <div className="label">Total Invoiced</div>
          <div style={{ fontSize: '22px', fontWeight: 800, marginTop: '6px' }}>{money(totalInvoiced)}</div>
          <div className="fine-print">{allInvoices.length} invoice{allInvoices.length !== 1 ? 's' : ''}</div>
        </div>
        <div style={{ ...kpi.base, borderTop: '3px solid #16a34a' }}>
          <div className="label">Collected</div>
          <div style={{ fontSize: '22px', fontWeight: 800, marginTop: '6px', color: '#16a34a' }}>{money(totalCollected)}</div>
          <div className="fine-print">{allInvoices.filter(i => i.status === 'paid').length} paid</div>
        </div>
        <div style={{ ...kpi.base, borderTop: `3px solid ${outstanding > 0 ? '#ca8a04' : '#16a34a'}` }}>
          <div className="label">Outstanding</div>
          <div style={{ fontSize: '22px', fontWeight: 800, marginTop: '6px', color: outstanding > 0 ? '#92400e' : '#16a34a' }}>{money(outstanding)}</div>
          <div className="fine-print">{sentInvoices.length} sent</div>
        </div>
        <div style={{ ...kpi.base, borderTop: '3px solid #94a3b8' }}>
          <div className="label">Draft</div>
          <div style={{ fontSize: '22px', fontWeight: 800, marginTop: '6px', color: '#64748b' }}>{money(totalDraft)}</div>
          <div className="fine-print">{allInvoices.filter(i => i.status === 'draft').length} drafts</div>
        </div>
        <div style={{ ...kpi.base, borderTop: '3px solid #3b82f6' }}>
          <div className="label">WIP — Uninvoiced</div>
          <div style={{ fontSize: '22px', fontWeight: 800, marginTop: '6px', color: '#1d4ed8' }}>{money(wipTotal)}</div>
          <div className="fine-print">{wipTickets.length} approved ticket{wipTickets.length !== 1 ? 's' : ''}</div>
        </div>
      </div>

      {/* ── Charts row ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', alignItems: 'start' }}>

        {/* Monthly revenue bar chart */}
        <section className="panel">
          <h2>Monthly Revenue</h2>
          <p className="muted" style={{ fontSize: '12px', marginBottom: '20px' }}>Last 6 months</p>
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: '8px', height: '140px' }}>
            {months.map(m => (
              <div key={m.key} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0', justifyContent: 'flex-end', height: '100%' }}>
                <div style={{ width: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', height: '120px', position: 'relative' }}>
                  {/* Invoiced bar (background) */}
                  <div
                    title={`Invoiced: ${money(m.invoiced)}`}
                    style={{
                      position: 'absolute', bottom: 0, left: 0, right: 0,
                      height: `${Math.round((m.invoiced / maxMonthly) * 120)}px`,
                      background: '#d1d5db', borderRadius: '4px 4px 0 0',
                      minHeight: m.invoiced > 0 ? '4px' : '0',
                    }}
                  />
                  {/* Collected bar (foreground) */}
                  <div
                    title={`Collected: ${money(m.collected)}`}
                    style={{
                      position: 'absolute', bottom: 0, left: '20%', right: '20%',
                      height: `${Math.round((m.collected / maxMonthly) * 120)}px`,
                      background: '#374151', borderRadius: '4px 4px 0 0',
                      minHeight: m.collected > 0 ? '4px' : '0',
                    }}
                  />
                </div>
                <div style={{ fontSize: '10px', color: 'var(--muted)', marginTop: '5px', whiteSpace: 'nowrap' }}>{m.label}</div>
                <div style={{ fontSize: '9px', color: 'var(--muted)', fontWeight: 600 }}>{m.invoiced > 0 ? money(m.invoiced).replace('CA', '').replace('$', '$') : ''}</div>
              </div>
            ))}
          </div>
          <div style={{ display: 'flex', gap: '14px', fontSize: '11px', marginTop: '12px', color: 'var(--muted)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
              <div style={{ width: '12px', height: '12px', background: '#d1d5db', borderRadius: '2px' }} /> Invoiced
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
              <div style={{ width: '12px', height: '12px', background: '#374151', borderRadius: '2px' }} /> Collected
            </div>
          </div>
        </section>

        {/* Invoice aging bars */}
        <section className="panel">
          <h2>Invoice Aging</h2>
          <p className="muted" style={{ fontSize: '12px', marginBottom: '20px' }}>Sent invoices by days overdue</p>
          {!sentInvoices.length ? (
            <p className="muted" style={{ fontSize: '13px' }}>No outstanding invoices — all clear!</p>
          ) : (
            <>
              <div style={{ display: 'grid', gap: '12px' }}>
                {agingTotals.map(b => (
                  <div key={b.key} style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{ width: '88px', fontSize: '12px', fontWeight: 600, color: b.total > 0 ? b.color : '#cbd5e1' }}>
                      {b.label}
                    </div>
                    <div style={{ flex: 1, background: '#f1f5f9', borderRadius: '4px', height: '18px', overflow: 'hidden' }}>
                      <div style={{
                        width: `${outstanding > 0 ? (b.total / outstanding) * 100 : 0}%`,
                        height: '100%', background: b.color, borderRadius: '4px',
                        opacity: b.total > 0 ? 1 : 0,
                        transition: 'width 0.3s',
                      }} />
                    </div>
                    <div style={{ width: '95px', textAlign: 'right', fontSize: '13px', fontWeight: 700 }}>
                      {b.total > 0 ? money(b.total) : <span style={{ color: '#cbd5e1' }}>—</span>}
                    </div>
                    <div style={{ width: '28px', textAlign: 'right', fontSize: '11px', color: 'var(--muted)' }}>
                      {b.invoices.length > 0 ? `×${b.invoices.length}` : ''}
                    </div>
                  </div>
                ))}
              </div>
              <div style={{ borderTop: '2px solid var(--line)', marginTop: '14px', paddingTop: '12px', display: 'flex', justifyContent: 'space-between', fontWeight: 700, fontSize: '14px' }}>
                <span>Total Outstanding</span><span>{money(outstanding)}</span>
              </div>
            </>
          )}
        </section>
      </div>

      {/* ── Outstanding invoices table ── */}
      {sentInvoices.length > 0 && (
        <section className="panel">
          <h2>Outstanding Invoices</h2>
          <div className="table-wrap" style={{ marginTop: '12px' }}>
            <table>
              <thead>
                <tr>
                  <th>Invoice #</th>
                  <th>Client</th>
                  <th>Project</th>
                  <th>Invoiced</th>
                  <th>Due</th>
                  <th>Age</th>
                  <th className="numeric">Amount</th>
                </tr>
              </thead>
              <tbody>
                {sentInvoices.map(inv => {
                  const bucket = AGING_BUCKETS[inv.bucket]
                  return (
                    <tr key={inv.id}>
                      <td><Link href={`/invoices/${inv.id}`}><strong>{inv.invoice_number}</strong></Link></td>
                      <td>{inv.projects?.client_name || '—'}</td>
                      <td>{inv.projects?.name || '—'}</td>
                      <td>{formatDate(inv.date)}</td>
                      <td>{formatDate(inv.due_date)}</td>
                      <td>
                        <span style={{
                          fontSize: '11px', fontWeight: 700, padding: '2px 8px', borderRadius: '4px',
                          background: '#f4f4f5', color: '#52525b', border: '1px solid #e4e4e7',
                        }}>
                          {inv.daysOverdue <= 0 ? 'Current' : `${inv.daysOverdue}d overdue`}
                        </span>
                      </td>
                      <td className="numeric"><strong>{money(inv.total)}</strong></td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* ── WIP Panel ── */}
      <section className="panel">
        <div className="split" style={{ marginBottom: '14px' }}>
          <div>
            <h2>Work in Progress</h2>
            <p className="muted" style={{ fontSize: '12px', marginTop: '2px' }}>
              Approved field tickets not yet invoiced
            </p>
          </div>
          {wipTickets.length > 0 && (
            <Link href="/invoices/new"><button className="primary small">+ New Invoice</button></Link>
          )}
        </div>

        {!wipTickets.length ? (
          <p className="muted" style={{ fontSize: '13px' }}>
            All approved tickets have been invoiced.
          </p>
        ) : (
          <div style={{ display: 'grid', gap: '20px' }}>
            {wipByProject.map(({ project, tickets: pts, total }) => (
              <div key={pts[0]?.project_id}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px', padding: '8px 0', borderBottom: '2px solid var(--line)' }}>
                  <div>
                    <strong style={{ fontSize: '14px' }}>{project?.name || 'Unknown project'}</strong>
                    {project?.client_name && (
                      <span className="muted" style={{ fontSize: '12px', marginLeft: '10px' }}>{project.client_name}</span>
                    )}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <strong style={{ fontSize: '16px' }}>{money(total)}</strong>
                    <Link href={`/invoices/new?project=${pts[0]?.project_id}`}>
                      <button className="small primary">Invoice →</button>
                    </Link>
                  </div>
                </div>
                <div className="table-wrap">
                  <table>
                    <thead>
                      <tr>
                        <th>Ticket #</th>
                        <th>Date</th>
                        <th>Area</th>
                        <th>Description</th>
                        <th className="numeric">Amount</th>
                      </tr>
                    </thead>
                    <tbody>
                      {pts.map(t => (
                        <tr key={t.id}>
                          <td><Link href={`/field-tickets/${t.id}`}><strong>{t.ticket_number}</strong></Link></td>
                          <td>{formatDate(t.date)}</td>
                          <td>{t.section_number ? `Area ${t.section_number}` : '—'}</td>
                          <td>{t.description || '—'}</td>
                          <td className="numeric">{money(t.subtotal)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
