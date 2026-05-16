'use server'
import { createAdminSupabase, createServerSupabase } from '@/lib/supabase-server'
import { revalidatePath } from 'next/cache'

export async function deleteProject(projectId) {
  // Verify caller is an admin
  const auth = await createServerSupabase()
  const { data: { user } } = await auth.auth.getUser()
  if (!user) return { error: 'Not authenticated' }
  const { data: profile } = await auth.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin') return { error: 'Only admins can delete projects' }

  const supabase = createAdminSupabase()

  // Get section IDs
  const { data: sections } = await supabase.from('estimate_sections').select('id').eq('project_id', projectId)
  const sectionIds = (sections || []).map(s => s.id)
  if (sectionIds.length) {
    const { error } = await supabase.from('estimate_items').delete().in('section_id', sectionIds)
    if (error) return { error: error.message }
  }
  const { error: secErr } = await supabase.from('estimate_sections').delete().eq('project_id', projectId)
  if (secErr) return { error: secErr.message }

  // Get ticket IDs
  const { data: tickets } = await supabase.from('field_tickets').select('id').eq('project_id', projectId)
  const ticketIds = (tickets || []).map(t => t.id)
  if (ticketIds.length) {
    const { error } = await supabase.from('field_ticket_items').delete().in('ticket_id', ticketIds)
    if (error) return { error: error.message }
  }
  const { error: ticketErr } = await supabase.from('field_tickets').delete().eq('project_id', projectId)
  if (ticketErr) return { error: ticketErr.message }

  // Get PO IDs
  const { data: pos } = await supabase.from('purchase_orders').select('id').eq('project_id', projectId)
  const poIds = (pos || []).map(p => p.id)
  if (poIds.length) {
    const { error } = await supabase.from('po_items').delete().in('po_id', poIds)
    if (error) return { error: error.message }
  }
  const { error: poErr } = await supabase.from('purchase_orders').delete().eq('project_id', projectId)
  if (poErr) return { error: poErr.message }

  const { error: invErr } = await supabase.from('invoices').delete().eq('project_id', projectId)
  if (invErr) return { error: invErr.message }

  const { error: propErr } = await supabase.from('proposals').delete().eq('converted_project_id', projectId)
  if (propErr) return { error: propErr.message }

  const { error: projErr } = await supabase.from('projects').delete().eq('id', projectId)
  if (projErr) return { error: projErr.message }

  revalidatePath('/projects')
  return { success: true }
}
