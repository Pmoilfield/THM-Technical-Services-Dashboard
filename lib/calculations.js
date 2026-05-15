// Core business logic - ported from the HTML dashboard
// All monetary values in CAD cents stored as decimals

export function n(value) {
  const num = Number(value)
  return isNaN(num) ? 0 : num
}

export function money(value) {
  return n(value).toLocaleString('en-CA', { style: 'currency', currency: 'CAD' })
}

export function pct(value) {
  return n(value).toLocaleString('en-CA', { style: 'percent', minimumFractionDigits: 1, maximumFractionDigits: 1 })
}

export function numberFmt(value, digits = 1) {
  return n(value).toLocaleString('en-CA', { minimumFractionDigits: digits, maximumFractionDigits: digits })
}

// ── Estimate ──────────────────────────────────────────────────────────────────

export function itemTotal(item) {
  const i = item || {}
  if (i.type === 'Third Party') {
    const base = n(i.cost) * n(i.qty || 1)
    return base * (1 + n(i.markup))
  }
  const labour = n(i.qty) * n(i.days) * (n(i.reg_hours) * n(i.reg_rate) + n(i.ot_hours) * n(i.ot_rate))
  const equipment = n(i.qty) * n(i.days) * n(i.reg_hours) * n(i.reg_rate)
  const allowance = n(i.qty) * n(i.days) * n(i.reg_hours) * n(i.reg_rate) * (1 + n(i.markup))
  if (i.type === 'Labour') return labour
  if (i.type === 'Equipment') return equipment
  if (i.type === 'Allowance') return allowance
  return 0
}

export function calculateProject(project, sections, items) {
  const gstRate = n(project?.gst_rate ?? 0.05)

  const sectionTotals = (sections || []).map(section => {
    const sectionItems = (items || []).filter(item => item.section_id === section.id)
    const estimate = sectionItems.reduce((sum, item) => sum + itemTotal(item), 0)
    return { id: section.id, number: section.number, title: section.title, estimate }
  })

  const estimateSubtotal = sectionTotals.reduce((sum, s) => sum + s.estimate, 0)
  const gstAmount = estimateSubtotal * gstRate
  const totalIncludingTax = estimateSubtotal + gstAmount

  return { sectionTotals, estimateSubtotal, gstAmount, totalIncludingTax }
}

// ── Field Tickets ─────────────────────────────────────────────────────────────

export function ticketItemTotal(item) {
  const i = item || {}
  if (i.type === 'Labour') {
    return n(i.straight_hours) * n(i.straight_rate) + n(i.overtime_hours) * n(i.overtime_rate)
  }
  if (i.type === 'Equipment') {
    return n(i.quantity) * n(i.unit_cost)
  }
  if (i.type === 'Material' || i.type === 'Subcontractor') {
    return n(i.quantity) * n(i.unit_cost) * (1 + n(i.markup))
  }
  return 0
}

export function ticketSubtotal(items) {
  return (items || []).reduce((sum, item) => sum + ticketItemTotal(item), 0)
}

// ── Accruals ──────────────────────────────────────────────────────────────────

export function calculateAccruals(tickets, purchaseOrders) {
  const fieldTicketTotal = (tickets || [])
    .filter(t => t.status !== 'rejected')
    .reduce((sum, t) => sum + n(t.subtotal), 0)

  const purchaseOrderTotal = (purchaseOrders || []).reduce((sum, po) => {
    return sum + n(po.value) * (1 + n(po.markup))
  }, 0)

  return { fieldTicketTotal, purchaseOrderTotal, accrualsToDate: fieldTicketTotal + purchaseOrderTotal }
}

export function calculateVariance(sectionTotals, tickets, purchaseOrders) {
  // Group actuals by section_number
  const actualsBySection = {}

  ;(tickets || [])
    .filter(t => t.status !== 'rejected')
    .forEach(ticket => {
      const key = String(ticket.section_number || 'Unassigned')
      actualsBySection[key] = n(actualsBySection[key]) + n(ticket.subtotal)
    })

  ;(purchaseOrders || []).forEach(po => {
    const key = String(po.section_number || 'Unassigned')
    const ordered = n(po.value) * (1 + n(po.markup))
    actualsBySection[key] = n(actualsBySection[key]) + ordered
  })

  return (sectionTotals || []).map(section => {
    const actual = n(actualsBySection[String(section.number)])
    const remaining = section.estimate - actual
    const spentPct = section.estimate ? actual / section.estimate : 0
    return { ...section, actual, remaining, spentPct }
  })
}

// ── Schedule ──────────────────────────────────────────────────────────────────

export function parseIsoDate(str) {
  if (!str) return null
  const parts = str.split('-')
  if (parts.length !== 3) return null
  return new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]))
}

export function dateSpanDays(start, end) {
  const s = parseIsoDate(start)
  const e = parseIsoDate(end)
  if (!s || !e || e < s) return 0
  return Math.round((e - s) / 86400000) + 1
}

export function disciplineManDays(discipline) {
  const d = discipline || {}
  const qty = n(d.qty)
  const days = dateSpanDays(d.start_date, d.end_date)
  if (qty && days) return qty * days
  return n(d.man_days)
}

export function blockManDays(block, disciplines) {
  const blockDiscs = (disciplines || []).filter(d => d.block_id === block.id)
  const sum = blockDiscs.reduce((total, d) => total + disciplineManDays(d), 0)
  return sum || n(block.total_loaded_man_days)
}

// ── Invoice ───────────────────────────────────────────────────────────────────

export function calculateInvoice(tickets, gstRate = 0.05) {
  const subtotal = (tickets || []).reduce((sum, t) => sum + n(t.subtotal), 0)
  const gstAmount = subtotal * n(gstRate)
  const total = subtotal + gstAmount
  return { subtotal, gstAmount, total }
}

// ── Portfolio ─────────────────────────────────────────────────────────────────

export function calculatePortfolioTotals(projectCalcs) {
  const rows = projectCalcs || []
  return {
    estimateSubtotal: rows.reduce((s, r) => s + n(r.estimateSubtotal), 0),
    gstAmount: rows.reduce((s, r) => s + n(r.gstAmount), 0),
    totalIncludingTax: rows.reduce((s, r) => s + n(r.totalIncludingTax), 0),
    fieldTicketTotal: rows.reduce((s, r) => s + n(r.fieldTicketTotal), 0),
    purchaseOrderTotal: rows.reduce((s, r) => s + n(r.purchaseOrderTotal), 0),
    accrualsToDate: rows.reduce((s, r) => s + n(r.accrualsToDate), 0),
    remaining: rows.reduce((s, r) => s + n(r.remaining), 0),
  }
}

// ── Number formatting ─────────────────────────────────────────────────────────

export function todayIso() {
  return new Date().toISOString().slice(0, 10)
}

export function formatDate(iso) {
  if (!iso) return '-'
  const d = parseIsoDate(iso)
  if (!d) return iso
  return d.toLocaleDateString('en-CA', { year: 'numeric', month: 'short', day: 'numeric' })
}

export function statusClass(status) {
  return 'status-' + String(status || 'draft').replace(/\s+/g, '-')
}
