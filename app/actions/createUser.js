'use server'
import { createAdminSupabase, createServerSupabase } from '@/lib/supabase-server'
import { revalidatePath } from 'next/cache'

export async function createUser({ email, password, fullName, role }) {
  // Only allow admins to create users
  const supabase = await createServerSupabase()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'admin' && profile?.role !== 'owner') {
    return { error: 'Only admins can create users' }
  }

  if (!email || !password) return { error: 'Email and password are required' }
  if (password.length < 8) return { error: 'Password must be at least 8 characters' }

  const admin = createAdminSupabase()

  // Create the auth user with email confirmed and password set
  const { data: created, error: createErr } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { full_name: fullName || null },
  })

  if (createErr) return { error: createErr.message }

  // Insert / update profile row
  const { error: profileErr } = await admin
    .from('profiles')
    .upsert({
      id: created.user.id,
      email,
      full_name: fullName || null,
      role: role || 'user',
      is_active: true,
    })

  if (profileErr) return { error: `User created but profile failed: ${profileErr.message}` }

  revalidatePath('/users')
  return { success: true, userId: created.user.id }
}
