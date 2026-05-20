import { createServerSupabase } from '@/lib/supabase-server'
import TimeEntryForm from '@/components/time-entry/TimeEntryForm'

export const dynamic = 'force-dynamic'

export default async function TimeEntryPage() {
  const supabase = await createServerSupabase()

  const { data: { user } } = await supabase.auth.getUser()

  const [{ data: profile }, { data: allProjects }, { data: workers }] = await Promise.all([
    supabase.from('profiles').select('role').eq('id', user.id).single(),
    supabase.from('projects').select('id, name, internal_job_no').neq('archived', true).order('name'),
    supabase.from('workers').select('id, name').eq('active', true).order('name'),
  ])

  const isWorker = ['worker', 'foreman'].includes(profile?.role)

  // If the user is a worker, find their linked worker record
  let lockedWorker = null
  let projects = allProjects || []

  if (isWorker) {
    const { data: workerRecord } = await supabase
      .from('workers')
      .select('id, name')
      .eq('auth_user_id', user.id)
      .single()

    if (workerRecord) {
      lockedWorker = workerRecord

      // Only show projects this worker is actually dispatched to
      const { data: assignments } = await supabase
        .from('crew_window_assignments')
        .select('project_crew_windows(project_id)')
        .eq('worker_id', workerRecord.id)

      const projectIds = [...new Set(
        (assignments || [])
          .map(a => a.project_crew_windows?.project_id)
          .filter(Boolean)
      )]

      projects = projectIds.length
        ? (allProjects || []).filter(p => projectIds.includes(p.id))
        : []
    }
  }

  // Recent entries — workers only see their own
  const recentQuery = supabase
    .from('time_entries')
    .select('*, projects(name), workers(name)')
    .order('date', { ascending: false })
    .order('created_at', { ascending: false })
    .limit(50)

  if (lockedWorker) {
    recentQuery.eq('worker_id', lockedWorker.id)
  }

  const { data: recentEntries } = await recentQuery

  return (
    <TimeEntryForm
      projects={projects}
      workers={workers || []}
      recentEntries={recentEntries || []}
      lockedWorker={lockedWorker}
    />
  )
}
