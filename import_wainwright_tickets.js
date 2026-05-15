import { bulkImportFieldTickets } from './app/actions/bulkImportFieldTickets.js'

const ticketsData = [
  { number: 863, date: '2025-10-17', labour: 1685.00, equipment: 420.00, materials: 0, subcontractor: 0, subtotal: 2105.00, invoiced: true, user: 'Danny Bowerman' },
  { number: 982, date: '2026-02-18', labour: 475.00, equipment: 0, materials: 0, subcontractor: 0, subtotal: 475.00, invoiced: true, user: 'Danny Bowerman' },
  { number: 1430, date: '2026-02-19', labour: 300.00, equipment: 0, materials: 0, subcontractor: 0, subtotal: 300.00, invoiced: true, user: 'Joshua Garbe' },
  { number: 1954, date: '2026-05-11', labour: 4331.76, equipment: 1675.66, materials: 0, subcontractor: 0, subtotal: 6007.42, invoiced: false, user: 'Danny Bowerman' },
  { number: 1962, date: '2026-05-13', labour: 4331.76, equipment: 1721.49, materials: 0, subcontractor: 0, subtotal: 6053.25, invoiced: false, user: 'Danny Bowerman' },
  { number: 1971, date: '2026-05-14', labour: 1105.30, equipment: 937.83, materials: 0, subcontractor: 0, subtotal: 1718.79, invoiced: false, user: 'Danny Bowerman' },
]

const result = await bulkImportFieldTickets(ticketsData)
console.log(JSON.stringify(result, null, 2))
