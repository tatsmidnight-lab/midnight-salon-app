/**
 * POST /api/orders/create-order
 * Authorization: Bearer <token> | cookie: salon_token=<token>
 *
 * Body:
 * {
 *   items: Array<{ product_id?: UUID, service_id?: UUID, quantity: number }>,
 *   shipping_address?: { line1: string, city: string, postcode: string },
 *   notes?: string
 * }
 *
 * Logic:
 * 1. requireRole(user, 'customer', 'admin')
 * 2. Validate items array is non-empty
 * 3. Fetch current price from products or services for each item
 * 4. Calculate total_price
 * 5. Build items_json snapshot
 * 6. Insert into orders (status = 'pending')
 * 7. Insert all into order_items
 * 8. Return the created order with items
 */

import { NextRequest, NextResponse } from 'next/server'
import { getAuthUser, requireRole } from '@/lib/jwt'
import { createClient } from '@supabase/supabase-js'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

interface OrderItemInput {
  product_id?: string
  service_id?: string
  quantity: number
}

interface ItemSnapshot {
  name: string
  product_id?: string
  service_id?: string
  quantity: number
  unit_price: number
  line_total: number
}

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

function isValidUUID(val: unknown): val is string {
  return typeof val === 'string' && UUID_REGEX.test(val)
}

