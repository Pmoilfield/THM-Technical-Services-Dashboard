import { createServerSupabase } from '@/lib/supabase-server'
import { notFound } from 'next/navigation'
import NewPOForm from '@/components/pos/NewPOForm'

export default async function NewPOPage({ params }) {
  const { id } = await params
  const supabase = await createServerSupabase()
  const { data: project } = await supabase.from('projects').select('id, name, client_name').eq('id', id).single()
  if (!project) notFound()
  return <NewPOForm project={project} />
}
