import { createServerSupabase } from '@/lib/supabase-server'
import { notFound, redirect } from 'next/navigation'
import EditFieldTicketForm from '@/components/field-tickets/EditFieldTicketForm'

export default async function EditFieldTicketPage({ params }) {
  const { id } = await params
  const supabase = await createServerSupabase()

  const [{ data: ticket }, { data: items }, { data: projects }, { data: rates }, { data: workers }] = await Promise.all([
    supabase.from('field_tickets').select('*, projects(name, client_name)').eq('id', id).single(),
    supabase.from('field_ticket_items').select('*').eq('ticket_id', id).order('sort_order'),
    supabase.from('projects').select('id, name, client_name').order('name'),
    supabase.from('rates').select('*').order('category').order('personnel'),
    supabase.from('workers').select('*').eq('active', true).order('name'),
  ])

  if (!ticket) notFound()
  if (!['draft', 'rejected'].includes(ticket.status)) redirect(`/field-tickets/${id}`)

  return (
    <EditFieldTicketForm
      ticket={ticket}
      existingItems={items || []}
      projects={projects || []}
      rates={rates || []}
      workers={workers || []}
    />
  )
}
