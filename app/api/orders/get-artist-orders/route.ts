/**
 * GET /api/orders/get-artist-orders
 * Authorization: Bearer <token> | cookie: salon_token=<token>
 *
 * - artist/admin auth required
 * - Looks up the artist row for user.sub
 * - Returns orders that contain order_items linked to any of this artist's services
 * - Returns unique orders with their full items
 */

import { NextRequest, NextResponse } from 'next/server'
import { getAuthUser, requireRole } from '@/lib/jwt'
import { createClient } from '@supabase/supabase-js'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(req: NextRequest) {
  // --- Auth ---
  const user = await getAuthUser(req)
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  try {
    requireRole(user, 'artist', 'admin')
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e)
    return NextResponse.json({ error: msg }, { status: msg === 'UNAUTHORIZED' ? 401 : 403 })
  }

  try {
    // --- Resolve artist id ---
    // For admins acting without an artist profile, artist_id query param can scope the request.
    // For artist role, always use their own artist record.
    let artistId: string | null = null

    if (user.role === 'admin') {
      const { searchParams } = new URL(req.url)
      const paramArtistId = searchParams.get('artist_id')
      if (paramArtistId) {
        artistId = paramArtistId
      }
      // If admin doesn't supply artist_id, fall through to check their own artist row
    }

    if (!artistId) {
      const { data: artistRow, error: artistError } = await supabaseAdmin
        .from('artists')
        .select('id')
        .eq('user_id', user.sub)
        .single()

      if (artistError || !artistRow) {
        return NextResponse.json(
          { error: 'Artist profile not found for this user' },
          { status: 404 }
        )
      }
      artistId = artistRow.id
    }

    // --- Fetch services belonging to this artist ---
    const { data: artistServices, error: servicesError } = await supabaseAdmin
      .from('services')
      .select('id')
      .eq('artist_id', artistId)

    if (servicesError) {
      throw new Error(`Services fetch error: ${servicesError.message}`)
    }

    if (!artistServices || artistServices.length === 0) {
      return NextResponse.json({ orders: [] })
    }

    const serviceIds = artistServices.map((s) => s.id)

    // --- Find order_ids that have at least one of these services ---
    const { data: matchingItems, error: itemsError } = await supabaseAdmin
      .from('order_items')
      .select('order_id')
      .in('service_id', serviceIds)

    if (itemsError) {
      throw new Error(`Order items fetch error: ${itemsError.message}`)
    }

    if (!matchingItems || matchingItems.length === 0) {
      return NextResponse.json({ orders: [] })
    }

    const orderIds = [...new Set(matchingItems.map((i) => i.order_id))]

    // --- Fetch the full orders with their items ---
    const { data: orders, error: ordersError } = await supabaseAdmin
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
          services ( id, name, artist_id )
        )
      `
      )
      .in('id', orderIds)
      .order('order_date', { ascending: false })

    if (ordersError) {
      throw new Error(ordersError.message)
    }

    return NextResponse.json({ orders: orders ?? [], artist_id: artistId })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Internal server error'
    console.error('[get-artist-orders]', message)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
