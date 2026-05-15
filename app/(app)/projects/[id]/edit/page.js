import { createServerSupabase } from '@/lib/supabase-server'
import { notFound } from 'next/navigation'
import EditProjectForm from '@/components/projects/EditProjectForm'

export default async function EditProjectPage({ params }) {
  const { id } = await params
  const supabase = await createServerSupabase()
  const { data: project } = await supabase.from('projects').select('*').eq('id', id).single()
  if (!project) notFound()
  return <EditProjectForm project={project} />
}
