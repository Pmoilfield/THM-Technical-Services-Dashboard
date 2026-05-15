'use client'
import { useState } from 'react'
import Link from 'next/link'
import { formatDate } from '@/lib/calculations'

const PRIORITY_CLS = { High: 'bad', Normal: '', Low: '' }

function money(v) {
  if (!v) return '—'
  return '$' + parseFloat(v).toLocaleString('en-CA', { minimumFractionDigits: 0, maximumFractionDigits: 0 })
}

function shortDate(iso) {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('en-CA', { year: 'numeric', month: 'short', day: 'numeric' })
}

export default function OpenProposalsTable({ proposals }) {
  const [showDetail, setShowDetail] = useState(false)

  return (
    <section className="panel">
      <div className="split">
        <h2>Open proposals</h2>
        <button className="small" onClick={() => setShowDetail(o => !o)}>
          {showDetail ? 'Hide detail ↑' : 'Show detail ↓'}
        </button>
      </div>
      <div className="table-wrap" style={{ marginTop: '12px' }}>
        <table>
          <thead>
            <tr>
              <th>Client</th>
              <th>Contact</th>
              <th>Description</th>
              <th>Location</th>
              <th>Priority</th>
              <th>Status</th>
              <th className="numeric">Est. Value</th>
              <th>Added</th>
              <th>Due</th>
              <th>Submitted by</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {proposals.length ? proposals.map(p => (
              <tr key={p.id}>
                <td><strong>{p.client_name || '—'}</strong></td>
                <td>
                  {p.contact_name || '—'}
                  {p.contact_phone && <div className="fine-print">{p.contact_phone}</div>}
                  {p.contact_email && <div className="fine-print">{p.contact_email}</div>}
                </td>
                <td style={showDetail ? {} : { maxWidth: '240px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {p.project_description || '—'}
                </td>
                <td>{p.location || '—'}</td>
                <td><span className={`status-pill ${PRIORITY_CLS[p.priority] || ''}`}>{p.priority}</span></td>
                <td><span className={`status-pill ${p.status === 'New' ? 'status-active' : ''}`}>{p.status}</span></td>
                <td className="numeric">{money(p.estimated_value)}</td>
                <td>{p.proposal_added_date ? shortDate(p.proposal_added_date) : '—'}</td>
                <td>{p.due_date ? formatDate(p.due_date) : '—'}</td>
                <td>{p.submitted_by || '—'}</td>
                <td className="nowrap">
                  <div style={{ display: 'flex', gap: '6px' }}>
                    <Link href={`/proposals/${p.id}`}><button className="small">View</button></Link>
                    <Link href={`/proposals/${p.id}/edit`}><button className="small">Edit</button></Link>
                  </div>
                </td>
              </tr>
            )) : (
              <tr><td colSpan="11" className="empty">No open proposals. <Link href="/proposals/new">Add one →</Link></td></tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  )
}
