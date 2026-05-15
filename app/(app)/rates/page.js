import { createServerSupabase } from '@/lib/supabase-server'
import Link from 'next/link'
import ClickableRow from '@/components/ui/ClickableRow'

export default async function RatesPage() {
  const supabase = await createServerSupabase()
  const { data: rates } = await supabase
    .from('rates')
    .select('*')
    .order('client').order('category').order('personnel')

  const allRates = rates || []

  // Group by client
  const clientMap = {}
  allRates.forEach(r => {
    const client = r.client || 'TC Energy'
    if (!clientMap[client]) clientMap[client] = { rates: [], categories: new Set() }
    clientMap[client].rates.push(r)
    clientMap[client].categories.add(r.category)
  })
  const clients = Object.keys(clientMap).sort()

  return (
    <div className="grid">
      <div className="page-header">
        <div className="split">
          <div>
            <h1>Rate Schedules</h1>
            <p className="muted">Client rate tables used across estimates and field tickets.</p>
          </div>
          <Link href="/rates/new"><button className="primary">+ New Client</button></Link>
        </div>
      </div>

      <section className="panel">
        {clients.length === 0 ? (
          <p className="empty">No rate schedules yet. <Link href="/rates/new">Add one →</Link></p>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Client</th>
                  <th>Categories</th>
                  <th className="numeric">Rates</th>
                </tr>
              </thead>
              <tbody>
                {clients.map(client => {
                  const { rates: cr, categories } = clientMap[client]
                  const slug = encodeURIComponent(client)
                  return (
                    <ClickableRow key={client} href={`/rates/${slug}`}>
                      <td><strong>{client}</strong></td>
                      <td style={{ color: 'var(--muted)', fontSize: '13px' }}>
                        {[...categories].sort().join(', ')}
                      </td>
                      <td className="numeric">{cr.length}</td>
                    </ClickableRow>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  )
}
