import { bulkImportFieldTicketsWithItems } from './app/actions/bulkImportFieldTicketsWithItems.js'

const ticketsData = [
  {
    number: 863,
    date: '2025-10-17',
    labour: 1685.00,
    equipment: 420.00,
    materials: 0,
    subcontractor: 0,
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
    materials: 0,
    subcontractor: 0,
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
    materials: 0,
    subcontractor: 0,
    subtotal: 300.00,
    status: 'approved',
    notes: 'Imported from Ontraccr - Ticket 1430. Completed by: Joshua Garbe',
    lineItems: [
      { description: '1 - Project Quality & Controls', rate: 150.00, quantity: 2, total: 300.00, type: 'labour' },
    ]
  }
]

const result = await bulkImportFieldTicketsWithItems(ticketsData)
console.log(JSON.stringify(result, null, 2))
