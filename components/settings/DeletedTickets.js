'use client'
import { useState } from 'react'
import { restoreFieldTicket } from '@/app/actions/restoreFieldTicket'
import { useRouter } from 'next/navigation'

function formatDate(d) {
  if (!d) return '—'
  return new Date(d).toLocaleDateString('en-CA', { year: 'numeric', month: 'short', day: 'numeric' })
}

export default function DeletedTickets({ tickets }) {
  const router = useRouter()
  const [restoring, setRestoring] = useState(null)
  const [error, setError] = useState('')

  async function handleRestore(ticketId) {
    setRestoring(ticketId)
    setError('')
    const res = await restoreFieldTicket(ticketId)
    if (res.error) { setError(res.error); setRestoring(null); return }
    router.refresh()
    setRestoring(null)
  }

  if (!tickets.length) {
    return (
      <section className="panel">
        <h2>Deleted Field Tickets</h2>
        <p className="empty" style={{ marginTop: '12px' }}>No deleted tickets.</p>
      </section>
    )
  }

  const thStyle = { padding: '6px 8px', background: '#f8fafc', fontWeight: 700, fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.04em', color: '#475467', borderBottom: '2px solid var(--line)', whiteSpace: 'nowrap' }
  const tdStyle = { padding: '7px 8px', fontSize: '13px', borderBottom: '1px solid var(--line)' }

  return (
    <section className="panel">
      <h2>Deleted Field Tickets</h2>
      {error && <p style={{ fontSize: '13px', color: 'var(--danger)', marginTop: '8px' }}>{error}</p>}
      <div className="table-wrap" style={{ marginTop: '14px' }}>
        <table>
          <thead>
            <tr>
              <th style={thStyle}>Ticket #</th>
              <th style={thStyle}>Project</th>
              <th style={thStyle}>Date</th>
              <th style={thStyle}>Deleted</th>
              <th style={thStyle} />
            </tr>
          </thead>
          <tbody>
            {tickets.map(t => (
              <tr key={t.id}>
                <td style={tdStyle}><strong>{t.ticket_number}</strong></td>
                <td style={tdStyle}>{t.projects?.name || '—'}</td>
                <td style={tdStyle}>{formatDate(t.date)}</td>
                <td style={tdStyle}>{formatDate(t.deleted_at)}</td>
                <td style={{ ...tdStyle, textAlign: 'right' }}>
                  <button
                    className="small"
                    onClick={() => handleRestore(t.id)}
                    disabled={restoring === t.id}
                  >
                    {restoring === t.id ? 'Restoring…' : 'Restore'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  )
}
