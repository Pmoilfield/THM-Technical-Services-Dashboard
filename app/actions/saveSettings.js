'use server'
import { createServerSupabase } from '@/lib/supabase-server'
import { revalidatePath } from 'next/cache'

export async function saveSettings(fields) {
  const supabase = await createServerSupabase()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin') return { error: 'Only admins can change settings' }

  // Upsert each key/value pair into the settings table
  const rows = Object.entries(fields).map(([key, value]) => ({ key, value }))
  const { error } = await supabase.from('settings').upsert(rows, { onConflict: 'key' })
  if (error) return { error: error.message }

  revalidatePath('/settings')
  return { success: true }
}
