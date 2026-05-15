'use client'
import { useRouter } from 'next/navigation'

const DAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

function addDays(dateStr, n) {
  const d = new Date(dateStr)
  d.setDate(d.getDate() + n)
  return d.toISOString().split('T')[0]
}

function formatHeader(dateStr) {
  const d = new Date(dateStr)
  return d.toLocaleDateString('en-CA', { month: 'short', day: 'numeric' })
}

function formatPeriodLabel(start, end) {
  const s = new Date(start)
  const e = new Date(end)
  return `${s.toLocaleDateString('en-CA', { month: 'long', day: 'numeric' })} – ${e.toLocaleDateString('en-CA', { month: 'long', day: 'numeric', year: 'numeric' })}`
}

function n(v) { return parseFloat(v) || 0 }

export default function PayrollCalendar({ workers, tickets, timeEntries, periodStart, periodEnd }) {
  const router = useRouter()

  // Build days array (14 days)
  const days = Array.from({ length: 14 }, (_, i) => addDays(periodStart, i))

  // Build FT hours lookup: workerId -> date -> { travel, st, ot }
  const hours = {}
  workers.forEach(w => { hours[w.id] = {} })

  tickets.forEach(ticket => {
    const date = ticket.date
    ;(ticket.field_ticket_items || []).forEach(item => {
      if (item.type !== 'Labour' || !item.worker_id) return
      if (!hours[item.worker_id]) return
      if (!hours[item.worker_id][date]) hours[item.worker_id][date] = { travel: 0, st: 0, ot: 0 }
      hours[item.worker_id][date].travel += n(item.travel_hours)
      hours[item.worker_id][date].st += n(item.reg_hours)
      hours[item.worker_id][date].ot += n(item.ot_hours)
    })
  })

  // Build time entry lookup: workerId -> date -> { travel, st, ot }
  const teHours = {}
  workers.forEach(w => { teHours[w.id] = {} })
  ;(timeEntries || []).forEach(te => {
    if (!teHours[te.worker_id]) return
    if (!teHours[te.worker_id][te.date]) teHours[te.worker_id][te.date] = { travel: 0, st: 0, ot: 0 }
    teHours[te.worker_id][te.date].travel += n(te.travel_hours)
    teHours[te.worker_id][te.date].st += n(te.reg_hours)
    teHours[te.worker_id][te.date].ot += n(te.ot_hours)
  })

  // Totals per worker
  function workerTotals(workerId) {
    let travel = 0, st = 0, ot = 0
    days.forEach(d => {
      const h = hours[workerId]?.[d]
      if (h) { travel += h.travel; st += h.st; ot += h.ot }
    })
    return { travel, st, ot }
  }

  function workerTETotals(workerId) {
    let travel = 0, st = 0, ot = 0
    days.forEach(d => {
      const h = teHours[workerId]?.[d]
      if (h) { travel += h.travel; st += h.st; ot += h.ot }
    })
    return { travel, st, ot }
  }

  function prevPeriod() { router.push(`/payroll?start=${addDays(periodStart, -14)}`) }
  function nextPeriod() { router.push(`/payroll?start=${addDays(periodStart, 14)}`) }
  function thisPeriod() { router.push('/payroll') }

  const week1 = days.slice(0, 7)
  const week2 = days.slice(7, 14)

  const cellStyle = { padding: '6px 4px', textAlign: 'center', borderBottom: '1px solid var(--line)', fontSize: '11px', minWidth: '52px' }
  const headCell = { ...cellStyle, background: '#f8fafc', fontWeight: 700, fontSize: '10px', color: '#475467', textTransform: 'uppercase' }
  const nameCell = { padding: '6px 10px', borderBottom: '1px solid var(--line)', fontWeight: 600, fontSize: '11px', whiteSpace: 'nowrap', minWidth: '140px' }

  return (
    <div className="grid">
      <div className="page-header">
        <div className="split">
          <div>
            <h1>Payroll — {formatPeriodLabel(periodStart, periodEnd)}</h1>
            <p className="muted">Active employees · bi-weekly period · excludes rejected tickets</p>
          </div>
          <div className="toolbar">
            <button className="small" onClick={prevPeriod}>← Prev</button>
            <button className="small" onClick={thisPeriod}>This period</button>
            <button className="small" onClick={nextPeriod}>Next →</button>
          </div>
        </div>
      </div>

      {/* Week 1 */}
      <section className="panel">
        <h2>Week 1</h2>
        <div style={{ overflowX: 'auto', marginTop: '10px' }}>
          <table style={{ borderCollapse: 'collapse', width: '100%' }}>
            <thead>
              <tr>
                <th style={{ ...headCell, textAlign: 'left' }}>Employee</th>
                {week1.map((d, i) => (
                  <th key={d} style={{ ...headCell, color: i >= 5 ? '#b91c1c' : undefined }}>
                    {DAY_LABELS[i]}<br />{formatHeader(d)}
                  </th>
                ))}
                <th style={{ ...headCell, background: '#f0f4f8' }}>Travel</th>
                <th style={{ ...headCell, background: '#f0f4f8' }}>ST</th>
                <th style={{ ...headCell, background: '#f0f4f8' }}>OT</th>
              </tr>
            </thead>
            <tbody>
              {workers.map(w => {
                const week1Travel = week1.reduce((s, d) => s + (hours[w.id]?.[d]?.travel || 0), 0)
                const week1ST = week1.reduce((s, d) => s + (hours[w.id]?.[d]?.st || 0), 0)
                const week1OT = week1.reduce((s, d) => s + (hours[w.id]?.[d]?.ot || 0), 0)
                return (
                  <tr key={w.id}>
                    <td style={nameCell}>{w.name}</td>
                    {week1.map(d => {
                      const h = hours[w.id]?.[d]
                      const total = h ? h.travel + h.st + h.ot : 0
                      return (
                        <td key={d} style={{ ...cellStyle, background: total > 0 ? '#f0fdf4' : undefined }}>
                          {total > 0 ? (
                            <div>
                              {h.st > 0 && <div style={{ color: '#15803d', fontWeight: 700 }}>{h.st}st</div>}
                              {h.ot > 0 && <div style={{ color: '#b91c1c', fontWeight: 700 }}>{h.ot}ot</div>}
                              {h.travel > 0 && <div style={{ color: '#6b7280' }}>{h.travel}tr</div>}
                            </div>
                          ) : <span style={{ color: '#d1d5db' }}>—</span>}
                        </td>
                      )
                    })}
                    <td style={{ ...cellStyle, background: '#f8fafc', fontWeight: 700 }}>{week1Travel || '—'}</td>
                    <td style={{ ...cellStyle, background: '#f8fafc', fontWeight: 700, color: '#15803d' }}>{week1ST || '—'}</td>
                    <td style={{ ...cellStyle, background: '#f8fafc', fontWeight: 700, color: '#b91c1c' }}>{week1OT || '—'}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </section>

      {/* Week 2 */}
      <section className="panel">
        <h2>Week 2</h2>
        <div style={{ overflowX: 'auto', marginTop: '10px' }}>
          <table style={{ borderCollapse: 'collapse', width: '100%' }}>
            <thead>
              <tr>
                <th style={{ ...headCell, textAlign: 'left' }}>Employee</th>
                {week2.map((d, i) => (
                  <th key={d} style={{ ...headCell, color: i >= 5 ? '#b91c1c' : undefined }}>
                    {DAY_LABELS[i]}<br />{formatHeader(d)}
                  </th>
                ))}
                <th style={{ ...headCell, background: '#f0f4f8' }}>Travel</th>
                <th style={{ ...headCell, background: '#f0f4f8' }}>ST</th>
                <th style={{ ...headCell, background: '#f0f4f8' }}>OT</th>
              </tr>
            </thead>
            <tbody>
              {workers.map(w => {
                const week2Travel = week2.reduce((s, d) => s + (hours[w.id]?.[d]?.travel || 0), 0)
                const week2ST = week2.reduce((s, d) => s + (hours[w.id]?.[d]?.st || 0), 0)
                const week2OT = week2.reduce((s, d) => s + (hours[w.id]?.[d]?.ot || 0), 0)
                return (
                  <tr key={w.id}>
                    <td style={nameCell}>{w.name}</td>
                    {week2.map(d => {
                      const h = hours[w.id]?.[d]
                      const total = h ? h.travel + h.st + h.ot : 0
                      return (
                        <td key={d} style={{ ...cellStyle, background: total > 0 ? '#f0fdf4' : undefined }}>
                          {total > 0 ? (
                            <div>
                              {h.st > 0 && <div style={{ color: '#15803d', fontWeight: 700 }}>{h.st}st</div>}
                              {h.ot > 0 && <div style={{ color: '#b91c1c', fontWeight: 700 }}>{h.ot}ot</div>}
                              {h.travel > 0 && <div style={{ color: '#6b7280' }}>{h.travel}tr</div>}
                            </div>
                          ) : <span style={{ color: '#d1d5db' }}>—</span>}
                        </td>
                      )
                    })}
                    <td style={{ ...cellStyle, background: '#f8fafc', fontWeight: 700 }}>{week2Travel || '—'}</td>
                    <td style={{ ...cellStyle, background: '#f8fafc', fontWeight: 700, color: '#15803d' }}>{week2ST || '—'}</td>
                    <td style={{ ...cellStyle, background: '#f8fafc', fontWeight: 700, color: '#b91c1c' }}>{week2OT || '—'}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </section>

      {/* Period totals */}
      <section className="panel">
        <h2>Period totals — Field Ticket vs Time Entry</h2>
        <div style={{ overflowX: 'auto', marginTop: '10px' }}>
          <table style={{ borderCollapse: 'collapse', width: '100%' }}>
            <thead>
              <tr>
                <th style={{ ...headCell, textAlign: 'left' }} rowSpan={2}>Employee</th>
                <th style={{ ...headCell, background: '#f0fdf4', borderBottom: '1px solid #bbf7d0' }} colSpan={4}>Field Ticket</th>
                <th style={{ ...headCell, background: '#eff8ff', borderBottom: '1px solid #bfdbfe' }} colSpan={4}>Time Entry</th>
                <th style={{ ...headCell, background: '#fefce8', borderBottom: '1px solid #fde68a' }} colSpan={3}>Variance (FT − TE)</th>
              </tr>
              <tr>
                <th style={{ ...headCell, background: '#f0fdf4' }}>Travel</th>
                <th style={{ ...headCell, background: '#f0fdf4' }}>ST</th>
                <th style={{ ...headCell, background: '#f0fdf4' }}>OT</th>
                <th style={{ ...headCell, background: '#f0fdf4' }}>Total</th>
                <th style={{ ...headCell, background: '#eff8ff' }}>Travel</th>
                <th style={{ ...headCell, background: '#eff8ff' }}>ST</th>
                <th style={{ ...headCell, background: '#eff8ff' }}>OT</th>
                <th style={{ ...headCell, background: '#eff8ff' }}>Total</th>
                <th style={{ ...headCell, background: '#fefce8' }}>ST</th>
                <th style={{ ...headCell, background: '#fefce8' }}>OT</th>
                <th style={{ ...headCell, background: '#fefce8' }}>Total</th>
              </tr>
            </thead>
            <tbody>
              {workers.map(w => {
                const ft = workerTotals(w.id)
                const te = workerTETotals(w.id)
                const ftTotal = ft.travel + ft.st + ft.ot
                const teTotal = te.travel + te.st + te.ot
                const varST = ft.st - te.st
                const varOT = ft.ot - te.ot
                const varTotal = ftTotal - teTotal
                const hasData = ftTotal > 0 || teTotal > 0
                const varColor = v => v === 0 ? undefined : v > 0 ? '#b91c1c' : '#15803d'
                return (
                  <tr key={w.id} style={{ opacity: hasData ? 1 : 0.35 }}>
                    <td style={nameCell}>{w.name}</td>
                    <td style={{ ...cellStyle, background: '#f0fdf4' }}>{ft.travel || '—'}</td>
                    <td style={{ ...cellStyle, background: '#f0fdf4', fontWeight: 700, color: '#15803d' }}>{ft.st || '—'}</td>
                    <td style={{ ...cellStyle, background: '#f0fdf4', fontWeight: 700, color: '#b91c1c' }}>{ft.ot || '—'}</td>
                    <td style={{ ...cellStyle, background: '#f0fdf4', fontWeight: 800 }}>{ftTotal || '—'}</td>
                    <td style={{ ...cellStyle, background: '#eff8ff' }}>{te.travel || '—'}</td>
                    <td style={{ ...cellStyle, background: '#eff8ff', fontWeight: 700, color: '#15803d' }}>{te.st || '—'}</td>
                    <td style={{ ...cellStyle, background: '#eff8ff', fontWeight: 700, color: '#b91c1c' }}>{te.ot || '—'}</td>
                    <td style={{ ...cellStyle, background: '#eff8ff', fontWeight: 800 }}>{teTotal || '—'}</td>
                    <td style={{ ...cellStyle, background: '#fefce8', fontWeight: 700, color: varColor(varST) }}>{varST === 0 ? '✓' : varST > 0 ? `+${varST}` : varST}</td>
                    <td style={{ ...cellStyle, background: '#fefce8', fontWeight: 700, color: varColor(varOT) }}>{varOT === 0 ? '✓' : varOT > 0 ? `+${varOT}` : varOT}</td>
                    <td style={{ ...cellStyle, background: '#fefce8', fontWeight: 800, color: varColor(varTotal) }}>{varTotal === 0 ? '✓' : varTotal > 0 ? `+${varTotal}` : varTotal}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
        <p style={{ fontSize: '11px', color: 'var(--muted)', marginTop: '8px' }}>
          + variance = more hours on field tickets than time entries &nbsp;·&nbsp; − variance = more hours logged than ticketed &nbsp;·&nbsp; ✓ = match
        </p>
      </section>
    </div>
  )
}
