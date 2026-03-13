/**
 * GET /api/admin/stats
 *
 * Returns dashboard statistics: user counts, order/booking counts, revenue.
 */

import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET() {
  try {
    // Run all queries in parallel
    const todayStart = new Date()
    todayStart.setHours(0, 0, 0, 0)
    const todayISO = todayStart.toISOString()

    const [
      usersResult,
      artistsResult,
      servicesResult,
      ordersResult,
      bookingsResult,
      revenueResult,
      todayBookingsResult,
    ] = await Promise.all([
      // Total users
      supabaseAdmin
        .from('users')
        .select('id', { count: 'exact', head: true }),

      // Artists count
      supabaseAdmin
        .from('users')
        .select('id', { count: 'exact', head: true })
        .eq('role', 'artist'),

      // Services count
      supabaseAdmin
        .from('services')
        .select('id', { count: 'exact', head: true }),

      // Orders count
      supabaseAdmin
        .from('orders')
        .select('id', { count: 'exact', head: true }),

      // Bookings count
      supabaseAdmin
        .from('bookings')
        .select('id', { count: 'exact', head: true }),

      // Revenue from completed orders
      supabaseAdmin
        .from('orders')
        .select('total_price')
        .eq('status', 'completed'),

      // Today's bookings
      supabaseAdmin
        .from('bookings')
        .select('id', { count: 'exact', head: true })
        .gte('booking_date', todayISO)
        .lt('booking_date', new Date(todayStart.getTime() + 86400000).toISOString()),
    ])

    // Sum revenue from completed orders
    const revenue = (revenueResult.data ?? []).reduce(
      (sum, row) => sum + (row.total_price ?? 0),
      0
    )

    return NextResponse.json({
      users: usersResult.count ?? 0,
      artists: artistsResult.count ?? 0,
      services: servicesResult.count ?? 0,
      orders: ordersResult.count ?? 0,
      bookings: bookingsResult.count ?? 0,
      revenue,
      todayBookings: todayBookingsResult.count ?? 0,
    })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Internal server error'
    console.error('[admin/stats]', message)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
