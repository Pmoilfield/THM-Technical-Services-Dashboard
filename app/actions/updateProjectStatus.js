'use server'
import { createAdminSupabase } from '@/lib/supabase-server'
import { revalidatePath } from 'next/cache'

export async function updateProjectStatus(projectId, newStatus) {
  const supabase = createAdminSupabase()

  const { error } = await supabase
    .from('projects')
    .update({ status: newStatus, updated_at: new Date().toISOString() })
    .eq('id', projectId)

  if (error) return { error: error.message }

  revalidatePath('/projects')
  return { success: true }
}
