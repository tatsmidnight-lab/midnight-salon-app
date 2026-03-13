/**
 * POST /api/auth/verify-otp
 * Body: { phone: string, code: string }
 *
 * 1. Verifies OTP with Twilio Verify
 * 2. Upserts the user in the `users` table (service role — bypasses RLS)
 * 3. Signs a JWT with the user's id + role (compatible with Supabase RLS)
 * 4. Returns the token in both the JSON body and an HttpOnly cookie
 */

import { NextRequest, NextResponse } from 'next/server'
import { verifyOtp } from '@/lib/twilio'
import { signJwt } from '@/lib/jwt'
import { createClient } from '@supabase/supabase-js'
import { rateLimit, getClientIp } from '@/lib/rate-limit'
import { logger } from '@/lib/logger'

// Service-role client — bypasses RLS for auth operations
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// Normalize UK phone numbers to E.164
function normalizePhone(raw: string): string {
  let phone = raw.replace(/[\s\-().]/g, '')
  if (/^0[1-9]\d{8,10}$/.test(phone)) phone = '+44' + phone.slice(1)
  if (/^44[1-9]\d{8,10}$/.test(phone)) phone = '+' + phone
  return phone
}

export async function POST(req: NextRequest) {
  try {
    // Rate limit: 10 OTP verify attempts per minute per IP
    const ip = getClientIp(req)
    const rl = rateLimit(ip, { limit: 10, windowSec: 60 })
    if (!rl.ok) {
      logger.warn('Rate limit exceeded on verify-otp', { ip })
      return NextResponse.json(
        { error: 'Too many attempts. Please try again later.' },
        { status: 429 }
      )
    }

    const body = await req.json().catch(() => null)

    if (
      !body ||
      typeof body.phone !== 'string' ||
      typeof body.code !== 'string'
    ) {
      return NextResponse.json(
        { error: 'phone and code are required' },
        { status: 400 }
      )
    }

    const phone = normalizePhone(body.phone.trim())
    const code = body.code.trim()

    // 1. Verify OTP
    const approved = await verifyOtp(phone, code)
    if (!approved) {
      return NextResponse.json(
        { error: 'Invalid or expired OTP' },
        { status: 401 }
      )
    }

    // 2. Upsert user in our users table
    //    ON CONFLICT(phone): update updated_at so we get the existing row back
    const { data: users, error: upsertErr } = await supabaseAdmin
      .from('users')
      .upsert(
        { phone, updated_at: new Date().toISOString() },
        { onConflict: 'phone', ignoreDuplicates: false }
      )
      .select('id, phone, role, display_name')

    if (upsertErr) {
      console.error('[verify-otp] upsert error:', upsertErr)
      return NextResponse.json(
        { error: 'Failed to create user account' },
        { status: 500 }
      )
    }

    const user = users?.[0]
    if (!user) {
      return NextResponse.json(
        { error: 'User record not found after upsert' },
        { status: 500 }
      )
    }

    // 3. Sign JWT
    const token = await signJwt({
      sub: user.id,
      phone: user.phone,
      role: user.role as 'admin' | 'artist' | 'customer',
    })

    // 4. Return token in body + HttpOnly cookie
    const response = NextResponse.json(
      {
        success: true,
        token,
        user: {
          id: user.id,
          phone: user.phone,
          role: user.role,
          display_name: user.display_name,
        },
      },
      { status: 200 }
    )

    response.cookies.set('salon_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 7, // 7 days
    })

    return response
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Verification failed'
    console.error('[verify-otp]', message)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
