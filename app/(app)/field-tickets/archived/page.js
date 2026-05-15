import { createServerSupabase } from '@/lib/supabase-server'
import { money, statusClass, formatDate } from '@/lib/calculations'
import Link from 'next/link'

export default async function ArchivedFieldTicketsPage() {
  const supabase = await createServerSupabase()
  const { data: allTickets } = await supabase
    .from('field_tickets')
    .select('*, projects(name, archived)')
    .order('created_at', { ascending: false })

  // Only tickets belonging to archived projects
  const tickets = (allTickets || []).filter(t => t.projects?.archived)

  const counts = { draft: 0, submitted: 0, approved: 0, rejected: 0, invoiced: 0 }
  tickets.forEach(t => { counts[t.status] = (counts[t.status] || 0) + 1 })

  return (
    <div className="grid">
      <div className="page-header">
        <div className="split">
          <div><h1>Archived Field Tickets</h1><p className="muted">{tickets.length} tickets from archived projects</p></div>
          <Link href="/field-tickets"><button>Back to field tickets</button></Link>
        </div>
      </div>

      <div className="cards" style={{ gridTemplateColumns: 'repeat(5, minmax(120px, 1fr))' }}>
        {Object.entries(counts).map(([status, count]) => (
          <div key={status} className="card">
            <div className="label">{status}</div>
            <div className="value">{count}</div>
          </div>
        ))}
      </div>

      <section className="panel">
        <div className="table-wrap">
          <table>
            <thead>
              <tr><th>Ticket #</th><th>Project</th><th>Date</th><th>Status</th><th className="numeric">Labour</th><th className="numeric">Equipment</th><th className="numeric">Material</th><th className="numeric">Total</th><th></th></tr>
            </thead>
            <tbody>
              {tickets.length ? tickets.map(ticket => (
                <tr key={ticket.id}>
                  <td><strong>{ticket.ticket_number}</strong></td>
                  <td>{ticket.projects?.name || '—'}</td>
                  <td>{formatDate(ticket.date)}</td>
                  <td><span className={`status-pill ${statusClass(ticket.status)}`}>{ticket.status}</span></td>
                  <td className="numeric">{money(ticket.labour_total)}</td>
                  <td className="numeric">{money(ticket.equipment_total)}</td>
                  <td className="numeric">{money(ticket.material_total)}</td>
                  <td className="numeric"><strong>{money(ticket.subtotal)}</strong></td>
                  <td><Link href={`/field-tickets/${ticket.id}`}><button className="small">Open</button></Link></td>
                </tr>
              )) : (
                <tr><td colSpan="9" className="empty">No archived field tickets.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  )
}
