import { createServerSupabase } from '@/lib/supabase-server'
import { formatDate, statusClass } from '@/lib/calculations'
import Link from 'next/link'

export default async function ArchivedProjectsPage() {
  const supabase = await createServerSupabase()
  const { data: projects } = await supabase
    .from('projects')
    .select('*')
    .eq('archived', true)
    .order('updated_at', { ascending: false })

  const list = projects || []

  return (
    <div className="grid">
      <div className="page-header">
        <div className="split">
          <div><h1>Archived Projects</h1><p className="muted">{list.length} archived</p></div>
          <Link href="/projects"><button>Back to projects</button></Link>
        </div>
      </div>

      <section className="panel">
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Project</th><th>Client</th><th>Status</th><th>Manager</th><th>Last updated</th><th></th>
              </tr>
            </thead>
            <tbody>
              {list.length ? list.map(project => (
                <tr key={project.id}>
                  <td>
                    <strong>{project.name}</strong>
                    <div className="fine-print">{project.internal_job_no || ''}</div>
                  </td>
                  <td>{project.client_name || '—'}</td>
                  <td><span className={`status-pill ${statusClass(project.status)}`}>{project.status}</span></td>
                  <td>{project.project_manager || '—'}</td>
                  <td>{formatDate(project.updated_at)}</td>
                  <td><Link href={`/projects/${project.id}`}><button className="small">Open</button></Link></td>
                </tr>
              )) : (
                <tr><td colSpan="6" className="empty">No archived projects.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  )
}
