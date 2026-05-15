'use server'
import { createAdminSupabase } from '@/lib/supabase-server'
import { revalidatePath } from 'next/cache'

export async function sendProjectToProposals(projectId, projectName, clientName, estimatedValue) {
  const supabase = createAdminSupabase()

  try {
    const { data, error } = await supabase
      .from('proposals')
      .insert({
        client_name: clientName || null,
        project_description: projectName,
        estimated_value: estimatedValue || 0,
        status: 'Converted',
        converted_project_id: projectId,
      })
      .select()
      .single()

    if (error) return { error: error.message }

    // Update project status to Submitted
    await supabase
      .from('projects')
      .update({ status: 'Submitted', updated_at: new Date().toISOString() })
      .eq('id', projectId)

    revalidatePath('/proposals')
    return { success: true, proposalId: data.id }
  } catch (err) {
    return { error: err.message }
  }
}
