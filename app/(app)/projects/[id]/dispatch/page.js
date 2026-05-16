import { createServerSupabase } from '@/lib/supabase-server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import DispatchPanel from '@/components/dispatch/DispatchPanel'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export default async function DispatchPage({ params }) {
  const supabase = await createServerSupabase()
  const { id } = await params

  const { data: project } = await supabase
    .from('projects')
    .select('id, name, client_name, internal_job_no, location, start_date, end_date, status')
    .eq('id', id)
    .single()

  if (!project) notFound()

  const [
    { data: workers },
    { data: crewWindows },
    { data: crewRequirements },
    { data: crewAssignments },
    { data: allWindows },
  ] = await Promise.all([
    supabase.from('workers').select('id, name, active, default_rate_id, rates(category), worker_certifications(id, cert_type, cert_number, expiry_date)').eq('active', true).order('name'),
    supabase.from('project_crew_windows').select('*').eq('project_id', id).order('start_date'),
    supabase.from('crew_window_requirements').select('*'),
    supabase.from('crew_window_assignments').select('*'),
    supabase.from('project_crew_windows').select('*, projects(name)'),
  ])

  return (
    <div className="grid">
      <div className="page-header">
        <div className="split">
          <div>
            <p style={{ fontSize: '12px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--muted)', marginBottom: '8px' }}>
              <Link href={`/projects/${id}`} style={{ color: 'var(--muted)', textDecoration: 'none' }}>
                ← {project.name}
              </Link>
            </p>
            <h1>Dispatch</h1>
            <p className="muted">
              {project.client_name || 'No client'}
              {project.location ? ` · ${project.location}` : ''}
              {project.internal_job_no ? ` · ${project.internal_job_no}` : ''}
            </p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Link href={`/projects/${id}`}><button style={{ borderRadius: '8px' }}>← Back to Project</button></Link>
          </div>
        </div>
      </div>

      <section className="panel">
        <DispatchPanel
          project={project}
          initialWindows={crewWindows || []}
          initialRequirements={crewRequirements || []}
          initialAssignments={crewAssignments || []}
          workers={workers || []}
          allWindows={allWindows || []}
        />
      </section>
    </div>
  )
}