export async function POST(req: NextRequest) {
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

  // --- Parse body ---
  let body: { items?: unknown; shipping_address?: unknown; notes?: unknown; coupon_code?: unknown }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  // --- Validate items ---
  if (!Array.isArray(body.items) || body.items.length === 0) {
    return NextResponse.json(
      { error: 'items must be a non-empty array' },
      { status: 400 }
    )
  }

  const rawItems = body.items as OrderItemInput[]
  for (const [i, item] of rawItems.entries()) {
    const hasProduct = item.product_id !== undefined
    const hasService = item.service_id !== undefined

    if (!hasProduct && !hasService) {
      return NextResponse.json(
        { error: `items[${i}]: must include product_id or service_id` },
        { status: 400 }
      )
    }
    if (hasProduct && hasService) {
      return NextResponse.json(
        { error: `items[${i}]: cannot include both product_id and service_id` },
        { status: 400 }
      )
    }
    if (hasProduct && !isValidUUID(item.product_id)) {
      return NextResponse.json(
        { error: `items[${i}]: product_id is not a valid UUID` },
        { status: 400 }
      )
    }
    if (hasService && !isValidUUID(item.service_id)) {
      return NextResponse.json(
        { error: `items[${i}]: service_id is not a valid UUID` },
        { status: 400 }
      )
    }
    if (!Number.isInteger(item.quantity) || item.quantity < 1) {
      return NextResponse.json(
        { error: `items[${i}]: quantity must be a positive integer` },
        { status: 400 }
      )
    }
  }

  try {
    // --- Fetch prices ---
    const productIds = rawItems
      .filter((i) => i.product_id)
      .map((i) => i.product_id as string)

    const serviceIds = rawItems
      .filter((i) => i.service_id)
      .map((i) => i.service_id as string)

    const [productsResult, servicesResult] = await Promise.all([
      productIds.length > 0
        ? supabaseAdmin
            .from('products')
            .select('id, name, price, is_active, stock_qty')
            .in('id', productIds)
        : { data: [], error: null },
      serviceIds.length > 0
        ? supabaseAdmin
            .from('services')
            .select('id, name, base_price')
            .in('id', serviceIds)
        : { data: [], error: null },
    ])

    if (productsResult.error) {
      throw new Error(`Products fetch error: ${productsResult.error.message}`)
    }
    if (servicesResult.error) {
      throw new Error(`Services fetch error: ${servicesResult.error.message}`)
    }

    const productMap = new Map(
      (productsResult.data ?? []).map((p) => [p.id, p])
    )
    const serviceMap = new Map(
      (servicesResult.data ?? []).map((s) => [s.id, s])
    )

    // --- Validate existence & build snapshot ---
    const itemsSnapshot: ItemSnapshot[] = []
    let totalPrice = 0

    for (const [i, item] of rawItems.entries()) {
      if (item.product_id) {
        const product = productMap.get(item.product_id)
        if (!product) {
          return NextResponse.json(
            { error: `items[${i}]: product_id ${item.product_id} not found` },
            { status: 404 }
          )
        }
        if (!product.is_active) {
          return NextResponse.json(
            { error: `items[${i}]: product "${product.name}" is not available` },
            { status: 400 }
          )
        }
        if (product.stock_qty !== null && product.stock_qty < item.quantity) {
          return NextResponse.json(
            {
              error: `items[${i}]: insufficient stock for "${product.name}" (available: ${product.stock_qty})`,
            },
            { status: 400 }
          )
        }
        const unitPrice: number = product.price
        const lineTotal = unitPrice * item.quantity
        totalPrice += lineTotal
        itemsSnapshot.push({
          name: product.name,
          product_id: item.product_id,
          quantity: item.quantity,
          unit_price: unitPrice,
          line_total: lineTotal,
        })
      } else if (item.service_id) {
        const service = serviceMap.get(item.service_id)
        if (!service) {
          return NextResponse.json(
            { error: `items[${i}]: service_id ${item.service_id} not found` },
            { status: 404 }
          )
        }
        const unitPrice: number = service.base_price
        const lineTotal = unitPrice * item.quantity
        totalPrice += lineTotal
        itemsSnapshot.push({
          name: service.name,
          service_id: item.service_id,
          quantity: item.quantity,
          unit_price: unitPrice,
          line_total: lineTotal,
        })
      }
    }

    // --- Apply coupon if provided ---
    let discountAmount = 0
    let couponCode: string | null = null

    if (typeof body.coupon_code === 'string' && body.coupon_code.trim()) {
      couponCode = body.coupon_code.trim().toUpperCase()

      const { data: coupon } = await supabaseAdmin
        .from('coupons')
        .select('*')
        .eq('code', couponCode)
        .eq('is_active', true)
        .maybeSingle()

      if (coupon) {
        const notExpired = !coupon.expires_at || new Date(coupon.expires_at) > new Date()
        const hasUses = coupon.max_uses === null || coupon.used_count < coupon.max_uses
        const meetsMin = totalPrice >= coupon.min_order_total

        if (notExpired && hasUses && meetsMin) {
          if (coupon.discount_type === 'percentage') {
            discountAmount = Math.round((totalPrice * coupon.discount_value / 100) * 100) / 100
          } else {
            discountAmount = Math.min(coupon.discount_value, totalPrice)
          }
          // Increment used_count
          await supabaseAdmin
            .from('coupons')
            .update({ used_count: coupon.used_count + 1 })
            .eq('id', coupon.id)
        }
      }
    }

    const finalPrice = Math.max(0, Math.round((totalPrice - discountAmount) * 100) / 100)

    // --- Insert order ---
    const { data: order, error: orderError } = await supabaseAdmin
      .from('orders')
      .insert({
        customer_id: user.sub,
        order_date: new Date().toISOString(),
        total_price: finalPrice,
        status: 'pending',
        items_json: itemsSnapshot,
        shipping_address: body.shipping_address ?? null,
        notes: typeof body.notes === 'string' ? body.notes : null,
        coupon_code: couponCode,
        discount_amount: discountAmount,
      })
      .select()
      .single()

    if (orderError || !order) {
      throw new Error(orderError?.message ?? 'Failed to create order')
    }

    // --- Insert order_items ---
    const orderItemsPayload = itemsSnapshot.map((snap) => ({
      order_id: order.id,
      product_id: snap.product_id ?? null,
      service_id: snap.service_id ?? null,
      quantity: snap.quantity,
      unit_price: snap.unit_price,
    }))

    const { data: insertedItems, error: itemsError } = await supabaseAdmin
      .from('order_items')
      .insert(orderItemsPayload)
      .select()

    if (itemsError) {
      // Attempt rollback
      await supabaseAdmin.from('orders').delete().eq('id', order.id)
      throw new Error(`Failed to create order items: ${itemsError.message}`)
    }

    return NextResponse.json(
      { order: { ...order, order_items: insertedItems } },
      { status: 201 }
    )
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Internal server error'
    console.error('[create-order]', message)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
