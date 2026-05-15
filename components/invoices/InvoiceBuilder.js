'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createBrowserSupabase } from '@/lib/supabase'
import { money, formatDate, todayIso, n } from '@/lib/calculations'
import Link from 'next/link'

function dueDateDefault() {
  const d = new Date()
  d.setDate(d.getDate() + 30)
  return d.toISOString().slice(0, 10)
}

export default function InvoiceBuilder({ projects, preselectedProjectId, initialTickets, invoicedTicketIds, autoInvoiceNumber }) {
  const router = useRouter()
  const supabase = createBrowserSupabase()

  const [projectId, setProjectId] = useState(preselectedProjectId || '')
  const [tickets, setTickets] = useState(initialTickets || [])
  const [invoicedIds, setInvoicedIds] = useState(new Set(invoicedTicketIds || []))
  const [selected, setSelected] = useState([])
  const [invoiceNumber, setInvoiceNumber] = useState(autoInvoiceNumber)
  const [date, setDate] = useState(todayIso())
  const [dueDate, setDueDate] = useState(dueDateDefault())
  const [notes, setNotes] = useState('')
  const [gstRate, setGstRate] = useState(0.05)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [loadingTickets, setLoadingTickets] = useState(false)

  const project = projects.find(p => p.id === projectId)

  useEffect(() => {
    if (!projectId) { setTickets([]); setSelected([]); return }
    if (projectId === preselectedProjectId && initialTickets.length) {
      setTickets(initialTickets)
      setGstRate(n(project?.gst_rate) || 0.05)
      return
    }
    setLoadingTickets(true)
    setSelected([])
    supabase.from('field_tickets').select('*').eq('project_id', projectId).eq('status', 'approved').order('date')
      .then(async ({ data: tix }) => {
        const available = tix || []
        setTickets(available)
        if (available.length) {
          const ids = available.map(t => t.id)
          const { data: junctions } = await supabase
            .from('invoice_tickets')
            .select('field_ticket_id, invoices!inner(status)')
            .in('field_ticket_id', ids)
          const alreadyInvoiced = new Set(
            (junctions || []).filter(j => j.invoices?.status !== 'void').map(j => j.field_ticket_id)
          )
          setInvoicedIds(alreadyInvoiced)
        } else {
          setInvoicedIds(new Set())
        }
        setLoadingTickets(false)
      })
    setGstRate(n(project?.gst_rate) || 0.05)
  }, [projectId])

  const availableTickets = tickets.filter(t => !invoicedIds.has(t.id))

  function toggleTicket(id) {
    setSelected(s => s.includes(id) ? s.filter(x => x !== id) : [...s, id])
  }

  function toggleAll() {
    const ids = availableTickets.map(t => t.id)
    setSelected(s => s.length === ids.length ? [] : ids)
  }

  const selectedTickets = tickets.filter(t => selected.includes(t.id))
  const subtotal = selectedTickets.reduce((s, t) => s + n(t.subtotal), 0)
  const gstAmount = subtotal * gstRate
  const total = subtotal + gstAmount

  async function save() {
    if (!projectId) { setError('Select a project.'); return }
    if (!selected.length) { setError('Select at least one field ticket.'); return }
    if (!invoiceNumber.trim()) { setError('Invoice number is required.'); return }
    setSaving(true)
    setError('')

    const { data: inv, error: invErr } = await supabase.from('invoices').insert({
      project_id: projectId,
      invoice_number: invoiceNumber.trim(),
      date,
      due_date: dueDate || null,
      status: 'draft',
      subtotal,
      gst_amount: gstAmount,
      gst_rate: gstRate,
      total,
      notes: notes.trim() || null,
    }).select().single()

    if (invErr) { setError(invErr.message); setSaving(false); return }

    const { error: jtErr } = await supabase.from('invoice_tickets').insert(
      selected.map(ticketId => ({ invoice_id: inv.id, field_ticket_id: ticketId }))
    )
    if (jtErr) { setError(jtErr.message); setSaving(false); return }

    router.push(`/invoices/${inv.id}`)
    router.refresh()
  }

  const allAvailableSelected = availableTickets.length > 0 && selected.length === availableTickets.length

  return (
    <div className="grid" style={{ maxWidth: '1200px' }}>
      <div className="page-header">
        <div className="split">
          <div>
            <h1>New Invoice</h1>
            <p className="muted">Select approved field tickets to include</p>
          </div>
          <div className="toolbar">
            <Link href="/invoices"><button>Cancel</button></Link>
            <button className="primary" onClick={save} disabled={saving || !selected.length || !projectId}>
              {saving ? 'Creating…' : 'Create invoice'}
            </button>
          </div>
        </div>
      </div>

      {error && <div className="notice danger">{error}</div>}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: '20px', alignItems: 'start' }}>
        {/* Left: project + ticket selection */}
        <div className="grid" style={{ gap: '16px' }}>
          <section className="panel">
            <h2>Project</h2>
            <div style={{ marginTop: '12px' }}>
              <select
                value={projectId}
                onChange={e => setProjectId(e.target.value)}
                style={{ width: '100%' }}
              >
                <option value="">— Select project —</option>
                {projects.map(p => (
                  <option key={p.id} value={p.id}>
                    {p.name}{p.client_name ? ` · ${p.client_name}` : ''}
                  </option>
                ))}
              </select>
            </div>
          </section>

          <section className="panel">
            <h2>Field tickets</h2>
            <div style={{ marginTop: '12px' }}>
              {!projectId && (
                <p className="muted" style={{ fontSize: '13px' }}>Select a project to see its approved tickets.</p>
              )}
              {projectId && loadingTickets && (
                <p className="muted" style={{ fontSize: '13px' }}>Loading tickets…</p>
              )}
              {projectId && !loadingTickets && (
                <div className="table-wrap">
                  <table>
                    <thead>
                      <tr>
                        <th style={{ width: '36px' }}>
                          <input
                            type="checkbox"
                            checked={allAvailableSelected}
                            onChange={toggleAll}
                            disabled={!availableTickets.length}
                            title="Select all"
                          />
                        </th>
                        <th>Ticket #</th>
                        <th>Date</th>
                        <th>Area</th>
                        <th>Description</th>
                        <th className="numeric">Amount</th>
                        <th></th>
                      </tr>
                    </thead>
                    <tbody>
                      {tickets.map(t => {
                        const alreadyInvoiced = invoicedIds.has(t.id)
                        return (
                          <tr key={t.id} style={{ opacity: alreadyInvoiced ? 0.45 : 1 }}>
                            <td>
                              <input
                                type="checkbox"
                                disabled={alreadyInvoiced}
                                checked={selected.includes(t.id)}
                                onChange={() => toggleTicket(t.id)}
                              />
                            </td>
                            <td><strong>{t.ticket_number}</strong></td>
                            <td style={{ whiteSpace: 'nowrap' }}>{formatDate(t.date)}</td>
                            <td>{t.section_number ? `Area ${t.section_number}` : '—'}</td>
                            <td style={{ maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                              {t.description || '—'}
                            </td>
                            <td className="numeric">{money(t.subtotal)}</td>
                            <td>
                              {alreadyInvoiced
                                ? <span className="status-pill status-invoiced">invoiced</span>
                                : <span className="status-pill status-approved">approved</span>
                              }
                            </td>
                          </tr>
                        )
                      })}
                      {!tickets.length && (
                        <tr><td colSpan="7" className="empty">No approved field tickets for this project.</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </section>
        </div>

        {/* Right: invoice details + summary */}
        <div className="grid" style={{ gap: '16px' }}>
          <section className="panel">
            <h2>Invoice details</h2>
            <div style={{ display: 'grid', gap: '12px', marginTop: '12px' }}>
              <div>
                <div className="label">Invoice number</div>
                <input
                  style={{ width: '100%', marginTop: '4px' }}
                  value={invoiceNumber}
                  onChange={e => setInvoiceNumber(e.target.value)}
                />
              </div>
              <div>
                <div className="label">Invoice date</div>
                <input type="date" style={{ width: '100%', marginTop: '4px' }} value={date} onChange={e => setDate(e.target.value)} />
              </div>
              <div>
                <div className="label">Due date</div>
                <input type="date" style={{ width: '100%', marginTop: '4px' }} value={dueDate} onChange={e => setDueDate(e.target.value)} />
              </div>
              <div>
                <div className="label">GST rate</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px' }}>
                  <input
                    type="number" step="0.01" min="0" max="1"
                    style={{ width: '80px' }}
                    value={gstRate}
                    onChange={e => setGstRate(parseFloat(e.target.value) || 0)}
                  />
                  <span className="muted" style={{ fontSize: '12px' }}>{(gstRate * 100).toFixed(0)}%</span>
                </div>
              </div>
              <div>
                <div className="label">Notes</div>
                <textarea
                  style={{ width: '100%', marginTop: '4px', minHeight: '80px', resize: 'vertical' }}
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  placeholder="Payment terms, remittance instructions…"
                />
              </div>
            </div>
          </section>

          <section className="panel">
            <h2>Summary</h2>
            <div style={{ fontSize: '12px', color: 'var(--muted)', marginBottom: '10px', marginTop: '8px' }}>
              {selected.length} of {availableTickets.length} ticket{availableTickets.length !== 1 ? 's' : ''} selected
            </div>
            <div className="split" style={{ padding: '8px 0', borderBottom: '1px solid var(--line)', fontSize: '14px' }}>
              <span>Subtotal</span><strong>{money(subtotal)}</strong>
            </div>
            <div className="split" style={{ padding: '8px 0', borderBottom: '1px solid var(--line)', fontSize: '14px' }}>
              <span>GST ({(gstRate * 100).toFixed(0)}%)</span><strong>{money(gstAmount)}</strong>
            </div>
            <div className="split" style={{ padding: '12px 0', fontWeight: 800, fontSize: '20px' }}>
              <span>Total</span><span>{money(total)}</span>
            </div>
            <button
              className="primary"
              style={{ width: '100%', marginTop: '4px' }}
              onClick={save}
              disabled={saving || !selected.length || !projectId}
            >
              {saving ? 'Creating…' : 'Create invoice'}
            </button>
          </section>
        </div>
      </div>
    </div>
  )
}
