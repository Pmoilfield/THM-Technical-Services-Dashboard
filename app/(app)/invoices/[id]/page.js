import { createServerSupabase } from '@/lib/supabase-server'
import { money, statusClass, formatDate, n } from '@/lib/calculations'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import InvoiceActions from '@/components/invoices/InvoiceActions'

export default async function InvoicePage({ params }) {
  const supabase = await createServerSupabase()
  const { id } = await params

  const [{ data: invoice }, { data: invoiceTickets }] = await Promise.all([
    supabase.from('invoices').select('*, projects(name, client_name, client_job_no, client_po_number)').eq('id', id).single(),
    supabase.from('invoice_tickets').select('*, field_tickets(id, ticket_number, date, description, section_number, subtotal, status)').eq('invoice_id', id).order('created_at'),
  ])

  if (!invoice) notFound()

  const tickets = (invoiceTickets || []).map(it => it.field_tickets).filter(Boolean)

  return (
    <div className="grid">
      <div className="page-header">
        <div className="split">
          <div>
            <h1>{invoice.invoice_number}</h1>
            <p className="muted">{invoice.projects?.name} · {invoice.projects?.client_name}</p>
          </div>
          <div className="toolbar">
            <span className={`status-pill ${statusClass(invoice.status)}`}>{invoice.status}</span>
            <InvoiceActions invoice={invoice} />
            <a href={`/print/invoice/${id}`} target="_blank" rel="noreferrer">
              <button>Print / PDF</button>
            </a>
          </div>
        </div>
      </div>

      <div className="grid two">
        <section className="panel">
          <h2>Invoice details</h2>
          <div className="grid two" style={{ marginTop: '12px', fontSize: '14px', gap: '12px' }}>
            <div><div className="label">Client</div>{invoice.projects?.client_name || '—'}</div>
            <div><div className="label">Project</div>{invoice.projects?.name || '—'}</div>
            <div><div className="label">Invoice date</div>{formatDate(invoice.date)}</div>
            <div><div className="label">Due date</div>{formatDate(invoice.due_date)}</div>
            <div><div className="label">Terms</div>Net 30</div>
            <div><div className="label">Status</div><span className={`status-pill ${statusClass(invoice.status)}`}>{invoice.status}</span></div>
            {invoice.projects?.client_job_no && (
              <div><div className="label">Client Job #</div>{invoice.projects.client_job_no}</div>
            )}
            {invoice.projects?.client_po_number && (
              <div><div className="label">Client PO #</div>{invoice.projects.client_po_number}</div>
            )}
          </div>
          {invoice.notes && (
            <p style={{ marginTop: '14px', fontSize: '14px', color: 'var(--muted)', borderTop: '1px solid var(--line)', paddingTop: '12px' }}>
              {invoice.notes}
            </p>
          )}
        </section>

        <section className="panel">
          <h2>Summary</h2>
          <div style={{ marginTop: '12px' }}>
            <div className="split" style={{ padding: '8px 0', borderBottom: '1px solid var(--line)', fontSize: '14px' }}>
              <span>Subtotal</span><strong>{money(invoice.subtotal)}</strong>
            </div>
            <div className="split" style={{ padding: '8px 0', borderBottom: '1px solid var(--line)', fontSize: '14px' }}>
              <span>GST ({(n(invoice.gst_rate) * 100).toFixed(0)}%)</span><strong>{money(invoice.gst_amount)}</strong>
            </div>
            <div className="split" style={{ padding: '12px 0' }}>
              <span style={{ fontWeight: 700, fontSize: '16px' }}>Total</span>
              <strong style={{ fontSize: '26px' }}>{money(invoice.total)}</strong>
            </div>
          </div>
        </section>
      </div>

      <section className="panel">
        <h2>Included field tickets</h2>
        <div className="table-wrap" style={{ marginTop: '12px' }}>
          <table>
            <thead>
              <tr>
                <th>Ticket #</th>
                <th>Date</th>
                <th>Area</th>
                <th>Description</th>
                <th>Status</th>
                <th className="numeric">Amount</th>
              </tr>
            </thead>
            <tbody>
              {tickets.map(t => (
                <tr key={t.id}>
                  <td><Link href={`/field-tickets/${t.id}`}><strong>{t.ticket_number}</strong></Link></td>
                  <td>{formatDate(t.date)}</td>
                  <td>{t.section_number ? `Area ${t.section_number}` : '—'}</td>
                  <td>{t.description || '—'}</td>
                  <td><span className={`status-pill ${statusClass(t.status)}`}>{t.status}</span></td>
                  <td className="numeric">{money(t.subtotal)}</td>
                </tr>
              ))}
              {!tickets.length && (
                <tr><td colSpan="6" className="empty">No tickets on this invoice.</td></tr>
              )}
              {tickets.length > 0 && (
                <tr style={{ fontWeight: 700, borderTop: '2px solid var(--line)' }}>
                  <td colSpan="5">Subtotal</td>
                  <td className="numeric">{money(invoice.subtotal)}</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  )
}
