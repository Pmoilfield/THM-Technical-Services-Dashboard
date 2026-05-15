import { createServerSupabase } from '@/lib/supabase-server'
import { money, formatDate } from '@/lib/calculations'
import Link from 'next/link'

export default async function ArchivedPurchaseOrdersPage() {
  const supabase = await createServerSupabase()
  const { data: allPOs } = await supabase
    .from('purchase_orders')
    .select('*, projects(name, archived)')
    .order('date', { ascending: false })

  // Only POs belonging to archived projects
  const pos = (allPOs || []).filter(p => p.projects?.archived)

  const openCount = pos.filter(p => p.status === 'Open').length
  const closedCount = pos.filter(p => p.status === 'Closed').length
  const totalValue = pos.reduce((s, p) => s + (Number(p.value) || 0), 0)

  return (
    <div className="grid">
      <div className="page-header">
        <div className="split">
          <div><h1>Archived Purchase Orders</h1><p className="muted">{pos.length} POs from archived projects</p></div>
          <Link href="/purchase-orders"><button>Back to purchase orders</button></Link>
        </div>
      </div>

      <div className="cards" style={{ gridTemplateColumns: 'repeat(3, minmax(140px, 1fr))' }}>
        <div className="card">
          <div className="label">Open</div>
          <div className="value">{openCount}</div>
        </div>
        <div className="card">
          <div className="label">Closed</div>
          <div className="value">{closedCount}</div>
        </div>
        <div className="card">
          <div className="label">Total Value</div>
          <div className="value">{money(totalValue)}</div>
        </div>
      </div>

      <section className="panel">
        <div className="table-wrap">
          <table>
            <thead>
              <tr><th>PO #</th><th>Project</th><th>Vendor</th><th>Date</th><th>Status</th><th>Description</th><th className="numeric">Value</th></tr>
            </thead>
            <tbody>
              {pos.length ? pos.map(po => (
                <tr key={po.id}>
                  <td><strong>{po.po_number || '—'}</strong></td>
                  <td><Link href={`/projects/${po.project_id}`}>{po.projects?.name || '—'}</Link></td>
                  <td>{po.vendor || '—'}</td>
                  <td>{formatDate(po.date)}</td>
                  <td><span className={`status-pill ${po.status === 'Open' ? 'status-active' : 'status-complete'}`}>{po.status}</span></td>
                  <td className="fine-print">{po.description || '—'}</td>
                  <td className="numeric"><strong>{money(po.value)}</strong></td>
                </tr>
              )) : (
                <tr><td colSpan="7" className="empty">No archived purchase orders.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  )
}
