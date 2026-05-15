import { createAdminSupabase } from '@/lib/supabase-server'
import { notFound } from 'next/navigation'
import PrintTrigger from '@/components/estimate/PrintTrigger'

function n(v) { return parseFloat(v) || 0 }
function money(v) { return '$' + n(v).toLocaleString('en-CA', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) }
function fmtDate(d) { if (!d) return '—'; return new Date(d + 'T00:00:00').toLocaleDateString('en-CA', { year: 'numeric', month: 'long', day: 'numeric' }) }

export default async function FieldTicketPrintPage({ params }) {
  const { id } = await params
  const supabase = createAdminSupabase()

  const [{ data: ticket }, { data: items }] = await Promise.all([
    supabase.from('field_tickets').select('*, projects(name, client_name, client_job_no, client_po_number, location), profiles!created_by(full_name)').eq('id', id).single(),
    supabase.from('field_ticket_items').select('*').eq('ticket_id', id).order('sort_order'),
  ])

  if (!ticket) notFound()

  const labourItems    = (items || []).filter(i => i.type === 'Labour')
  const equipmentItems = (items || []).filter(i => i.type === 'Equipment')
  const materialItems  = (items || []).filter(i => i.type === 'Material')
  const subItems       = (items || []).filter(i => i.type === 'Subcontractor')

  const today = new Date().toLocaleDateString('en-CA', { year: 'numeric', month: 'long', day: 'numeric' })
  const th = { padding: '3px 8px', fontSize: '8px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', background: '#f1f5f9', borderBottom: '1px solid #e2e8f0', WebkitPrintColorAdjust: 'exact', printColorAdjust: 'exact' }
  const td = { padding: '3px 8px', fontSize: '9px', borderBottom: '1px solid #f1f5f9', verticalAlign: 'top' }

  const PERIOD_LABEL = { hourly: 'hr', daily: 'day', weekly: 'wk', monthly: 'mo' }

  return (
    <>
      <PrintTrigger />
      <style>{`
        * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; box-sizing: border-box; }
        @media print { @page { margin: 10mm; } body { font-size: 9px; } }
      `}</style>
      <div style={{ fontFamily: 'Arial, sans-serif', color: '#111', maxWidth: '960px', margin: '0 auto', padding: '14px 18px' }}>

        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px', borderBottom: '2px solid #b91c1c', paddingBottom: '8px' }}>
          <div>
            <div style={{ fontSize: '18px', fontWeight: 800, color: '#b91c1c', letterSpacing: '-0.5px' }}>THM Technical Services</div>
            <div style={{ fontSize: '9px', color: '#64748b' }}>Partnership. Precision. Results.</div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '15px', fontWeight: 700 }}>Field Ticket</div>
            <div style={{ fontSize: '11px', fontWeight: 700, color: '#1e293b' }}>{ticket.ticket_number}</div>
            <div style={{ fontSize: '9px', color: '#64748b', marginTop: '2px' }}>Printed: {today}</div>
          </div>
        </div>

        {/* Ticket info */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '3px 32px', marginBottom: '10px', fontSize: '9px' }}>
          <div><span style={{ color: '#64748b', fontWeight: 600 }}>Project: </span>{ticket.projects?.name || '—'}</div>
          <div><span style={{ color: '#64748b', fontWeight: 600 }}>Client: </span>{ticket.projects?.client_name || '—'}</div>
          <div><span style={{ color: '#64748b', fontWeight: 600 }}>Date: </span>{fmtDate(ticket.date)}</div>
          <div><span style={{ color: '#64748b', fontWeight: 600 }}>Status: </span>{ticket.status}</div>
          {ticket.section_number && <div><span style={{ color: '#64748b', fontWeight: 600 }}>Area / Section: </span>{ticket.section_number}</div>}
          {ticket.profiles?.full_name && <div><span style={{ color: '#64748b', fontWeight: 600 }}>Submitted by: </span>{ticket.profiles.full_name}</div>}
          {ticket.projects?.client_job_no && <div><span style={{ color: '#64748b', fontWeight: 600 }}>Client Job #: </span>{ticket.projects.client_job_no}</div>}
          {ticket.projects?.client_po_number && <div><span style={{ color: '#64748b', fontWeight: 600 }}>Client PO #: </span>{ticket.projects.client_po_number}</div>}
          {ticket.description && <div style={{ gridColumn: '1 / -1', marginTop: '2px' }}><span style={{ color: '#64748b', fontWeight: 600 }}>Work performed: </span>{ticket.description}</div>}
        </div>

        {/* Labour */}
        {labourItems.length > 0 && (
          <div style={{ marginBottom: '8px' }}>
            <div style={{ background: '#1e293b', color: '#fff', padding: '3px 8px', fontSize: '9px', fontWeight: 700, borderRadius: '3px 3px 0 0', WebkitPrintColorAdjust: 'exact', printColorAdjust: 'exact' }}>Labour</div>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ WebkitPrintColorAdjust: 'exact', printColorAdjust: 'exact' }}>
                  <th style={{ ...th, textAlign: 'left', width: '22%' }}>Worker</th>
                  <th style={{ ...th, textAlign: 'left' }}>Role</th>
                  <th style={{ ...th, textAlign: 'center' }}>Travel Hrs</th>
                  <th style={{ ...th, textAlign: 'center' }}>ST Hrs</th>
                  <th style={{ ...th, textAlign: 'right' }}>ST Rate</th>
                  <th style={{ ...th, textAlign: 'center' }}>OT Hrs</th>
                  <th style={{ ...th, textAlign: 'right' }}>OT Rate</th>
                  <th style={{ ...th, textAlign: 'right' }}>Total</th>
                </tr>
              </thead>
              <tbody>
                {labourItems.map(item => (
                  <tr key={item.id}>
                    <td style={td}>{item.worker_name || '—'}</td>
                    <td style={td}>{item.role || '—'}</td>
                    <td style={{ ...td, textAlign: 'center' }}>{n(item.travel_hours) || '—'}</td>
                    <td style={{ ...td, textAlign: 'center' }}>{n(item.straight_hours)}</td>
                    <td style={{ ...td, textAlign: 'right' }}>{money(item.straight_rate)}</td>
                    <td style={{ ...td, textAlign: 'center' }}>{n(item.overtime_hours) || '—'}</td>
                    <td style={{ ...td, textAlign: 'right' }}>{item.overtime_rate ? money(item.overtime_rate) : '—'}</td>
                    <td style={{ ...td, textAlign: 'right', fontWeight: 600 }}>{money(item.total)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Equipment */}
        {equipmentItems.length > 0 && (
          <div style={{ marginBottom: '8px' }}>
            <div style={{ background: '#1e293b', color: '#fff', padding: '3px 8px', fontSize: '9px', fontWeight: 700, borderRadius: '3px 3px 0 0', WebkitPrintColorAdjust: 'exact', printColorAdjust: 'exact' }}>Equipment</div>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ WebkitPrintColorAdjust: 'exact', printColorAdjust: 'exact' }}>
                  <th style={{ ...th, textAlign: 'left' }}>Description</th>
                  <th style={{ ...th, textAlign: 'center' }}>Period</th>
                  <th style={{ ...th, textAlign: 'center' }}>Qty</th>
                  <th style={{ ...th, textAlign: 'right' }}>Rate</th>
                  <th style={{ ...th, textAlign: 'right' }}>Total</th>
                </tr>
              </thead>
              <tbody>
                {equipmentItems.map(item => (
                  <tr key={item.id}>
                    <td style={td}>{item.description || '—'}</td>
                    <td style={{ ...td, textAlign: 'center' }}>{PERIOD_LABEL[item.equip_period] || 'day'}</td>
                    <td style={{ ...td, textAlign: 'center' }}>{n(item.quantity)}</td>
                    <td style={{ ...td, textAlign: 'right' }}>{money(item.unit_cost)}</td>
                    <td style={{ ...td, textAlign: 'right', fontWeight: 600 }}>{money(item.total)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Material */}
        {materialItems.length > 0 && (
          <div style={{ marginBottom: '8px' }}>
            <div style={{ background: '#1e293b', color: '#fff', padding: '3px 8px', fontSize: '9px', fontWeight: 700, borderRadius: '3px 3px 0 0', WebkitPrintColorAdjust: 'exact', printColorAdjust: 'exact' }}>Material</div>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ WebkitPrintColorAdjust: 'exact', printColorAdjust: 'exact' }}>
                  <th style={{ ...th, textAlign: 'left', width: '20%' }}>Vendor</th>
                  <th style={{ ...th, textAlign: 'left' }}>Description</th>
                  <th style={{ ...th, textAlign: 'center' }}>Qty</th>
                  <th style={{ ...th, textAlign: 'right' }}>Unit Cost</th>
                  <th style={{ ...th, textAlign: 'right' }}>Markup</th>
                  <th style={{ ...th, textAlign: 'right' }}>Total</th>
                </tr>
              </thead>
              <tbody>
                {materialItems.map(item => (
                  <tr key={item.id}>
                    <td style={td}>{item.vendor || '—'}</td>
                    <td style={td}>{item.description || '—'}</td>
                    <td style={{ ...td, textAlign: 'center' }}>{n(item.quantity)}</td>
                    <td style={{ ...td, textAlign: 'right' }}>{money(item.unit_cost)}</td>
                    <td style={{ ...td, textAlign: 'right' }}>{item.markup ? `${(n(item.markup) * 100).toFixed(0)}%` : '—'}</td>
                    <td style={{ ...td, textAlign: 'right', fontWeight: 600 }}>{money(item.total)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Subcontractor */}
        {subItems.length > 0 && (
          <div style={{ marginBottom: '8px' }}>
            <div style={{ background: '#1e293b', color: '#fff', padding: '3px 8px', fontSize: '9px', fontWeight: 700, borderRadius: '3px 3px 0 0', WebkitPrintColorAdjust: 'exact', printColorAdjust: 'exact' }}>Subcontractor</div>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ WebkitPrintColorAdjust: 'exact', printColorAdjust: 'exact' }}>
                  <th style={{ ...th, textAlign: 'left' }}>Description</th>
                  <th style={{ ...th, textAlign: 'right' }}>Total</th>
                </tr>
              </thead>
              <tbody>
                {subItems.map(item => (
                  <tr key={item.id}>
                    <td style={td}>{item.description || '—'}</td>
                    <td style={{ ...td, textAlign: 'right', fontWeight: 600 }}>{money(item.total)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Totals */}
        <div style={{ marginTop: '10px', borderTop: '2px solid #1e293b', paddingTop: '6px', width: '260px', marginLeft: 'auto' }}>
          {[['Labour', ticket.labour_total], ['Equipment', ticket.equipment_total], ['Material', ticket.material_total], ['Subcontractor', ticket.subcontractor_total]].filter(([, v]) => n(v) > 0).map(([label, val]) => (
            <div key={label} style={{ display: 'flex', justifyContent: 'space-between', padding: '2px 0', fontSize: '9px' }}>
              <span>{label}</span><span>{money(val)}</span>
            </div>
          ))}
          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '5px 0', fontSize: '13px', fontWeight: 800, borderTop: '1px solid #e2e8f0', marginTop: '4px' }}>
            <span>Subtotal</span><span>{money(ticket.subtotal)}</span>
          </div>
        </div>

        {/* Signature block */}
        <div style={{ marginTop: '24px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '32px', fontSize: '9px' }}>
          <div>
            <div style={{ borderBottom: '1px solid #1e293b', marginBottom: '3px', height: '24px' }} />
            <div style={{ color: '#64748b' }}>THM Representative / Date</div>
          </div>
          <div>
            <div style={{ borderBottom: '1px solid #1e293b', marginBottom: '3px', height: '24px' }} />
            <div style={{ color: '#64748b' }}>Client Representative / Date</div>
          </div>
        </div>

        {/* Footer */}
        <div style={{ marginTop: '12px', borderTop: '1px solid #e2e8f0', paddingTop: '6px', fontSize: '8px', color: '#94a3b8', textAlign: 'center' }}>
          THM Technical Services · {ticket.ticket_number} · Generated {today}
        </div>
      </div>
    </>
  )
}
