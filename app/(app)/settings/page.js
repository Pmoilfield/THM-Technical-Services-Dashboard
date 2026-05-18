import { createServerSupabase } from '@/lib/supabase-server'
import SettingsForm from './SettingsForm'
import DeletedTickets from '@/components/settings/DeletedTickets'

export default async function SettingsPage() {
  const supabase = await createServerSupabase()
  const [{ data: settings }, { data: deletedTickets }] = await Promise.all([
    supabase.from('settings').select('*'),
    supabase.from('field_tickets').select('id, ticket_number, date, deleted_at, projects(name)').not('deleted_at', 'is', null).order('deleted_at', { ascending: false }),
  ])
  const s = Object.fromEntries((settings || []).map(row => [row.key, row.value]))

  return (
    <div className="grid">
      <div className="page-header">
        <h1>Settings</h1>
        <p className="muted">Global settings applied across all projects.</p>
      </div>

      <SettingsForm s={s} />

      <DeletedTickets tickets={deletedTickets || []} />

      <section className="panel">
        <h2>Hosting info</h2>
        <div className="grid two" style={{ marginTop: '12px' }}>
          <div>
            <div className="label" style={{ marginBottom: '6px' }}>App URL</div>
            <code style={{ background: '#f4f7fb', padding: '6px 10px', borderRadius: '8px', fontSize: '13px' }}>app.thmtsgroup.com</code>
          </div>
          <div>
            <div className="label" style={{ marginBottom: '6px' }}>Database</div>
            <code style={{ background: '#f4f7fb', padding: '6px 10px', borderRadius: '8px', fontSize: '13px' }}>Supabase Pro</code>
          </div>
        </div>
      </section>
    </div>
  )
}
