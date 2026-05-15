import { createServerSupabase } from '@/lib/supabase-server'
import TimeEntryForm from '@/components/time-entry/TimeEntryForm'

export default async function TimeEntryPage() {
  const supabase = await createServerSupabase()

  const { data: { user } } = await supabase.auth.getUser()

  const [{ data: projects }, { data: workers }, { data: recentEntries }] = await Promise.all([
    supabase.from('projects').select('id, name, internal_job_no').neq('archived', true).order('name'),
    supabase.from('workers').select('id, name').eq('active', true).order('name'),
    supabase.from('time_entries')
      .select('*, projects(name), workers(name)')
      .order('date', { ascending: false })
      .order('created_at', { ascending: false })
      .limit(50),
  ])

  return (
    <TimeEntryForm
      projects={projects || []}
      workers={workers || []}
      recentEntries={recentEntries || []}
    />
  )
}
