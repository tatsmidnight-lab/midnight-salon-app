/**
 * POST /api/auth/admin-login
 * Body: { username: string, password: string }
 *
 * Password is compared against ADMIN_PASSWORD_HASH (SHA-256 hex).
 * Generate hash: node -e "console.log(require('crypto').createHash('sha256').update('yourpassword').digest('hex'))"
 *
 * Returns a JWT with role=admin on success.
 */

import { NextRequest, NextResponse } from 'next/server'
import { createHash } from 'crypto'
import { signJwt } from '@/lib/jwt'
import { createClient } from '@supabase/supabase-js'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => null)

    if (
      !body ||
      typeof body.username !== 'string' ||
      typeof body.password !== 'string'
    ) {
      return NextResponse.json(
        { error: 'username and password are required' },
        { status: 400 }
      )
    }

    const expectedUsername = process.env.ADMIN_USERNAME
    const expectedHash = process.env.ADMIN_PASSWORD_HASH

    if (!expectedUsername || !expectedHash) {
      console.error('[admin-login] ADMIN_USERNAME or ADMIN_PASSWORD_HASH not set')
      return NextResponse.json(
        { error: 'Admin auth is not configured' },
        { status: 500 }
      )
    }

    const inputHash = createHash('sha256')
      .update(body.password)
      .digest('hex')

    if (
      body.username !== expectedUsername ||
      inputHash !== expectedHash
    ) {
      // Constant-time-ish comparison already handled by hashing both sides
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      )
    }

    // Fetch the admin user record from the users table
    const { data: adminUsers, error } = await supabaseAdmin
      .from('users')
      .select('id, phone, role, display_name')
      .eq('role', 'admin')
      .limit(1)

    if (error || !adminUsers?.length) {
      // Admin user row doesn't exist yet — create it
      const { data: newAdmin, error: createErr } = await supabaseAdmin
        .from('users')
        .insert({
          phone: 'admin',
          role: 'admin',
          display_name: body.username,
        })
        .select('id, phone, role, display_name')
        .single()

      if (createErr) {
        console.error('[admin-login] failed to create admin user:', createErr)
        return NextResponse.json(
          { error: 'Failed to initialize admin account' },
          { status: 500 }
        )
      }

      const token = await signJwt({
        sub: newAdmin.id,
        phone: newAdmin.phone,
        role: 'admin',
      })

      const res = NextResponse.json(
        { success: true, token, user: newAdmin },
        { status: 200 }
      )
      res.cookies.set('salon_token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
        maxAge: 60 * 60 * 8, // 8 hours for admin
      })
      return res
    }

    const admin = adminUsers[0]
    const token = await signJwt({
      sub: admin.id,
      phone: admin.phone,
      role: 'admin',
    })

    const response = NextResponse.json(
      { success: true, token, user: admin },
      { status: 200 }
    )
    response.cookies.set('salon_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 8, // 8 hours
    })

    return response
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Login failed'
    console.error('[admin-login]', message)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
