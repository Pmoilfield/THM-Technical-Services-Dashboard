import { createServerSupabase } from '@/lib/supabase-server'
import { formatDate } from '@/lib/calculations'
import NewUserForm from './NewUserForm'

export default async function UsersPage() {
  const supabase = await createServerSupabase()
  const { data: users } = await supabase
    .from('profiles')
    .select('*')
    .order('full_name')

  return (
    <div className="grid">
      <div className="page-header">
        <div className="split">
          <div><h1>Users</h1><p className="muted">{(users || []).length} team members</p></div>
          <NewUserForm />
        </div>
      </div>

      <section className="panel">
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Role</th>
                <th>Trade</th>
                <th>Province</th>
                <th>Active</th>
                <th>Joined</th>
              </tr>
            </thead>
            <tbody>
              {(users || []).map(user => (
                <tr key={user.id}>
                  <td><strong>{user.full_name || '—'}</strong></td>
                  <td>{user.email}</td>
                  <td><span className="pill">{user.role}</span></td>
                  <td className="fine-print">{user.trade_classification || '—'}</td>
                  <td className="fine-print">{user.province || '—'}</td>
                  <td>{user.is_active ? '✓' : '—'}</td>
                  <td className="fine-print">{formatDate(user.created_at?.slice(0, 10))}</td>
                </tr>
              ))}
              {!(users || []).length && (
                <tr><td colSpan="7" className="empty">No users yet.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  )
}
