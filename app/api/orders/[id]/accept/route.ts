/**
 * POST /api/orders/[id]/accept
 *
 * Accepts an order: updates status, sends confirmation SMS via Twilio.
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

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const { id } = params

  try {
    // 1. Update order status to accepted
    const { data: order, error: updateError } = await supabaseAdmin
      .from('orders')
      .update({ status: 'accepted', accepted_at: new Date().toISOString() })
      .eq('id', id)
      .select('id, customer_id, items_json, status')
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
      console.error('[accept-order] Customer not found:', customerError?.message)
    }

    // 3. Send confirmation SMS
    if (customer?.phone) {
      const shortId = id.slice(0, 8)
      await sendSMS(
        customer.phone,
        `Your order #${shortId} is confirmed! We'll start processing soon. \u2014 Midnight Studio`
      )
    }

    return NextResponse.json({ success: true, order_id: id })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Internal server error'
    console.error('[accept-order]', message)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
