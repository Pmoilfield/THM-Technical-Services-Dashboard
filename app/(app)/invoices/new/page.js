import { createServerSupabase } from '@/lib/supabase-server'
import InvoiceBuilder from '@/components/invoices/InvoiceBuilder'

export default async function NewInvoicePage({ searchParams }) {
  const sp = await searchParams
  const preselectedProjectId = sp?.project || null
  const supabase = await createServerSupabase()

  const [{ data: projects }, { count: invoiceCount }] = await Promise.all([
    supabase.from('projects').select('id, name, client_name, gst_rate').neq('archived', true).order('name'),
    supabase.from('invoices').select('*', { count: 'exact', head: true }),
  ])

  let initialTickets = []
  let invoicedTicketIds = []

  if (preselectedProjectId) {
    const { data: tickets } = await supabase
      .from('field_tickets')
      .select('*')
      .eq('project_id', preselectedProjectId)
      .eq('status', 'approved')
      .order('date')

    initialTickets = tickets || []

    if (initialTickets.length) {
      const { data: junctions } = await supabase
        .from('invoice_tickets')
        .select('field_ticket_id, invoices!inner(status)')
        .in('field_ticket_id', initialTickets.map(t => t.id))

      invoicedTicketIds = (junctions || [])
        .filter(j => j.invoices?.status !== 'void')
        .map(j => j.field_ticket_id)
    }
  }

  const nextNum = String((invoiceCount || 0) + 1).padStart(3, '0')
  const autoInvoiceNumber = `INV-${new Date().getFullYear()}-${nextNum}`

  return (
    <InvoiceBuilder
      projects={projects || []}
      preselectedProjectId={preselectedProjectId}
      initialTickets={initialTickets}
      invoicedTicketIds={invoicedTicketIds}
      autoInvoiceNumber={autoInvoiceNumber}
    />
  )
}
