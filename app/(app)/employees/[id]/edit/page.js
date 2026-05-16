import { createServerSupabase } from '@/lib/supabase-server'
import { notFound } from 'next/navigation'
import EmployeeForm from '@/components/employees/EmployeeForm'

export default async function EditEmployeePage({ params }) {
  const { id } = await params
  const supabase = await createServerSupabase()

  const [{ data: worker }, { data: rates }, { data: tickets }, { data: orientations }, { data: holidays }] = await Promise.all([
    supabase.from('workers').select('*').eq('id', id).single(),
    supabase.from('rates').select('id, category, personnel').neq('category', 'Equipment').order('category').order('personnel'),
    supabase.from('worker_safety_tickets').select('*').eq('worker_id', id).order('expiry_date'),
    supabase.from('worker_orientations').select('*').eq('worker_id', id).order('completed_date', { ascending: false }),
    supabase.from('worker_holidays').select('*').eq('worker_id', id).order('start_date'),
  ])

  if (!worker) notFound()

  return <EmployeeForm worker={worker} rates={rates || []} initialTickets={tickets || []} initialOrientations={orientations || []} initialHolidays={holidays || []} />
}
