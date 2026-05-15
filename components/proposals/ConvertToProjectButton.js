'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createBrowserSupabase } from '@/lib/supabase'

export default function ConvertToProjectButton({ proposal }) {
  const router = useRouter()
  const supabase = createBrowserSupabase()
  const [loading, setLoading] = useState(false)

  async function convert() {
    if (!confirm(`Convert "${proposal.client_name || 'this proposal'}" to a project in Estimating?`)) return
    setLoading(true)

    // Create the project
    const { data: project, error: projErr } = await supabase.from('projects').insert({
      name: proposal.client_name ? `${proposal.client_name} — ${proposal.project_description?.slice(0, 60) || 'New Project'}` : (proposal.project_description?.slice(0, 80) || 'New Project'),
      client_name: proposal.client_name,
      location: proposal.location,
      status: 'Estimating',
      description: proposal.project_description,
      updated_at: new Date().toISOString(),
    }).select().single()

    if (projErr) { alert(projErr.message); setLoading(false); return }

    // Mark proposal as converted
    await supabase.from('proposals').update({
      status: 'Converted',
      converted_project_id: project.id,
      updated_at: new Date().toISOString(),
    }).eq('id', proposal.id)

    router.push(`/projects/${project.id}`)
    router.refresh()
  }

  return (
    <button className="primary" onClick={convert} disabled={loading}>
      {loading ? 'Converting…' : 'Convert to project →'}
    </button>
  )
}
