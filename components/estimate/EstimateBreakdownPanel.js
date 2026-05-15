'use client'
import { useState } from 'react'
import Link from 'next/link'

const ITEM_TYPES = ['Labour', 'Equipment', 'Third Party']

function n(v) { return parseFloat(v) || 0 }
function money(v) { return '$' + n(v).toLocaleString('en-CA', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) }
function pct(v) { return (n(v) * 100).toFixed(1) + '%' }

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

const th = { padding: '4px 8px', fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', background: '#e5e7eb', borderBottom: '1px solid #e2e8f0' }
const td = { padding: '4px 8px', fontSize: '12px', borderBottom: '1px solid #f3f4f6', verticalAlign: 'top' }

export default function EstimateBreakdownPanel({ projectId, sections, items, gstRate, variance }) {
  const [open, setOpen] = useState(false)

  const sectionsWithItems = (sections || []).map(s => ({
    ...s,
    items: (items || []).filter(i => i.section_id === s.id),
  }))

  const subtotal = sectionsWithItems.reduce((sum, s) => sum + s.items.reduce((t, i) => t + calcItemTotal(i), 0), 0)
  const gst = subtotal * (n(gstRate) || 0.05)
  const total = subtotal + gst

  return (
    <section className="panel">
      <div className="split">
        <h2>Scope of Work Breakdown</h2>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <Link href={`/projects/${projectId}/estimate`}><button className="small">Build estimate →</button></Link>
          <Link href={`/print/estimate/${projectId}`} target="_blank"><button className="small">Export</button></Link>
          {sectionsWithItems.length > 0 && (
            <button className="small" onClick={() => setOpen(o => !o)}>
              {open ? 'Hide detail ↑' : 'Show detail ↓'}
            </button>
          )}
        </div>
      </div>

      {/* Summary table — always visible */}
      <div className="table-wrap" style={{ marginTop: '12px' }}>
        <table>
          <thead>
            <tr>
              <th>Area</th>
              <th>Description</th>
              <th className="numeric">Estimate</th>
              <th className="numeric">Accruals</th>
              <th className="numeric">Remaining</th>
              <th className="numeric">Spent</th>
            </tr>
          </thead>
          <tbody>
            {(variance || []).length ? (variance || []).map(row => (
              <tr key={row.id}>
                <td>Area {row.number}</td>
                <td>{row.title || 'Untitled'}</td>
                <td className="numeric">{money(row.estimate)}</td>
                <td className="numeric">{money(row.actual)}</td>
                <td className={`numeric ${row.remaining < 0 ? 'bad' : ''}`}>{money(row.remaining)}</td>
                <td className="numeric">{pct(row.spentPct)}</td>
              </tr>
            )) : (
              <tr><td colSpan="6" className="empty">No estimate sections yet. <Link href={`/projects/${projectId}/estimate`}>Build estimate →</Link></td></tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Full breakdown — shown when expanded */}
      {open && sectionsWithItems.length > 0 && (
        <div style={{ marginTop: '20px', borderTop: '2px solid #e5e7eb', paddingTop: '16px' }}>
          {sectionsWithItems.map(section => {
            const sectionTotal = section.items.reduce((t, i) => t + calcItemTotal(i), 0)
            return (
              <div key={section.id} style={{ marginBottom: '16px' }}>
                {/* Section header */}
                <div style={{
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  background: '#e5e7eb', padding: '6px 10px', borderRadius: '4px 4px 0 0',
                }}>
                  <span style={{ fontWeight: 700, fontSize: '12px' }}>
                    Area {section.number}{section.title ? ` — ${section.title}` : ''}
                  </span>
                  <span style={{ fontWeight: 700, fontSize: '12px' }}>{money(sectionTotal)}</span>
                </div>

                {ITEM_TYPES.map(type => {
                  const typeItems = section.items.filter(i => i.type === type)
                  if (!typeItems.length) return null
                  return (
                    <div key={type}>
                      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead>
                          <tr>
                            <td colSpan={10} style={{ ...td, background: '#f3f4f6', fontWeight: 700, fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.05em', color: '#9ca3af' }}>
                              {type}
                            </td>
                          </tr>
                          <tr>
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
          <div style={{ marginTop: '12px', borderTop: '2px solid #e5e7eb', paddingTop: '8px', width: '260px', marginLeft: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '3px 0', fontSize: '12px' }}>
              <span>Subtotal</span><span>{money(subtotal)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '3px 0', fontSize: '12px', borderBottom: '1px solid #e2e8f0' }}>
              <span>GST ({((n(gstRate) || 0.05) * 100).toFixed(0)}%)</span><span>{money(gst)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', fontSize: '14px', fontWeight: 800 }}>
              <span>Total incl. GST</span><span>{money(total)}</span>
            </div>
          </div>
        </div>
      )}
    </section>
  )
}
