import { createServerSupabase } from '@/lib/supabase-server'
import Link from 'next/link'
import ToggleActiveButton from '@/components/employees/ToggleActiveButton'

export default async function EmployeesPage() {
  const supabase = await createServerSupabase()

  const [{ data: workers }, { data: rates }] = await Promise.all([
    supabase.from('workers').select('*').order('name'),
    supabase.from('rates').select('id, category, personnel').order('category').order('personnel'),
  ])

  const rateMap = Object.fromEntries((rates || []).map(r => [r.id, `${r.category} — ${r.personnel}`]))

  const active = (workers || []).filter(w => w.active)
  const inactive = (workers || []).filter(w => !w.active)

  return (
    <div className="grid">
      <div className="page-header">
        <div className="split">
          <div>
            <h1>Employees</h1>
            <p className="muted">{active.length} active &middot; {inactive.length} inactive</p>
          </div>
          <Link href="/employees/new"><button className="primary">+ Add Employee</button></Link>
        </div>
      </div>

      <section className="panel">
        <h2>Active</h2>
        <div className="table-wrap" style={{ marginTop: '12px' }}>
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Default Position</th>
                <th>Notes</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {active.map(w => (
                <tr key={w.id}>
                  <td><strong>{w.name}</strong></td>
                  <td>{w.default_rate_id ? rateMap[w.default_rate_id] || '—' : '—'}</td>
                  <td>{w.notes || ''}</td>
                  <td style={{ display: 'flex', gap: '6px' }}>
                    <ToggleActiveButton workerId={w.id} active={true} />
                    <Link href={`/employees/${w.id}/edit`}><button className="small">Edit</button></Link>
                  </td>
                </tr>
              ))}
              {!active.length && <tr><td colSpan="4" className="empty">No active employees.</td></tr>}
            </tbody>
          </table>
        </div>
      </section>

      {inactive.length > 0 && (
        <section className="panel">
          <h2>Inactive</h2>
          <div className="table-wrap" style={{ marginTop: '12px' }}>
            <table>
              <thead>
                <tr><th>Name</th><th>Default Position</th><th></th></tr>
              </thead>
              <tbody>
                {inactive.map(w => (
                  <tr key={w.id} style={{ opacity: 0.5 }}>
                    <td>{w.name}</td>
                    <td>{w.default_rate_id ? rateMap[w.default_rate_id] || '—' : '—'}</td>
                    <td style={{ display: 'flex', gap: '6px' }}>
                      <ToggleActiveButton workerId={w.id} active={false} />
                      <Link href={`/employees/${w.id}/edit`}><button className="small">Edit</button></Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </div>
  )
}
