'use client'
import { useState } from 'react'
import { sendProjectToProposals } from '@/app/actions/sendProjectToProposals'
import Link from 'next/link'

export default function SendToProposalsButton({ projectId, projectName, clientName, estimatedValue, hasProposal }) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleSend() {
    if (hasProposal) {
      window.location.href = '/proposals'
      return
    }

    setError('')
    setLoading(true)

    const result = await sendProjectToProposals(projectId, projectName, clientName, estimatedValue)

    if (result.error) {
      setError(result.error)
      setLoading(false)
    } else {
      window.location.href = '/proposals'
    }
  }

  if (hasProposal) {
    return (
      <button
        onClick={handleSend}
        style={{ borderRadius: '8px' }}
        title="View in proposal pipeline"
      >
        In Pipeline
      </button>
    )
  }

  return (
    <>
      <button
        onClick={handleSend}
        disabled={loading}
        style={{ borderRadius: '8px' }}
        title="Send to proposal pipeline"
      >
        {loading ? 'Sending...' : 'Send to Proposals'}
      </button>
      {error && <div className="notice danger" style={{ marginTop: '8px', fontSize: '12px' }}>{error}</div>}
    </>
  )
}
