import { createServerSupabase } from '@/lib/supabase-server'
import { notFound } from 'next/navigation'
import ProposalForm from '@/components/proposals/ProposalForm'

export default async function EditProposalPage({ params }) {
  const { id } = await params
  const supabase = await createServerSupabase()
  const { data: proposal } = await supabase.from('proposals').select('*').eq('id', id).single()
  if (!proposal) notFound()
  return <ProposalForm proposal={proposal} />
}
