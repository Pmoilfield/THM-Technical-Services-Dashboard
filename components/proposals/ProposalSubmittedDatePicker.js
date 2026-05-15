'use client'
import { useState } from 'react'
import { updateProposalSubmittedDate } from '@/app/actions/updateProposalSubmittedDate'

function shortDate(iso) {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('en-CA', { year: 'numeric', month: 'short', day: 'numeric' })
}

export default function ProposalSubmittedDatePicker({ proposalId, currentDate }) {
  const [open, setOpen] = useState(false)
  const [date, setDate] = useState(currentDate ? currentDate.split('T')[0] : '')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleSave() {
    if (!date) return

    setError('')
    setLoading(true)

    const result = await updateProposalSubmittedDate(proposalId, date)

    if (result.error) {
      setError(result.error)
      setLoading(false)
    } else {
      setOpen(false)
      setLoading(false)
    }
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        style={{
          background: 'none',
          border: 'none',
          padding: '0',
          cursor: 'pointer',
          color: currentDate ? '#111' : '#9ca3af',
          textDecoration: currentDate ? 'none' : 'underline',
          fontSize: '14px',
        }}
      >
        {shortDate(currentDate)}
      </button>
    )
  }

  return (
    <div style={{
      position: 'absolute',
      background: '#fff',
      border: '1px solid #d1d5db',
      borderRadius: '6px',
      padding: '12px',
      boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
      zIndex: 50,
      minWidth: '200px',
    }}>
      <input
        type="date"
        value={date}
        onChange={e => setDate(e.target.value)}
        style={{
          width: '100%',
          padding: '6px',
          borderRadius: '4px',
          border: '1px solid #d1d5db',
          fontSize: '14px',
          marginBottom: '8px',
          boxSizing: 'border-box',
        }}
      />
      {error && (
        <div style={{
          color: '#dc2626',
          fontSize: '12px',
          marginBottom: '8px',
          background: '#fee2e2',
          padding: '6px',
          borderRadius: '4px',
        }}>
          {error}
        </div>
      )}
      <div style={{ display: 'flex', gap: '6px', justifyContent: 'flex-end' }}>
        <button
          onClick={() => setOpen(false)}
          disabled={loading}
          style={{
            padding: '6px 12px',
            borderRadius: '4px',
            background: '#f3f4f6',
            border: 'none',
            cursor: 'pointer',
            fontSize: '12px',
          }}
        >
          Cancel
        </button>
        <button
          onClick={handleSave}
          disabled={loading || !date}
          style={{
            padding: '6px 12px',
            borderRadius: '4px',
            background: date ? '#b91c1c' : '#d1d5db',
            color: '#fff',
            border: 'none',
            cursor: date ? 'pointer' : 'not-allowed',
            fontSize: '12px',
          }}
        >
          {loading ? 'Saving...' : 'Save'}
        </button>
      </div>
    </div>
  )
}
