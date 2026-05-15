import { redirect } from 'next/navigation'
import { createServerSupabase } from '@/lib/supabase-server'

export default async function Root() {
  const supabase = await await createServerSupabase()
  const { data: { session } } = await supabase.auth.getSession()
  if (session) redirect('/dashboard')
  redirect('/login')
}

