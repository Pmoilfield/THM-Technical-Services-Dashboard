'use server'
import { createAdminSupabase } from '@/lib/supabase-server'
import { revalidatePath } from 'next/cache'

export async function bulkImportFieldTickets(ticketsData) {
  const supabase = createAdminSupabase()

  try {
    // First, find the Wainwright ECAP project
    const { data: projects } = await supabase
      .from('projects')
      .select('id')
      .ilike('name', '%Wainwright%ECAP%')
      .limit(1)

    if (!projects || projects.length === 0) {
      return { error: 'Could not find Wainwright ECAP project' }
    }

    const projectId = projects[0].id

    // Prepare field tickets for insertion
    const ticketsToInsert = ticketsData.map(ticket => ({
      ticket_number: String(ticket.number),
      project_id: projectId,
      date: ticket.date,
      subtotal: parseFloat(ticket.subtotal) || 0,
      labour: parseFloat(ticket.labour) || 0,
      equipment: parseFloat(ticket.equipment) || 0,
      materials: parseFloat(ticket.materials) || 0,
      subcontractor: parseFloat(ticket.subcontractor) || 0,
      status: ticket.invoiced ? 'approved' : 'submitted',
      notes: `Imported from Ontraccr. User: ${ticket.user || 'Unknown'}`,
      created_at: new Date().toISOString(),
    }))

    const { data, error } = await supabase
      .from('field_tickets')
      .insert(ticketsToInsert)
      .select()

    if (error) return { error: error.message }

    revalidatePath('/field-tickets')
    revalidatePath(`/projects/${projectId}`)

    return { success: true, count: data.length, projectId }
  } catch (err) {
    return { error: err.message }
  }
}
