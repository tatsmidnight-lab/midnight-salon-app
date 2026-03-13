/**
 * GET /api/orders/admin-get-all-orders
 * Authorization: Bearer <token> | cookie: salon_token=<token>
 *
 * Query params (all optional):
 *   ?status=string
 *   ?from=YYYY-MM-DD
 *   ?to=YYYY-MM-DD
 *   ?artist_id=UUID  — filter orders containing services by this artist
 *   ?page=1          — 1-based (default 1)
 *   ?limit=20        — default 20, max 100
 *
 * Returns: { orders, total, page, limit }
 * Joins customer display_name, order_items with product/service names.
 * Ordered by order_date DESC.
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

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
const DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/

export async function GET(req: NextRequest) {
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

  const { searchParams } = new URL(req.url)

  // --- Parse & validate query params ---
  const statusFilter = searchParams.get('status')
  const fromDate = searchParams.get('from')
  const toDate = searchParams.get('to')
  const artistIdFilter = searchParams.get('artist_id')
  const rawPage = searchParams.get('page') ?? '1'
  const rawLimit = searchParams.get('limit') ?? '20'

  if (statusFilter && !VALID_STATUSES.includes(statusFilter)) {
    return NextResponse.json(
      { error: `Invalid status. Must be one of: ${VALID_STATUSES.join(', ')}` },
      { status: 400 }
    )
  }
  if (fromDate && !DATE_REGEX.test(fromDate)) {
    return NextResponse.json(
      { error: 'from must be a date in YYYY-MM-DD format' },
      { status: 400 }
    )
  }
  if (toDate && !DATE_REGEX.test(toDate)) {
    return NextResponse.json(
      { error: 'to must be a date in YYYY-MM-DD format' },
      { status: 400 }
    )
  }
  if (artistIdFilter && !UUID_REGEX.test(artistIdFilter)) {
    return NextResponse.json(
      { error: 'artist_id must be a valid UUID' },
      { status: 400 }
    )
  }

  const page = Math.max(1, parseInt(rawPage, 10) || 1)
  const limit = Math.min(100, Math.max(1, parseInt(rawLimit, 10) || 20))
  const offset = (page - 1) * limit

  try {
    // --- If artist_id filter is set, resolve the order_ids that touch this artist's services ---
    let artistOrderIds: string[] | null = null

    if (artistIdFilter) {
      const { data: artistServices, error: svcErr } = await supabaseAdmin
        .from('services')
        .select('id')
        .eq('artist_id', artistIdFilter)

      if (svcErr) {
        throw new Error(`Services fetch error: ${svcErr.message}`)
      }

      if (!artistServices || artistServices.length === 0) {
        // No services → no orders
        return NextResponse.json({ orders: [], total: 0, page, limit })
      }

      const svcIds = artistServices.map((s) => s.id)

      const { data: matchingItems, error: itemsErr } = await supabaseAdmin
        .from('order_items')
        .select('order_id')
        .in('service_id', svcIds)

      if (itemsErr) {
        throw new Error(`Order items fetch error: ${itemsErr.message}`)
      }

      artistOrderIds = Array.from(
        new Set((matchingItems ?? []).map((i) => i.order_id))
      )

      if (artistOrderIds.length === 0) {
        return NextResponse.json({ orders: [], total: 0, page, limit })
      }
    }

    // --- Build count query ---
    let countQuery = supabaseAdmin
      .from('orders')
      .select('id', { count: 'exact', head: true })

    if (statusFilter) countQuery = countQuery.eq('status', statusFilter)
    if (fromDate) countQuery = countQuery.gte('order_date', fromDate)
    if (toDate) countQuery = countQuery.lte('order_date', toDate + 'T23:59:59Z')
    if (artistOrderIds) countQuery = countQuery.in('id', artistOrderIds)

    const { count, error: countError } = await countQuery
    if (countError) throw new Error(countError.message)

    const total = count ?? 0

    if (total === 0) {
      return NextResponse.json({ orders: [], total: 0, page, limit })
    }

    // --- Build data query ---
    let dataQuery = supabaseAdmin
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
        users!orders_customer_id_fkey (
          id,
          display_name,
          phone
        ),
        order_items (
          id,
          product_id,
          service_id,
          quantity,
          unit_price,
          line_total,
          products ( id, name ),
          services ( id, name, artist_id )
        )
      `
      )
      .order('order_date', { ascending: false })
      .range(offset, offset + limit - 1)

    if (statusFilter) dataQuery = dataQuery.eq('status', statusFilter)
    if (fromDate) dataQuery = dataQuery.gte('order_date', fromDate)
    if (toDate)
      dataQuery = dataQuery.lte('order_date', toDate + 'T23:59:59Z')
    if (artistOrderIds) dataQuery = dataQuery.in('id', artistOrderIds)

    const { data: orders, error: ordersError } = await dataQuery
    if (ordersError) throw new Error(ordersError.message)

    return NextResponse.json({ orders: orders ?? [], total, page, limit })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Internal server error'
    console.error('[admin-get-all-orders]', message)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
