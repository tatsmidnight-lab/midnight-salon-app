/**
 * GET /api/orders/get-customer-orders
 * Authorization: Bearer <token> | cookie: salon_token=<token>
 *
 * Query params:
 *   ?status=string  (optional filter)
 *
 * - Customers see only their own orders
 * - Admins see all orders
 * - Includes order_items with product/service names
 * - Ordered by order_date DESC
 */

import { NextRequest, NextResponse } from 'next/server'
import { getAuthUser, requireRole } from '@/lib/jwt'
import { createClient } from '@supabase/supabase-js'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const VALID_STATUSES = [
  'pending',
  'paid',
  'processing',
  'shipped',
  'delivered',
  'cancelled',
  'refunded',
]

export async function GET(req: NextRequest) {
  // --- Auth ---
  const user = await getAuthUser(req)
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  try {
    requireRole(user, 'customer', 'admin')
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e)
    return NextResponse.json({ error: msg }, { status: msg === 'UNAUTHORIZED' ? 401 : 403 })
  }

  const { searchParams } = new URL(req.url)
  const statusFilter = searchParams.get('status')

  if (statusFilter && !VALID_STATUSES.includes(statusFilter)) {
    return NextResponse.json(
      { error: `Invalid status. Must be one of: ${VALID_STATUSES.join(', ')}` },
      { status: 400 }
    )
  }

  try {
    let query = supabaseAdmin
      .from('orders')
      .select(
        `
        id,
        customer_id,
        order_date,
        total_price,
        status,
        items_json,
        square_payment_url,
        square_order_id,
        shipping_address,
        notes,
        order_items (
          id,
          product_id,
          service_id,
          quantity,
          unit_price,
          line_total,
          products ( id, name ),
          services ( id, name )
        )
      `
      )
      .order('order_date', { ascending: false })

    // Scope by customer unless admin
    if (user.role !== 'admin') {
      query = query.eq('customer_id', user.sub)
    }

    if (statusFilter) {
      query = query.eq('status', statusFilter)
    }

    const { data, error } = await query

    if (error) {
      throw new Error(error.message)
    }

    return NextResponse.json({ orders: data ?? [] })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Internal server error'
    console.error('[get-customer-orders]', message)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
