import { redirect } from 'next/navigation'
import { createServerSupabase } from '@/lib/supabase-server'
import Sidebar from '@/components/layout/Sidebar'
import LayoutShell from '@/components/layout/LayoutShell'

export default async function AppLayout({ children }) {
  const supabase = await createServerSupabase()
  const { data: { session } } = await supabase.auth.getSession()

  if (!session) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', session.user.id)
    .single()

  const isWorker = ['worker', 'foreman'].includes(profile?.role)

  return (
    <LayoutShell sidebar={<Sidebar user={session.user} profile={profile} isWorker={isWorker} />}>
      {children}
    </LayoutShell>
  )
}
