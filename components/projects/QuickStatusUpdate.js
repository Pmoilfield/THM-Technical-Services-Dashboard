'use client'
import { useState } from 'react'
import { updateProjectStatus } from '@/app/actions/updateProjectStatus'

const STATUSES = ['Estimating', 'Submitted', 'Awarded', 'Active', 'Complete', 'On Hold', 'Cancelled']

export default function QuickStatusUpdate({ projectId, currentStatus, onSuccess }) {
  const [open, setOpen] = useState(false)
  const [selectedStatus, setSelectedStatus] = useState(currentStatus)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleConfirm() {
    if (selectedStatus === currentStatus) {
      setOpen(false)
      return
    }

    setError('')
    setLoading(true)

    const result = await updateProjectStatus(projectId, selectedStatus)

    if (result.error) {
      setError(result.error)
      setLoading(false)
    } else {
      setOpen(false)
      setLoading(false)
      if (onSuccess) onSuccess()
    }
  }

  if (!open) {
    return (
      <button
        onClick={(e) => { e.stopPropagation(); setOpen(true) }}
        style={{ fontSize: '11px', padding: '3px 6px' }}
        className="small"
        title="Change status"
      >
        ✎
      </button>
    )
  }

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(0,0,0,0.3)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
    }} onClick={() => !loading && setOpen(false)}>
      <div
        style={{
          background: '#fff',
          borderRadius: '8px',
          padding: '24px',
          maxWidth: '360px',
          boxShadow: '0 4px 16px rgba(0,0,0,0.15)',
        }}
        onClick={e => e.stopPropagation()}
      >
        <h3 style={{ marginTop: 0, marginBottom: '16px' }}>Change project status</h3>

        <div style={{ marginBottom: '16px' }}>
          <label style={{ display: 'block', fontSize: '12px', marginBottom: '6px', fontWeight: 500 }}>
            Select new status
          </label>
          <select
            value={selectedStatus}
            onChange={e => setSelectedStatus(e.target.value)}
            style={{
              width: '100%',
              padding: '8px',
              borderRadius: '4px',
              border: '1px solid #d1d5db',
              fontSize: '14px',
            }}
          >
            {STATUSES.map(s => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </div>

        {error && (
          <div style={{
            background: '#fecaca',
            color: '#991b1b',
            padding: '8px 12px',
            borderRadius: '4px',
            fontSize: '12px',
            marginBottom: '16px',
          }}>
            {error}
          </div>
        )}

        <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
          <button
            onClick={() => setOpen(false)}
            disabled={loading}
            style={{
              padding: '6px 12px',
              borderRadius: '4px',
              background: '#f3f4f6',
              border: 'none',
              cursor: 'pointer',
            }}
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            disabled={loading || selectedStatus === currentStatus}
            className="primary"
            style={{
              padding: '6px 12px',
              borderRadius: '4px',
              cursor: selectedStatus === currentStatus ? 'not-allowed' : 'pointer',
              opacity: selectedStatus === currentStatus ? 0.5 : 1,
            }}
          >
            {loading ? 'Updating...' : 'Confirm'}
          </button>
        </div>
      </div>
    </div>
  )
}
