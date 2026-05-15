import { createAdminSupabase } from '@/lib/supabase-server'
import { revalidatePath } from 'next/cache'

export async function POST() {
  const supabase = createAdminSupabase()

  try {
    // Check schemas
    const { data: sampleTicket } = await supabase
      .from('field_tickets')
      .select('*')
      .limit(1)

    const { data: sampleItem } = await supabase
      .from('field_ticket_items')
      .select('*')
      .limit(1)

    const ticketSchema = sampleTicket && sampleTicket.length > 0 ? Object.keys(sampleTicket[0]) : []
    const itemSchema = sampleItem && sampleItem.length > 0 ? Object.keys(sampleItem[0]) : []

    const { data: projects } = await supabase
      .from('projects')
      .select('id')
      .ilike('name', '%Wainwright%ECAP%')
      .limit(1)

    if (!projects || projects.length === 0) {
      return Response.json({ error: 'Project not found', ticketSchema, itemSchema }, { status: 404 })
    }

    const projectId = projects[0].id
    const ticketsData = [
      {
        number: 863,
        date: '2025-10-17',
        labour: 1685.00,
        equipment: 420.00,
        subtotal: 2105.00,
        lineItems: [
          { description: '23 - Site Supervisor', rate: 95.00, quantity: 8, total: 760.00, type: 'labour' },
          { description: '23 - Site Supervisor', rate: 95.00, quantity: 2, total: 190.00, type: 'labour' },
          { description: '24 - Site Supervisor OT', rate: 142.50, quantity: 2, total: 285.00, type: 'labour' },
          { description: '1 - Project Quality & Controls', rate: 150.00, quantity: 3, total: 450.00, type: 'labour' },
          { description: 'THMC-06 DB Fully Tooled Truck', rate: 35.00, quantity: 12, total: 420.00, type: 'equipment' },
        ]
      },
      {
        number: 1425,
        date: '2026-02-18',
        labour: 475.00,
        equipment: 0,
        subtotal: 475.00,
        lineItems: [
          { description: '23 - Site Supervisor', rate: 95.00, quantity: 5, total: 475.00, type: 'labour' },
        ]
      },
      {
        number: 1430,
        date: '2026-02-19',
        labour: 300.00,
        equipment: 0,
        subtotal: 300.00,
        lineItems: [
          { description: '1 - Project Quality & Controls', rate: 150.00, quantity: 2, total: 300.00, type: 'labour' },
        ]
      }
    ]

    let ticketCount = 0
    let itemCount = 0
    const errors = []

    for (const ticket of ticketsData) {
      const { lineItems, ...ticketData } = ticket

      const { data: fieldTicket, error: ticketError } = await supabase
        .from('field_tickets')
        .insert({
          ticket_number: String(ticketData.number),
          project_id: projectId,
          date: ticketData.date,
          subtotal: ticketData.subtotal,
          labour_total: ticketData.labour || 0,
          equipment_total: ticketData.equipment || 0,
          material_total: 0,
          subcontractor_total: 0,
          status: 'approved',
          description: `Imported from Ontraccr - Ticket ${ticketData.number}`,
          approved_at: new Date().toISOString(),
          created_at: new Date().toISOString(),
        })
        .select()
        .single()

      if (ticketError) {
        errors.push(`Ticket ${ticketData.number}: ${ticketError.message}`)
        continue
      }

      ticketCount++

      if (lineItems && lineItems.length > 0) {
        const itemsToInsert = lineItems.map((item, idx) => {
          const base = {
            ticket_id: fieldTicket.id,
            type: item.type,
            description: item.description,
            total: parseFloat(item.total) || 0,
            sort_order: idx,
          }

          if (item.type === 'labour') {
            return {
              ...base,
              straight_hours: parseFloat(item.quantity) || 0,
              straight_rate: parseFloat(item.rate) || 0,
            }
          } else if (item.type === 'equipment') {
            return {
              ...base,
              quantity: parseFloat(item.quantity) || 0,
              unit_cost: parseFloat(item.rate) || 0,
            }
          } else {
            return {
              ...base,
              quantity: parseFloat(item.quantity) || 0,
              unit_cost: parseFloat(item.rate) || 0,
            }
          }
        })

        const { error: itemsError, data: items } = await supabase
          .from('field_ticket_items')
          .insert(itemsToInsert)
          .select()

        if (itemsError) {
          errors.push(`Items for ticket ${ticketData.number}: ${itemsError.message}`)
        } else if (items) {
          itemCount += items.length
        }
      }
    }

    revalidatePath('/field-tickets')
    revalidatePath(`/projects/${projectId}`)

    return Response.json({
      success: ticketCount > 0,
      ticketsCreated: ticketCount,
      itemsCreated: itemCount,
      projectId: projectId,
      message: `Imported ${ticketCount} field tickets with ${itemCount} line items`,
      errors: errors.length > 0 ? errors : undefined,
      ticketSchema,
      itemSchema
    })
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 })
  }
}
