/**
 * PUT /api/orders/update-order-status
 * Authorization: Bearer <token> | cookie: salon_token=<token>
 *
 * Body: { order_id: string, status: 'paid'|'processing'|'shipped'|'delivered'|'cancelled'|'refunded' }
 *
 * - Admin only (customers cannot directly update status; payment webhooks do)
 * - Returns updated order
 */

import { NextRequest, NextResponse } from 'next/server'
import { getAuthUser, requireRole } from '@/lib/jwt'
import { createClient } from '@supabase/supabase-js'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const ALLOWED_STATUSES = [
  'paid',
  'processing',
  'shipped',
  'delivered',
  'cancelled',
  'refunded',
] as const

type AllowedStatus = (typeof ALLOWED_STATUSES)[number]

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export async function PUT(req: NextRequest) {
  // --- Auth ---
  const user = await getAuthUser(req)
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  try {
    requireRole(user, 'admin')
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e)
    return NextResponse.json({ error: msg }, { status: msg === 'UNAUTHORIZED' ? 401 : 403 })
  }

  // --- Parse body ---
  let body: { order_id?: unknown; status?: unknown }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  // --- Validate ---
  if (!body.order_id || typeof body.order_id !== 'string' || !UUID_REGEX.test(body.order_id)) {
    return NextResponse.json({ error: 'order_id must be a valid UUID' }, { status: 400 })
  }

  if (!body.status || !ALLOWED_STATUSES.includes(body.status as AllowedStatus)) {
    return NextResponse.json(
      {
        error: `status must be one of: ${ALLOWED_STATUSES.join(', ')}`,
      },
      { status: 400 }
    )
  }

  const orderId = body.order_id
  const newStatus = body.status as AllowedStatus

  try {
    // --- Verify order exists ---
    const { data: existing, error: fetchError } = await supabaseAdmin
      .from('orders')
      .select('id, status')
      .eq('id', orderId)
      .single()

    if (fetchError || !existing) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 })
    }

    // --- Update ---
    const { data: updated, error: updateError } = await supabaseAdmin
      .from('orders')
      .update({ status: newStatus })
      .eq('id', orderId)
      .select()
      .single()

    if (updateError || !updated) {
      throw new Error(updateError?.message ?? 'Failed to update order')
    }

    return NextResponse.json({ order: updated })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Internal server error'
    console.error('[update-order-status]', message)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
