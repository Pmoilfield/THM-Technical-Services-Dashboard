'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createBrowserSupabase } from '@/lib/supabase'

export default function InvoiceActions({ invoice }) {
  const supabase = createBrowserSupabase()
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  async function updateStatus(status) {
    setLoading(true)
    await supabase.from('invoices').update({ status }).eq('id', invoice.id)
    router.refresh()
    setLoading(false)
  }

  return (
    <>
      {invoice.status === 'draft' && (
        <button className="primary" disabled={loading} onClick={() => updateStatus('sent')}>
          {loading ? 'Updating…' : 'Mark as Sent'}
        </button>
      )}
      {invoice.status === 'sent' && (
        <button className="primary" disabled={loading} onClick={() => updateStatus('paid')}>
          {loading ? 'Updating…' : 'Mark as Paid'}
        </button>
      )}
      {(invoice.status === 'draft' || invoice.status === 'sent') && (
        <button disabled={loading} onClick={() => updateStatus('void')}>
          Void
        </button>
      )}
    </>
  )
}
