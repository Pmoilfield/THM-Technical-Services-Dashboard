'use server'
import { createAdminSupabase, createServerSupabase } from '@/lib/supabase-server'
import { revalidatePath } from 'next/cache'

export async function deleteFieldTicket(ticketId) {
  const auth = await createServerSupabase()
  const { data: { user } } = await auth.auth.getUser()
  if (!user) return { error: 'Not authenticated' }
  const { data: profile } = await auth.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin') return { error: 'Only admins can delete tickets' }

  const supabase = createAdminSupabase()
  const { error } = await supabase.from('field_tickets')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', ticketId)
  if (error) return { error: error.message }

  revalidatePath('/field-tickets')
  revalidatePath('/settings')
  return { success: true }
}
