import { createServerSupabase } from '@/lib/supabase-server'
import { notFound } from 'next/navigation'
import DispatchClient from './DispatchClient'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export default async function ProjectDispatchPage({ params }) {
  const { id } = await params
  const supabase = await createServerSupabase()

  const [
    { data: project },
    { data: workers },
    { data: windows },
    { data: allWindows },
    { data: windowAssignments },
    { data: holidays },
    { data: rates },
  ] = await Promise.all([
    supabase
      .from('projects')
      .select('id, name, client_name, internal_job_no, location, project_manager, start_date, end_date, status')
      .eq('id', id)
      .single(),
    supabase
      .from('workers')
      .select('id, name, active, default_rate_id, worker_certifications(id, cert_type, expiry_date)')
      .eq('active', true)
      .order('name'),
    supabase
      .from('project_crew_windows')
      .select('*, crew_window_requirements(*)')
      .eq('project_id', id)
      .order('start_date'),
    // All windows across all projects for conflict detection
    supabase
      .from('project_crew_windows')
      .select('id, project_id, start_date, end_date'),
    supabase
      .from('crew_window_assignments')
      .select('*'),
    supabase
      .from('worker_holidays')
      .select('id, worker_id, start_date, end_date, description'),
    supabase
      .from('rates')
      .select('id, category, personnel')
      .not('category', 'eq', 'Equipment'),
  ])

  if (!project) notFound()

  return (
    <DispatchClient
      project={project}
      workers={workers || []}
      windows={windows || []}
      allWindows={allWindows || []}
      windowAssignments={windowAssignments || []}
      holidays={holidays || []}
      rates={rates || []}
    />
  )
}
