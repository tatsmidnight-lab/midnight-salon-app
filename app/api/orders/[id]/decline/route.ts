/**
 * POST /api/orders/[id]/decline
 *
 * Declines an order: updates status, attempts Square refund if paid,
 * sends notification SMS via Twilio.
 *
 * Body: { reason?: string }
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

async function sendSMS(to: string, body: string) {
  const accountSid = process.env.TWILIO_ACCOUNT_SID!
  const authToken = process.env.TWILIO_AUTH_TOKEN!
  const from = process.env.TWILIO_PHONE_NUMBER!

  const res = await fetch(
    `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        Authorization:
          'Basic ' + Buffer.from(`${accountSid}:${authToken}`).toString('base64'),
      },
      body: new URLSearchParams({ To: to, From: from, Body: body }),
    }
  )

  if (!res.ok) {
    const err = await res.text()
    console.error('[sendSMS] Twilio error:', err)
  }

  return res.ok
}

async function refundSquarePayment(paymentId: string, amountMoney: { amount: number; currency: string }) {
  const accessToken = process.env.SQUARE_ACCESS_TOKEN!
  const idempotencyKey = `refund-${paymentId}-${Date.now()}`

  const res = await fetch(
    'https://connect.squareupsandbox.com/v2/refunds',
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`,
        'Square-Version': '2024-01-18',
      },
      body: JSON.stringify({
        idempotency_key: idempotencyKey,
        payment_id: paymentId,
        amount_money: amountMoney,
      }),
    }
  )

  const data = await res.json()

  if (!res.ok) {
    console.error('[refundSquarePayment] Square error:', JSON.stringify(data))
    return { success: false, data }
  }

  return { success: true, data }
}

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const { id } = params

  let body: { reason?: string } = {}
  try {
    body = await req.json()
  } catch {
    // No body or invalid JSON is fine — reason is optional
  }

  try {
    // 1. Update order status to declined
    const { data: order, error: updateError } = await supabaseAdmin
      .from('orders')
      .update({
        status: 'declined',
        declined_at: new Date().toISOString(),
        decline_reason: body.reason ?? null,
      })
      .eq('id', id)
      .select('id, customer_id, total_price, payment_id, status')
      .single()

    if (updateError || !order) {
      return NextResponse.json(
        { error: updateError?.message ?? 'Order not found' },
        { status: 404 }
      )
    }

    // 2. Fetch customer phone
    const { data: customer, error: customerError } = await supabaseAdmin
      .from('users')
      .select('phone')
      .eq('id', order.customer_id)
      .single()

    if (customerError || !customer) {
      console.error('[decline-order] Customer not found:', customerError?.message)
    }

    // 3. Attempt refund if payment exists
    let refunded = false
    if (order.payment_id) {
      const amountMoney = {
        amount: Math.round((order.total_price ?? 0) * 100), // Convert to smallest currency unit
        currency: 'GBP',
      }
      const refundResult = await refundSquarePayment(order.payment_id, amountMoney)
      refunded = refundResult.success
    }

    // 4. Send SMS notification
    if (customer?.phone) {
      const shortId = id.slice(0, 8)
      await sendSMS(
        customer.phone,
        `Sorry, your order #${shortId} couldn't be accepted. Please call +447958747929 for assistance. \u2014 Midnight Studio`
      )
    }

    return NextResponse.json({ success: true, refunded })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Internal server error'
    console.error('[decline-order]', message)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
