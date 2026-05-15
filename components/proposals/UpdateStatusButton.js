'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createBrowserSupabase } from '@/lib/supabase'

const STATUSES = ['New', 'In Review', 'Lost']

export default function UpdateStatusButton({ proposalId, currentStatus }) {
  const router = useRouter()
  const supabase = createBrowserSupabase()

  async function update(status) {
    await supabase.from('proposals').update({ status, updated_at: new Date().toISOString() }).eq('id', proposalId)
    router.refresh()
  }

  return (
    <select
      value={currentStatus}
      onChange={e => update(e.target.value)}
      style={{ fontSize: '13px', padding: '6px 10px', borderRadius: '8px', border: '1px solid var(--line)' }}
    >
      {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
    </select>
  )
}
