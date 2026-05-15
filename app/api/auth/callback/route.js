import { NextResponse } from 'next/server'

export async function GET(request) {
  return NextResponse.redirect(new URL('/auth/set-password?step=route_hit', request.url))
}
