import { createServerSupabase } from '@/lib/supabase-server'
import ClientRatesPage from '@/components/rates/ClientRatesPage'

export default async function ClientRateSchedulePage({ params }) {
  const { client: slug } = await params
  const client = decodeURIComponent(slug)
  const isNew = slug === 'new'

  const supabase = await createServerSupabase()

  const { data: rates } = isNew ? { data: [] } : await supabase
    .from('rates')
    .select('*')
    .eq('client', client)
    .order('category').order('personnel')

  return <ClientRatesPage client={isNew ? '' : client} initialRates={rates || []} isNew={isNew} />
}
