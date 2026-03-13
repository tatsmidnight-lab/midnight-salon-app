/**
 * POST /api/auth/logout
 *
 * Clears the salon_token cookie.
 * JWTs are stateless — we can't invalidate server-side without a token blocklist.
 * For a production app, add the token's JTI to a Redis/Supabase blocklist here.
 */

import { NextResponse } from 'next/server'

export async function POST() {
  const response = NextResponse.json(
    { success: true, message: 'Logged out' },
    { status: 200 }
  )

  response.cookies.set('salon_token', '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 0, // immediate expiry
  })

  return response
}
