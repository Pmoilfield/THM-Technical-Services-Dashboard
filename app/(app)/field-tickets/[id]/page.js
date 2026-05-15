import { createServerSupabase } from '@/lib/supabase-server'
import { money, statusClass, formatDate, ticketItemTotal } from '@/lib/calculations'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import TicketActions from '@/components/field-tickets/TicketActions'

export default async function FieldTicketPage({ params }) {
  const supabase = await createServerSupabase()
  const { id } = await params

  const [{ data: ticket }, { data: items }] = await Promise.all([
    supabase.from('field_tickets').select('*, projects(name, client_name), profiles!created_by(full_name)').eq('id', id).single(),
    supabase.from('field_ticket_items').select('*').eq('ticket_id', id).order('sort_order'),
  ])

  if (!ticket) notFound()

  const labourItems = (items || []).filter(i => i.type === 'Labour')
  const equipmentItems = (items || []).filter(i => i.type === 'Equipment')
  const materialItems = (items || []).filter(i => i.type === 'Material')
  const subItems = (items || []).filter(i => i.type === 'Subcontractor')

  function ItemTable({ label, rows, cols }) {
    if (!rows.length) return null
    return (
      <div style={{ marginBottom: '16px' }}>
        <h3 style={{ fontSize: '13px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--muted)', marginBottom: '8px' }}>{label}</h3>
        <div className="table-wrap">
          <table>
            <thead><tr>{cols.map(c => <th key={c.key} className={c.num ? 'numeric' : ''}>{c.label}</th>)}</tr></thead>
            <tbody>
              {rows.map(item => (
                <tr key={item.id}>
                  {cols.map(c => <td key={c.key} className={c.num ? 'numeric' : ''}>{c.render ? c.render(item) : item[c.key]}</td>)}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    )
  }

  return (
    <div className="grid">
      <div className="page-header">
        <div className="split">
          <div>
            <h1>{ticket.ticket_number}</h1>
            <p className="muted">{ticket.projects?.name} · {formatDate(ticket.date)}</p>
          </div>
          <div className="toolbar">
            <span className={`status-pill ${statusClass(ticket.status)}`}>{ticket.status}</span>
            {['draft', 'rejected'].includes(ticket.status) && (
              <Link href={`/field-tickets/${ticket.id}/edit`}><button>Edit</button></Link>
            )}
            <TicketActions ticket={ticket} />
          </div>
        </div>
      </div>

      <div className="grid two">
        <section className="panel">
          <h2>Ticket details</h2>
          <div className="grid two" style={{ marginTop: '12px', fontSize: '14px' }}>
            <div><div className="label">Client</div>{ticket.projects?.client_name || '—'}</div>
            <div><div className="label">Project</div>{ticket.projects?.name || '—'}</div>
            <div><div className="label">Date</div>{formatDate(ticket.date)}</div>
            <div><div className="label">Area / Section</div>{ticket.section_number ? `Area ${ticket.section_number}` : '—'}</div>
            <div><div className="label">Created by</div>{ticket.profiles?.full_name || '—'}</div>
            <div><div className="label">Status</div><span className={`status-pill ${statusClass(ticket.status)}`}>{ticket.status}</span></div>
          </div>
          {ticket.description && <p style={{ marginTop: '12px', fontSize: '14px' }}>{ticket.description}</p>}
          {ticket.status === 'rejected' && ticket.rejection_reason && (
            <div style={{ marginTop: '12px', padding: '10px 14px', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '8px', fontSize: '13px' }}>
              <div style={{ fontWeight: 600, color: '#b91c1c', marginBottom: '4px' }}>Rejection reason</div>
              <div style={{ color: '#7f1d1d' }}>{ticket.rejection_reason}</div>
            </div>
          )}
        </section>

        <section className="panel">
          <h2>Totals</h2>
          <div className="grid two" style={{ marginTop: '12px' }}>
            {[['Labour', ticket.labour_total], ['Equipment', ticket.equipment_total], ['Material', ticket.material_total], ['Subcontractor', ticket.subcontractor_total]].map(([label, val]) => (
              <div key={label}><div className="label">{label}</div><div style={{ fontSize: '18px', fontWeight: 700 }}>{money(val)}</div></div>
            ))}
          </div>
          <div style={{ borderTop: '2px solid var(--line)', marginTop: '14px', paddingTop: '14px' }}>
            <div className="label">Subtotal</div>
            <div style={{ fontSize: '28px', fontWeight: 800 }}>{money(ticket.subtotal)}</div>
          </div>
        </section>
      </div>

      <section className="panel">
        <h2>Line items</h2>
        <div style={{ marginTop: '14px' }}>
          <ItemTable label="Labour" rows={labourItems} cols={[
            { key: 'worker_name', label: 'Worker' },
            { key: 'role', label: 'Role' },
            { key: 'travel_hours', label: 'Travel Hrs', num: true, render: i => i.travel_hours ? Number(i.travel_hours) : '—' },
            { key: 'straight_hours', label: 'ST Hrs', num: true },
            { key: 'straight_rate', label: 'ST Rate', num: true, render: i => `$${Number(i.straight_rate).toFixed(2)}` },
            { key: 'overtime_hours', label: 'OT Hrs', num: true, render: i => i.overtime_hours ? Number(i.overtime_hours) : '—' },
            { key: 'overtime_rate', label: 'OT Rate', num: true, render: i => i.overtime_rate ? `$${Number(i.overtime_rate).toFixed(2)}` : '—' },
            { key: 'total', label: 'Total', num: true, render: i => money(i.total) },
          ]} />
          <ItemTable label="Equipment" rows={equipmentItems} cols={[
            { key: 'description', label: 'Description' },
            { key: 'equip_period', label: 'Period', render: i => ({ hourly: 'Hourly', daily: 'Daily', weekly: 'Weekly', monthly: 'Monthly' })[i.equip_period] || 'Daily' },
            { key: 'quantity', label: 'Qty', num: true },
            { key: 'unit_cost', label: 'Rate', num: true, render: i => `$${Number(i.unit_cost).toFixed(2)}` },
            { key: 'total', label: 'Total', num: true, render: i => money(i.total) },
          ]} />
          <ItemTable label="Material" rows={materialItems} cols={[
            { key: 'description', label: 'Description' },
            { key: 'quantity', label: 'Qty', num: true },
            { key: 'unit_cost', label: 'Unit cost', num: true, render: i => `$${Number(i.unit_cost).toFixed(2)}` },
            { key: 'total', label: 'Total', num: true, render: i => money(i.total) },
            { key: 'quote_url', label: 'Receipt', render: i => i.quote_url ? <a href={i.quote_url} target="_blank" rel="noreferrer" style={{ fontSize: '12px' }}>{i.quote_filename || 'View'}</a> : '—' },
          ]} />
          <ItemTable label="Subcontractor" rows={subItems} cols={[
            { key: 'description', label: 'Description' },
            { key: 'total', label: 'Total', num: true, render: i => money(i.total) },
          ]} />
          {!(items || []).length && <p className="empty">No line items on this ticket.</p>}
        </div>
      </section>
    </div>
  )
}
