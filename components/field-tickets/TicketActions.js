'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createBrowserSupabase } from '@/lib/supabase'

export default function TicketActions({ ticket }) {
  const router = useRouter()
  const supabase = createBrowserSupabase()
  const [loading, setLoading] = useState(false)
  const [showReject, setShowReject] = useState(false)
  const [reason, setReason] = useState('')

  async function approve() {
    setLoading(true)
    await supabase.from('field_tickets').update({
      status: 'approved',
      approved_at: new Date().toISOString(),
    }).eq('id', ticket.id)
    router.refresh()
    setLoading(false)
  }

  async function reject() {
    if (!reason.trim()) return
    setLoading(true)
    await supabase.from('field_tickets').update({
      status: 'rejected',
      rejection_reason: reason,
    }).eq('id', ticket.id)
    router.refresh()
    setShowReject(false)
    setLoading(false)
  }

  return (
    <>
      {ticket.status === 'submitted' && (
        <>
          <button className="primary" onClick={approve} disabled={loading}>Approve</button>
          <button className="danger" onClick={() => setShowReject(true)} disabled={loading}>Reject</button>
        </>
      )}
      {ticket.status === 'approved' && (
        <button onClick={() => { setLoading(true); supabase.from('field_tickets').update({ status: 'draft', approved_at: null }).eq('id', ticket.id).then(() => { router.refresh(); setLoading(false) }) }} disabled={loading}>
          Reopen as Draft
        </button>
      )}
      <a href={`/print/field-ticket/${ticket.id}`} target="_blank" rel="noreferrer">
        <button>Generate PDF</button>
      </a>

      {showReject && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ background: 'white', borderRadius: '16px', padding: '28px', width: '440px', boxShadow: '0 20px 60px rgba(0,0,0,0.2)' }}>
            <h2 style={{ marginBottom: '12px' }}>Reject ticket</h2>
            <p style={{ fontSize: '14px', color: 'var(--muted)', marginBottom: '16px' }}>Provide a reason so the worker knows what to fix.</p>
            <textarea
              value={reason}
              onChange={e => setReason(e.target.value)}
              rows={3}
              placeholder="e.g. Hours don't match site report, please review..."
              style={{ width: '100%' }}
              autoFocus
            />
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '16px' }}>
              <button onClick={() => setShowReject(false)}>Cancel</button>
              <button className="danger" onClick={reject} disabled={!reason.trim() || loading}>
                {loading ? 'Rejecting...' : 'Confirm reject'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
