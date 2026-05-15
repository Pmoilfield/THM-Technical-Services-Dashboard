import { createServerSupabase } from '@/lib/supabase-server'
import PayrollCalendar from '@/components/payroll/PayrollCalendar'

export default async function PayrollPage({ searchParams }) {
  const supabase = await createServerSupabase()
  const params = await searchParams

  // Determine bi-weekly period start (anchor: Jan 6 2025 = known Monday start)
  const ANCHOR = new Date('2025-01-06')
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  let periodStart
  if (params.start) {
    periodStart = new Date(params.start)
  } else {
    const diffDays = Math.floor((today - ANCHOR) / (1000 * 60 * 60 * 24))
    const periodIndex = Math.floor(diffDays / 14)
    periodStart = new Date(ANCHOR)
    periodStart.setDate(ANCHOR.getDate() + periodIndex * 14)
  }

  const periodEnd = new Date(periodStart)
  periodEnd.setDate(periodStart.getDate() + 13)

  const startStr = periodStart.toISOString().split('T')[0]
  const endStr = periodEnd.toISOString().split('T')[0]

  const [{ data: workers }, { data: tickets }, { data: timeEntries }] = await Promise.all([
    supabase.from('workers').select('id, name').eq('active', true).order('name'),
    supabase.from('field_tickets')
      .select('id, date, field_ticket_items(worker_id, type, travel_hours, reg_hours, ot_hours)')
      .gte('date', startStr)
      .lte('date', endStr)
      .neq('status', 'rejected'),
    supabase.from('time_entries')
      .select('worker_id, date, travel_hours, reg_hours, ot_hours')
      .gte('date', startStr)
      .lte('date', endStr),
  ])

  return (
    <PayrollCalendar
      workers={workers || []}
      tickets={tickets || []}
      timeEntries={timeEntries || []}
      periodStart={startStr}
      periodEnd={endStr}
    />
  )
}
