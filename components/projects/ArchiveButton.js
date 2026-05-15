'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createBrowserSupabase } from '@/lib/supabase'

export default function ArchiveButton({ projectId, archived }) {
  const supabase = createBrowserSupabase()
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  async function toggle() {
    if (!archived && !confirm('Archive this project? It will be hidden from the main dashboard and project list.')) return
    setLoading(true)
    await supabase.from('projects').update({ archived: !archived }).eq('id', projectId)
    router.push('/projects')
    router.refresh()
  }

  return (
    <button onClick={toggle} disabled={loading} className={archived ? 'small' : 'small danger'} style={{ borderRadius: '8px' }}>
      {loading ? '...' : archived ? 'Restore project' : 'Archive'}
    </button>
  )
}
