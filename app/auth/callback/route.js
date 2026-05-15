import { createServerSupabase } from '@/lib/supabase-server'
import { NextResponse } from 'next/server'

export async function GET(request) {
  try {
    const { searchParams, origin } = new URL(request.url)
    const code = searchParams.get('code')
    const token_hash = searchParams.get('token_hash')
    const type = searchParams.get('type')

    if (!token_hash && !code) {
      return NextResponse.redirect(`${origin}/login?step=no_params&search=${encodeURIComponent(request.url)}`)
    }

    const supabase = await createServerSupabase()

    if (token_hash && type) {
      const { data, error } = await supabase.auth.verifyOtp({ token_hash, type })
      if (error) {
        return NextResponse.redirect(`${origin}/login?step=verify_failed&err=${encodeURIComponent(error.message)}`)
      }
      return NextResponse.redirect(`${origin}/auth/set-password?step=verified`)
    }

    if (code) {
      const { error } = await supabase.auth.exchangeCodeForSession(code)
      if (error) {
        return NextResponse.redirect(`${origin}/login?step=exchange_failed&err=${encodeURIComponent(error.message)}`)
      }
      return NextResponse.redirect(`${origin}/auth/set-password?step=exchanged`)
    }
  } catch (e) {
    const { origin } = new URL(request.url)
    return NextResponse.redirect(`${origin}/login?step=exception&err=${encodeURIComponent(e.message)}`)
  }
}
