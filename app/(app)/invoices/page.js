import { createServerSupabase } from '@/lib/supabase-server'
import { money, statusClass, formatDate } from '@/lib/calculations'
import Link from 'next/link'

export default async function InvoicesPage() {
  const supabase = await createServerSupabase()
  const { data: invoices } = await supabase
    .from('invoices')
    .select('*, projects(name)')
    .order('created_at', { ascending: false })

  return (
    <div className="grid">
      <div className="page-header">
        <div className="split">
          <div><h1>Invoices</h1><p className="muted">{(invoices || []).length} invoices</p></div>
          <Link href="/invoices/new"><button className="primary">+ New Invoice</button></Link>
        </div>
      </div>

      <section className="panel">
        <div className="table-wrap">
          <table>
            <thead>
              <tr><th>Invoice #</th><th>Project</th><th>Date</th><th>Due</th><th>Status</th><th className="numeric">Subtotal</th><th className="numeric">GST</th><th className="numeric">Total</th><th></th></tr>
            </thead>
            <tbody>
              {(invoices || []).length ? (invoices || []).map(inv => (
                <tr key={inv.id}>
                  <td><strong>{inv.invoice_number}</strong></td>
                  <td>{inv.projects?.name || 'â€"'}</td>
                  <td>{formatDate(inv.date)}</td>
                  <td>{formatDate(inv.due_date)}</td>
                  <td><span className={`status-pill ${statusClass(inv.status)}`}>{inv.status}</span></td>
                  <td className="numeric">{money(inv.subtotal)}</td>
                  <td className="numeric">{money(inv.gst_amount)}</td>
                  <td className="numeric"><strong>{money(inv.total)}</strong></td>
                  <td><Link href={`/invoices/${inv.id}`}><button className="small primary">Open</button></Link></td>
                </tr>
              )) : (
                <tr><td colSpan="9" className="empty">No invoices yet. <Link href="/invoices/new">Create your first â†'</Link></td></tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  )
}

