'use server'
import { createAdminSupabase } from '@/lib/supabase-server'
import { revalidatePath } from 'next/cache'

export async function bulkImportFieldTicketsWithItems(ticketsData) {
  const supabase = createAdminSupabase()

  try {
    // Find the Wainwright ECAP project
    const { data: projects } = await supabase
      .from('projects')
      .select('id')
      .ilike('name', '%Wainwright%ECAP%')
      .limit(1)

    if (!projects || projects.length === 0) {
      return { error: 'Could not find Wainwright ECAP project' }
    }

    const projectId = projects[0].id
    let createdCount = 0
    let createdItems = 0

    // Import each ticket
    for (const ticket of ticketsData) {
      const { lineItems, ...ticketData } = ticket

      // Create field ticket
      const { data: fieldTicket, error: ticketError } = await supabase
        .from('field_tickets')
        .insert({
          ticket_number: String(ticketData.number),
          project_id: projectId,
          date: ticketData.date,
          subtotal: ticketData.subtotal,
          labour: ticketData.labour || 0,
          equipment: ticketData.equipment || 0,
          materials: ticketData.materials || 0,
          subcontractor: ticketData.subcontractor || 0,
          status: ticketData.status,
          notes: ticketData.notes,
          created_at: new Date().toISOString(),
        })
        .select()
        .single()

      if (ticketError) {
        console.error(`Error creating ticket ${ticketData.number}:`, ticketError)
        continue
      }

      createdCount++

      // Create line items
      if (lineItems && lineItems.length > 0) {
        const itemsToInsert = lineItems.map(item => ({
          field_ticket_id: fieldTicket.id,
          description: item.description,
          rate: parseFloat(item.rate) || 0,
          quantity: parseFloat(item.quantity) || 0,
          total: parseFloat(item.total) || 0,
          item_type: item.type, // labour, equipment, material, subcontractor
        }))

        const { error: itemsError } = await supabase
          .from('field_ticket_items')
          .insert(itemsToInsert)

        if (!itemsError) {
          createdItems += itemsToInsert.length
        }
      }
    }

    revalidatePath('/field-tickets')
    revalidatePath(`/projects/${projectId}`)

    return {
      success: true,
      ticketsCreated: createdCount,
      itemsCreated: createdItems,
      projectId,
    }
  } catch (err) {
    return { error: err.message }
  }
}
