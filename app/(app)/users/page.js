import { createServerSupabase } from '@/lib/supabase-server'
import { formatDate } from '@/lib/calculations'
import NewUserForm from './NewUserForm'
import LinkWorkerSelect from './LinkWorkerSelect'

export const dynamic = 'force-dynamic'

export default async function UsersPage() {
  const supabase = await createServerSupabase()
  const [{ data: users }, { data: workers }] = await Promise.all([
    supabase.from('profiles').select('*').order('full_name'),
    supabase.from('workers').select('id, name, auth_user_id').eq('active', true).order('name'),
  ])

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
                <th>Linked Worker Record</th>
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
                  <td>
                    <LinkWorkerSelect
                      userId={user.id}
                      workers={workers || []}
                      currentWorkerId={(workers || []).find(w => w.auth_user_id === user.id)?.id || ''}
                    />
                  </td>
                  <td>{user.is_active ? '✓' : '—'}</td>
                  <td className="fine-print">{formatDate(user.created_at?.slice(0, 10))}</td>
                </tr>
              ))}
              {!(users || []).length && (
                <tr><td colSpan="6" className="empty">No users yet.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  )
}
