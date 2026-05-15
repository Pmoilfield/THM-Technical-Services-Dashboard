import { createServerSupabase } from '@/lib/supabase-server'
import Link from 'next/link'
import ArchivedProjectsList from './ArchivedProjectsList'

export default async function ArchivedProjectsPage() {
  const supabase = await createServerSupabase()
  const { data: projects } = await supabase
    .from('projects')
    .select('*')
    .eq('archived', true)
    .order('updated_at', { ascending: false })

  return (
    <div className="grid">
      <div className="page-header">
        <div className="split">
          <div><h1>Archived Projects</h1><p className="muted">{(projects || []).length} archived</p></div>
          <Link href="/projects"><button>Back to projects</button></Link>
        </div>
      </div>

      <section className="panel">
        <ArchivedProjectsList projects={projects || []} />
      </section>
    </div>
  )
}
