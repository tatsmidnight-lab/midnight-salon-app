/**
 * POST /api/auth/login-sms
 * Body: { phone: string }   — E.164 format, e.g. "+447446952026"
 *
 * Sends a Twilio Verify OTP to the phone number.
 * Returns 200 on success, 400 on bad input, 500 on Twilio error.
 */

import { NextRequest, NextResponse } from 'next/server'
import { sendOtp } from '@/lib/twilio'

// Normalize UK phone numbers to E.164
function normalizePhone(raw: string): string {
  let phone = raw.replace(/[\s\-().]/g, '')
  // UK local: 07xxx → +447xxx
  if (/^0[1-9]\d{8,10}$/.test(phone)) {
    phone = '+44' + phone.slice(1)
  }
  // Missing +: 447xxx → +447xxx
  if (/^44[1-9]\d{8,10}$/.test(phone)) {
    phone = '+' + phone
  }
  return phone
}

// Loose E.164 check: starts with +, 7–15 digits
function isValidPhone(phone: string): boolean {
  return /^\+[1-9]\d{6,14}$/.test(phone)
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => null)

    if (!body || typeof body.phone !== 'string') {
      return NextResponse.json(
        { error: 'phone is required' },
        { status: 400 }
      )
    }

    const phone = normalizePhone(body.phone.trim())

    if (!isValidPhone(phone)) {
      return NextResponse.json(
        { error: 'phone must be in E.164 format, e.g. +447446952026' },
        { status: 400 }
      )
    }

    await sendOtp(phone)

    return NextResponse.json(
      { success: true, message: 'OTP sent', phone },
      { status: 200 }
    )
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to send OTP'
    console.error('[login-sms]', message)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
