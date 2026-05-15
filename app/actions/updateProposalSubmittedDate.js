'use server'
import { createAdminSupabase } from '@/lib/supabase-server'
import { revalidatePath } from 'next/cache'

export async function updateProposalSubmittedDate(proposalId, date) {
  const supabase = createAdminSupabase()

  const { error } = await supabase
    .from('proposals')
    .update({
      proposal_submitted_date: date,
      updated_at: new Date().toISOString(),
    })
    .eq('id', proposalId)

  if (error) return { error: error.message }

  revalidatePath('/proposals')
  return { success: true }
}
