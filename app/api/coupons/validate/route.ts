/**
 * POST /api/coupons/validate
 * Body: { code: string, order_total: number }
 *
 * Validates a coupon code and returns the discount details.
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(req: NextRequest) {
  let body: { code?: string; order_total?: number }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const code = (body.code || '').trim().toUpperCase()
  const orderTotal = body.order_total ?? 0

  if (!code) {
    return NextResponse.json({ error: 'Coupon code is required' }, { status: 400 })
  }

  const { data: coupon, error } = await supabaseAdmin
    .from('coupons')
    .select('*')
    .eq('code', code)
    .eq('is_active', true)
    .maybeSingle()

  if (error) {
    // Table may not exist yet — treat as invalid code
    if (error.message.includes('coupons') || error.code === '42P01') {
      return NextResponse.json({ error: 'Coupon system not yet configured — run migration SQL' }, { status: 404 })
    }
    console.error('[coupons/validate]', error.message)
    return NextResponse.json({ error: 'Failed to check coupon' }, { status: 500 })
  }

  if (!coupon) {
    return NextResponse.json({ error: 'Invalid coupon code' }, { status: 404 })
  }

  // Check expiry
  if (coupon.expires_at && new Date(coupon.expires_at) < new Date()) {
    return NextResponse.json({ error: 'This coupon has expired' }, { status: 400 })
  }

  // Check usage limit
  if (coupon.max_uses !== null && coupon.used_count >= coupon.max_uses) {
    return NextResponse.json({ error: 'This coupon has reached its usage limit' }, { status: 400 })
  }

  // Check minimum order
  if (orderTotal < coupon.min_order_total) {
    return NextResponse.json(
      { error: `Minimum order of £${coupon.min_order_total} required for this coupon` },
      { status: 400 }
    )
  }

  // Calculate discount
  let discount = 0
  if (coupon.discount_type === 'percentage') {
    discount = Math.round((orderTotal * coupon.discount_value / 100) * 100) / 100
  } else {
    discount = Math.min(coupon.discount_value, orderTotal)
  }

  return NextResponse.json({
    valid: true,
    code: coupon.code,
    description: coupon.description,
    discount_type: coupon.discount_type,
    discount_value: coupon.discount_value,
    discount_amount: discount,
    new_total: Math.max(0, Math.round((orderTotal - discount) * 100) / 100),
  })
}
