import { createAdminSupabase } from '@/lib/supabase-server'
import { notFound } from 'next/navigation'
import PrintTrigger from '@/components/estimate/PrintTrigger'

const ITEM_TYPES = ['Labour', 'Equipment', 'Third Party']

function n(v) { return parseFloat(v) || 0 }
function money(v) { return '$' + n(v).toLocaleString('en-CA', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) }

function calcItemTotal(item) {
  if (item.type === 'Labour') {
    const reg = n(item.reg_hours) * n(item.reg_rate) * (n(item.days) || 1)
    const ot = n(item.ot_hours) * n(item.ot_rate) * (n(item.days) || 1)
    return (reg + ot) * (1 + n(item.markup))
  }
  if (item.type === 'Equipment') {
    return n(item.qty) * n(item.reg_rate) * (n(item.days) || 1) * (1 + n(item.markup))
  }
  return n(item.cost) * (1 + n(item.markup))
}

export default async function EstimatePrintPage({ params }) {
  const { id } = await params
  const supabase = createAdminSupabase()

  const [{ data: project }, { data: sections }, { data: items }] = await Promise.all([
    supabase.from('projects').select('*').eq('id', id).single(),
    supabase.from('estimate_sections').select('*').eq('project_id', id).order('number'),
    supabase.from('estimate_items').select('*').order('sort_order'),
  ])

  if (!project) notFound()

  const gstRate = n(project.gst_rate) || 0.05
  const sectionsWithItems = (sections || []).map(s => ({
    ...s,
    items: (items || []).filter(i => i.section_id === s.id),
  }))
  const subtotal = sectionsWithItems.reduce((sum, s) => sum + s.items.reduce((t, i) => t + calcItemTotal(i), 0), 0)
  const gstAmount = subtotal * gstRate
  const total = subtotal + gstAmount

  const today = new Date().toLocaleDateString('en-CA', { year: 'numeric', month: 'long', day: 'numeric' })

  const th = { padding: '3px 6px', fontSize: '8px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', background: '#e5e7eb', borderBottom: '1px solid #e2e8f0', WebkitPrintColorAdjust: 'exact', printColorAdjust: 'exact' }
  const td = { padding: '2px 6px', fontSize: '9px', borderBottom: '1px solid #e5e7eb', verticalAlign: 'top' }

  return (
    <>
      <PrintTrigger />
      <style>{`
        * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; box-sizing: border-box; }
        @media print { @page { margin: 8mm; } body { font-size: 9px; } }
      `}</style>
      <div style={{ fontFamily: 'Arial, sans-serif', color: '#111', maxWidth: '960px', margin: '0 auto', padding: '12px 16px' }}>

        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px', borderBottom: '2px solid #b91c1c', paddingBottom: '6px' }}>
          <div>
            <div style={{ fontSize: '16px', fontWeight: 800, color: '#b91c1c', letterSpacing: '-0.5px' }}>THM Technical Services</div>
            <div style={{ fontSize: '9px', color: '#64748b' }}>Partnership. Precision. Results.</div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '13px', fontWeight: 700 }}>Project Estimate</div>
            <div style={{ fontSize: '9px', color: '#64748b' }}>Date: {today}</div>
            {(project.estimate_no || project.internal_job_no) && (
              <div style={{ fontSize: '9px', color: '#64748b' }}>Ref: {project.estimate_no || project.internal_job_no}</div>
            )}
          </div>
        </div>

        {/* Project info */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2px 24px', marginBottom: '8px', fontSize: '9px' }}>
          <div><span style={{ color: '#64748b', fontWeight: 600 }}>Project: </span>{project.name}</div>
          <div><span style={{ color: '#64748b', fontWeight: 600 }}>Client: </span>{project.client_name || '—'}</div>
          {project.location && <div><span style={{ color: '#64748b', fontWeight: 600 }}>Location: </span>{project.location}</div>}
          {project.project_manager && <div><span style={{ color: '#64748b', fontWeight: 600 }}>Manager: </span>{project.project_manager}</div>}
          {project.client_job_no && <div><span style={{ color: '#64748b', fontWeight: 600 }}>Client Job #: </span>{project.client_job_no}</div>}
          {project.client_po_number && <div><span style={{ color: '#64748b', fontWeight: 600 }}>Client PO #: </span>{project.client_po_number}</div>}
        </div>

        {/* Sections */}
        {sectionsWithItems.map(section => {
          const sectionTotal = section.items.reduce((t, i) => t + calcItemTotal(i), 0)
          return (
            <div key={section.id} style={{ marginBottom: '6px', pageBreakInside: 'avoid' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#e5e7eb', color: '#111', padding: '4px 8px', borderRadius: '3px 3px 0 0', WebkitPrintColorAdjust: 'exact', printColorAdjust: 'exact' }}>
                <span style={{ fontWeight: 700, fontSize: '9px' }}>Area {section.number}{section.title ? ` — ${section.title}` : ''}</span>
                <span style={{ fontWeight: 700, fontSize: '9px' }}>{money(sectionTotal)}</span>
              </div>

              {ITEM_TYPES.map(type => {
                const typeItems = section.items.filter(i => i.type === type)
                if (!typeItems.length) return null
                return (
                  <div key={type}>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                      <thead>
                        <tr>
                          <td colSpan={10} style={{ ...td, background: '#f3f4f6', fontWeight: 700, fontSize: '8px', textTransform: 'uppercase', letterSpacing: '0.05em', color: '#9ca3af', padding: '3px 6px', WebkitPrintColorAdjust: 'exact', printColorAdjust: 'exact' }}>{type}</td>
                        </tr>
                        <tr style={{ WebkitPrintColorAdjust: 'exact', printColorAdjust: 'exact' }}>
                          {type === 'Labour' && <>
                            <th style={{ ...th, textAlign: 'left', width: '35%' }}>Role</th>
                            <th style={{ ...th, textAlign: 'center' }}>Days</th>
                            <th style={{ ...th, textAlign: 'center' }}>Reg Hrs</th>
                            <th style={{ ...th, textAlign: 'right' }}>Reg Rate</th>
                            <th style={{ ...th, textAlign: 'center' }}>OT Hrs</th>
                            <th style={{ ...th, textAlign: 'right' }}>OT Rate</th>
                            <th style={{ ...th, textAlign: 'right' }}>Total</th>
                          </>}
                          {type === 'Equipment' && <>
                            <th style={{ ...th, textAlign: 'left', width: '45%' }}>Equipment</th>
                            <th style={{ ...th, textAlign: 'center' }}>Qty</th>
                            <th style={{ ...th, textAlign: 'center' }}>Units</th>
                            <th style={{ ...th, textAlign: 'right' }}>Rate</th>
                            <th style={{ ...th, textAlign: 'right' }}>Markup</th>
                            <th style={{ ...th, textAlign: 'right' }}>Total</th>
                          </>}
                          {type === 'Third Party' && <>
                            <th style={{ ...th, textAlign: 'left', width: '25%' }}>Supplier</th>
                            <th style={{ ...th, textAlign: 'left' }}>Description</th>
                            <th style={{ ...th, textAlign: 'right' }}>Cost</th>
                            <th style={{ ...th, textAlign: 'right' }}>Markup</th>
                            <th style={{ ...th, textAlign: 'right' }}>Total</th>
                          </>}
                        </tr>
                      </thead>
                      <tbody>
                        {typeItems.map(item => (
                          <tr key={item.id}>
                            {type === 'Labour' && <>
                              <td style={td}>{item.description || '—'}</td>
                              <td style={{ ...td, textAlign: 'center' }}>{n(item.days)}</td>
                              <td style={{ ...td, textAlign: 'center' }}>{n(item.reg_hours)}</td>
                              <td style={{ ...td, textAlign: 'right' }}>{money(item.reg_rate)}</td>
                              <td style={{ ...td, textAlign: 'center' }}>{n(item.ot_hours)}</td>
                              <td style={{ ...td, textAlign: 'right' }}>{money(item.ot_rate)}</td>
                              <td style={{ ...td, textAlign: 'right', fontWeight: 600 }}>{money(calcItemTotal(item))}</td>
                            </>}
                            {type === 'Equipment' && <>
                              <td style={td}>{item.description || '—'}</td>
                              <td style={{ ...td, textAlign: 'center' }}>{n(item.qty)}</td>
                              <td style={{ ...td, textAlign: 'center' }}>
                                {n(item.days)} <span style={{ fontSize: '10px', color: '#888' }}>{{ hourly: 'hr', daily: 'day', weekly: 'wk', monthly: 'mo' }[item.equip_period] || 'day'}</span>
                              </td>
                              <td style={{ ...td, textAlign: 'right' }}>{money(item.reg_rate)}</td>
                              <td style={{ ...td, textAlign: 'right' }}>{item.markup ? `${(n(item.markup) * 100).toFixed(0)}%` : '—'}</td>
                              <td style={{ ...td, textAlign: 'right', fontWeight: 600 }}>{money(calcItemTotal(item))}</td>
                            </>}
                            {type === 'Third Party' && <>
                              <td style={td}>{item.supplier || '—'}</td>
                              <td style={td}>{item.description || '—'}</td>
                              <td style={{ ...td, textAlign: 'right' }}>{money(item.cost)}</td>
                              <td style={{ ...td, textAlign: 'right' }}>{item.markup ? `${(n(item.markup) * 100).toFixed(0)}%` : '—'}</td>
                              <td style={{ ...td, textAlign: 'right', fontWeight: 600 }}>{money(calcItemTotal(item))}</td>
                            </>}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )
              })}
            </div>
          )
        })}

        {/* Totals */}
        <div style={{ marginTop: '8px', borderTop: '2px solid #1e293b', paddingTop: '6px', width: '240px', marginLeft: 'auto' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '2px 0', fontSize: '9px' }}>
            <span>Subtotal</span><span>{money(subtotal)}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '2px 0', fontSize: '9px', borderBottom: '1px solid #e2e8f0' }}>
            <span>GST ({(gstRate * 100).toFixed(0)}%)</span><span>{money(gstAmount)}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', fontSize: '12px', fontWeight: 800 }}>
            <span>Total incl. GST</span><span>{money(total)}</span>
          </div>
        </div>

        {/* Footer */}
        <div style={{ marginTop: '10px', borderTop: '1px solid #e2e8f0', paddingTop: '6px', fontSize: '8px', color: '#94a3b8', textAlign: 'center' }}>
          THM Technical Services · This estimate is valid for 30 days from the date above.
        </div>
      </div>
    </>
  )
}
