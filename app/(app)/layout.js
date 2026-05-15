import { redirect } from 'next/navigation'
import { createServerSupabase } from '@/lib/supabase-server'
import Sidebar from '@/components/layout/Sidebar'

export default async function AppLayout({ children }) {
  const supabase = await createServerSupabase()
  const { data: { session } } = await supabase.auth.getSession()

  if (!session) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', session.user.id)
    .single()

  return (
    <div className="app-shell">
      <Sidebar user={session.user} profile={profile} />
      <main className="main-content">
        {children}
      </main>
    </div>
  )
}

