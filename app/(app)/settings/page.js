import { createServerSupabase } from '@/lib/supabase-server'

export default async function SettingsPage() {
  const supabase = await createServerSupabase()
  const { data: settings } = await supabase.from('settings').select('*')
  const s = Object.fromEntries((settings || []).map(row => [row.key, row.value]))

  return (
    <div className="grid">
      <div className="page-header">
        <h1>Settings</h1>
        <p className="muted">Global settings applied across all projects.</p>
      </div>

      <section className="panel">
        <h2>Company</h2>
        <div className="form-grid two" style={{ marginTop: '14px' }}>
          <label>Company name <input defaultValue={s.company_name || 'THM Technical Services'} /></label>
          <label>Currency <input defaultValue={s.currency || 'CAD'} /></label>
          <label>GST rate % <input type="number" step="0.1" defaultValue={Number(s.gst_rate || 0.05) * 100} /></label>
          <label>Default markup % <input type="number" step="0.1" defaultValue={Number(s.default_markup || 0) * 100} /></label>
          <label>Default province <input defaultValue={s.default_province || 'Alberta'} /></label>
          <label>Invoice payment terms <input defaultValue={s.invoice_terms || 'Net 30'} /></label>
        </div>
        <div className="toolbar" style={{ marginTop: '16px' }}>
          <button className="primary">Save settings</button>
        </div>
        <p className="fine-print" style={{ marginTop: '10px' }}>Settings editor coming in next update. Values shown are current database defaults.</p>
      </section>

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

