'use client'
import { useState } from 'react'
import { createBrowserSupabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

export default function LinkWorkerSelect({ userId, workers, currentWorkerId }) {
  const supabase = createBrowserSupabase()
  const router   = useRouter()
  const [saving, setSaving] = useState(false)

  async function handleChange(e) {
    const newWorkerId = e.target.value
    setSaving(true)

    // Unlink previous worker that had this auth_user_id
    await supabase.from('workers').update({ auth_user_id: null }).eq('auth_user_id', userId)

    // Link new worker if one was selected
    if (newWorkerId) {
      await supabase.from('workers').update({ auth_user_id: userId }).eq('id', newWorkerId)
    }

    setSaving(false)
    router.refresh()
  }

  return (
    <select
      defaultValue={currentWorkerId}
      onChange={handleChange}
      disabled={saving}
      style={{ fontSize: '12px', padding: '3px 6px', minWidth: '160px', opacity: saving ? 0.5 : 1 }}
    >
      <option value="">— Not linked —</option>
      {workers.map(w => (
        <option key={w.id} value={w.id}>{w.name}</option>
      ))}
    </select>
  )
}
