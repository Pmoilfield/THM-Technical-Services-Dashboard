import { createServerSupabase } from '@/lib/supabase-server'
import { notFound } from 'next/navigation'
import EstimateBuilder from '@/components/estimate/EstimateBuilder'

export default async function EstimatePage({ params }) {
  const { id } = await params
  const supabase = await createServerSupabase()

  const [{ data: project }, { data: sections }, { data: items }, { data: rates }] = await Promise.all([
    supabase.from('projects').select('*').eq('id', id).single(),
    supabase.from('estimate_sections').select('*').eq('project_id', id).order('number'),
    supabase.from('estimate_items').select('*').order('sort_order'),
    supabase.from('rates').select('*').order('category').order('personnel'),
  ])

  if (!project) notFound()

  const sectionIds = (sections || []).map(s => s.id)
  const sectionItems = (items || []).filter(i => sectionIds.includes(i.section_id))

  return (
    <EstimateBuilder
      project={project}
      initialSections={sections || []}
      initialItems={sectionItems}
      rates={rates || []}
    />
  )
}
