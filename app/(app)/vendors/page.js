import { createServerSupabase } from '@/lib/supabase-server'
import Link from 'next/link'

const CATEGORIES = ['Materials', 'Equipment', 'Subcontractor', 'Services', 'Other']

export default async function VendorsPage() {
  const supabase = await createServerSupabase()
  const { data: vendors } = await supabase.from('vendors').select('*').order('name')

  const approved = (vendors || []).filter(v => v.approved !== false)
  const unapproved = (vendors || []).filter(v => v.approved === false)

  const grouped = CATEGORIES.reduce((acc, cat) => {
    acc[cat] = approved.filter(v => v.category === cat)
    return acc
  }, {})
  const uncategorized = approved.filter(v => !v.category || !CATEGORIES.includes(v.category))

  return (
    <div className="grid">
      <div className="page-header">
        <div className="split">
          <div>
            <h1>Vendors</h1>
            <p className="muted">{approved.length} approved supplier{approved.length !== 1 ? 's' : ''}</p>
          </div>
          <Link href="/vendors/new"><button className="primary">+ Add Vendor</button></Link>
        </div>
      </div>

      {[...CATEGORIES.map(cat => [cat, grouped[cat]]), ['Uncategorized', uncategorized]]
        .filter(([, rows]) => rows.length > 0)
        .map(([cat, rows]) => (
          <section key={cat} className="panel">
            <h2>{cat}</h2>
            <div className="table-wrap" style={{ marginTop: '12px' }}>
              <table>
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Contact</th>
                    <th>Phone</th>
                    <th>Email</th>
                    <th>Notes</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map(v => (
                    <tr key={v.id}>
                      <td><strong>{v.name}</strong>{v.website && <> &nbsp;<a href={v.website} target="_blank" rel="noreferrer" style={{ fontSize: '12px', color: 'var(--muted)' }}>↗</a></>}</td>
                      <td>{v.contact_name || '—'}</td>
                      <td>{v.phone || '—'}</td>
                      <td>{v.email ? <a href={`mailto:${v.email}`}>{v.email}</a> : '—'}</td>
                      <td style={{ color: 'var(--muted)', fontSize: '13px' }}>{v.notes || ''}</td>
                      <td><Link href={`/vendors/${v.id}/edit`}><button className="small">Edit</button></Link></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        ))}

      {!approved.length && (
        <section className="panel">
          <p className="empty">No approved vendors yet. <Link href="/vendors/new">Add one.</Link></p>
        </section>
      )}

      {unapproved.length > 0 && (
        <section className="panel">
          <h2>Not approved</h2>
          <div className="table-wrap" style={{ marginTop: '12px' }}>
            <table>
              <thead>
                <tr><th>Name</th><th>Category</th><th>Notes</th><th></th></tr>
              </thead>
              <tbody>
                {unapproved.map(v => (
                  <tr key={v.id} style={{ opacity: 0.5 }}>
                    <td>{v.name}</td>
                    <td>{v.category || '—'}</td>
                    <td>{v.notes || ''}</td>
                    <td><Link href={`/vendors/${v.id}/edit`}><button className="small">Edit</button></Link></td>
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
