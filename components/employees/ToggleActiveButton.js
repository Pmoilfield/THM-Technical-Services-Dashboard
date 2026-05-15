'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createBrowserSupabase } from '@/lib/supabase'

export default function ToggleActiveButton({ workerId, active }) {
  const supabase = createBrowserSupabase()
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  async function toggle() {
    setLoading(true)
    await supabase.from('workers').update({ active: !active }).eq('id', workerId)
    router.refresh()
  }

  return (
    <button onClick={toggle} disabled={loading} className="small" style={{ minWidth: '80px' }}>
      {loading ? '...' : active ? 'Set Inactive' : 'Set Active'}
    </button>
  )
}
