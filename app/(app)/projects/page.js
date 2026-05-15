import { createServerSupabase } from '@/lib/supabase-server'
import { n, calculateAccruals } from '@/lib/calculations'
import Link from 'next/link'
import ProjectsTable from '@/components/projects/ProjectsTable'

export default async function ProjectsPage() {
  const supabase = await createServerSupabase()
  const [{ data: projects }, { data: tickets }, { data: pos }] = await Promise.all([
    supabase.from('projects').select('*').neq('archived', true).order('updated_at', { ascending: false }),
    supabase.from('field_tickets').select('project_id, subtotal, status'),
    supabase.from('purchase_orders').select('project_id, value, markup'),
  ])

  const rows = (projects || []).map(project => {
    const t = (tickets || []).filter(x => x.project_id === project.id)
    const p = (pos || []).filter(x => x.project_id === project.id)
    const { accrualsToDate } = calculateAccruals(t, p)
    const estimate = n(project.estimate_subtotal)
    const gst = n(project.gst_amount)
    return { project, estimate, gst, accrualsToDate, remaining: estimate - accrualsToDate, spentPct: estimate ? accrualsToDate / estimate : 0 }
  })

  return (
    <div className="grid">
      <div className="page-header">
        <div className="split">
          <div><h1>Projects</h1><p className="muted">{rows.length} active projects</p></div>
          <div className="toolbar">
            <Link href="/projects/archived"><button className="small">Archived</button></Link>
            <Link href="/projects/new"><button className="primary">+ New Project</button></Link>
          </div>
        </div>
      </div>

      <section className="panel">
        <ProjectsTable rows={rows} />
      </section>
    </div>
  )
}
