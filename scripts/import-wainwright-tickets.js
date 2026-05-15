import { createAdminSupabase } from '../lib/supabase-server.js'

async function importTickets() {
  const supabase = createAdminSupabase()

  try {
    // Find the Wainwright ECAP project
    const { data: projects, error: projectError } = await supabase
      .from('projects')
      .select('id')
      .ilike('name', '%Wainwright%ECAP%')
      .limit(1)

    if (projectError || !projects || projects.length === 0) {
      console.error('❌ Could not find Wainwright ECAP project')
      return
    }

    const projectId = projects[0].id
    console.log(`✓ Found project: ${projectId}`)

    const ticketsData = [
      {
        number: 863,
        date: '2025-10-17',
        labour: 1685.00,
        equipment: 420.00,
        subtotal: 2105.00,
        status: 'approved',
        notes: 'Imported from Ontraccr - Ticket 863. Completed by: Danny Bowerman',
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
        status: 'approved',
        notes: 'Imported from Ontraccr - Ticket 1425. Completed by: Danny Bowerman',
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
        status: 'approved',
        notes: 'Imported from Ontraccr - Ticket 1430. Completed by: Joshua Garbe',
        lineItems: [
          { description: '1 - Project Quality & Controls', rate: 150.00, quantity: 2, total: 300.00, type: 'labour' },
        ]
      }
    ]

    let ticketCount = 0
    let itemCount = 0

    for (const ticket of ticketsData) {
      const { lineItems, ...ticketData } = ticket

      // Insert field ticket
      const { data: fieldTicket, error: ticketError } = await supabase
        .from('field_tickets')
        .insert({
          ticket_number: String(ticketData.number),
          project_id: projectId,
          date: ticketData.date,
          subtotal: ticketData.subtotal,
          labour: ticketData.labour || 0,
          equipment: ticketData.equipment || 0,
          materials: 0,
          subcontractor: 0,
          status: ticketData.status,
          notes: ticketData.notes,
          created_at: new Date().toISOString(),
        })
        .select()
        .single()

      if (ticketError) {
        console.error(`❌ Error creating ticket ${ticketData.number}:`, ticketError.message)
        continue
      }

      ticketCount++
      console.log(`✓ Created FT-${ticketData.number}`)

      // Insert line items
      if (lineItems && lineItems.length > 0) {
        const itemsToInsert = lineItems.map(item => ({
          field_ticket_id: fieldTicket.id,
          description: item.description,
          rate: parseFloat(item.rate) || 0,
          quantity: parseFloat(item.quantity) || 0,
          total: parseFloat(item.total) || 0,
          item_type: item.type,
        }))

        const { error: itemsError, data: items } = await supabase
          .from('field_ticket_items')
          .insert(itemsToInsert)
          .select()

        if (itemsError) {
          console.error(`❌ Error creating items for FT-${ticketData.number}:`, itemsError.message)
        } else {
          itemCount += items.length
          console.log(`  ✓ Added ${items.length} line items`)
        }
      }
    }

    console.log(`\n✅ Import complete!\n  • ${ticketCount} tickets created\n  • ${itemCount} line items created\n  • Total value: $2,880`)
  } catch (err) {
    console.error('❌ Fatal error:', err.message)
  }
}

importTickets()
