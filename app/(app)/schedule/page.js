import { createServerSupabase } from '@/lib/supabase-server'
import ScheduleClient from './ScheduleClient'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export default async function SchedulePage() {
  const supabase = await createServerSupabase()

  const [
    { data: projects },
    { data: workers },
    { data: assignments },
    { data: holidays },
    { data: rates },
  ] = await Promise.all([
    supabase
      .from('projects')
      .select('id, name, client_name, internal_job_no, location, project_manager, start_date, end_date, status')
      .neq('archived', true)
      .in('status', ['Active', 'Estimating'])
      .not('start_date', 'is', null)
      .order('start_date', { ascending: true }),
    supabase
      .from('workers')
      .select('id, name, active, default_rate_id')
      .eq('active', true)
      .order('name'),
    supabase
      .from('project_assignments')
      .select('id, project_id, worker_id, trade, notes'),
    supabase
      .from('worker_holidays')
      .select('id, worker_id, start_date, end_date, description'),
    supabase
      .from('rates')
      .select('id, category')
      .not('category', 'eq', 'Equipment'),
  ])

  return (
    <ScheduleClient
      projects={projects || []}
      workers={workers || []}
      assignments={assignments || []}
      holidays={holidays || []}
      rates={rates || []}
    />
  )
}
