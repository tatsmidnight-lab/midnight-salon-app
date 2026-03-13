import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'
import { getAuthUser, requireRole } from '@/lib/jwt'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(request: Request) {
  const user = await getAuthUser(request)

  try {
    requireRole(user, 'customer', 'admin')
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    return NextResponse.json({ error: msg }, { status: msg === 'UNAUTHORIZED' ? 401 : 403 })
  }

  let body: Record<string, unknown>
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const {
    artist_id,
    service_id,
    package_id,
    variant_id,
    booking_date,
    booking_time,
    notes,
  } = body as {
    artist_id?: string
    service_id?: string
    package_id?: string
    variant_id?: string
    booking_date?: string
    booking_time?: string
    notes?: string
  }

  if (!artist_id || !booking_date || !booking_time) {
    return NextResponse.json(
      { error: 'artist_id, booking_date, and booking_time are required' },
      { status: 400 }
    )
  }

  if (!service_id && !package_id) {
    return NextResponse.json(
      { error: 'Either service_id or package_id must be provided' },
      { status: 400 }
    )
  }

  if (service_id && package_id) {
    return NextResponse.json(
      { error: 'Provide either service_id or package_id, not both' },
      { status: 400 }
    )
  }

  // Look up price and duration from service or package
  let totalPrice: number | null = null
  let durationMinutes: number | null = null

  if (service_id) {
    const { data: service, error: serviceError } = await supabaseAdmin
      .from('services')
      .select('base_price, duration')
      .eq('id', service_id)
      .single()

    if (serviceError || !service) {
      return NextResponse.json({ error: 'Service not found' }, { status: 404 })
    }

    totalPrice = service.base_price

    // Apply variant price modifier if present
    if (variant_id) {
      const { data: variant } = await supabaseAdmin
        .from('service_variants')
        .select('price_modifier')
        .eq('id', variant_id)
        .single()

      if (variant) {
        totalPrice = totalPrice + (variant.price_modifier ?? 0)
      }
    }

    durationMinutes = service.duration
  } else if (package_id) {
    const { data: pkg, error: pkgError } = await supabaseAdmin
      .from('package_services')
      .select('price')
      .eq('id', package_id)
      .single()

    if (pkgError || !pkg) {
      return NextResponse.json({ error: 'Package not found' }, { status: 404 })
    }

    totalPrice = pkg.price
  }

  // Insert the booking
  const { data: booking, error: bookingError } = await supabaseAdmin
    .from('bookings')
    .insert({
      customer_id: user!.sub,
      artist_id,
      service_id: service_id ?? null,
      package_id: package_id ?? null,
      variant_id: variant_id ?? null,
      booking_date,
      booking_time,
      duration_minutes: durationMinutes,
      status: 'pending',
      notes: notes ?? null,
      total_price: totalPrice,
    })
    .select()
    .single()

  if (bookingError) {
    return NextResponse.json({ error: bookingError.message }, { status: 500 })
  }

  // Trigger n8n booking webhook
  const webhookUrl = process.env.N8N_WEBHOOK_BOOKING
  let squarePaymentUrl: string | null = null

  if (webhookUrl) {
    try {
      const res = await fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          booking_id: booking.id,
          artist_id,
          service_id: service_id ?? null,
          package_id: package_id ?? null,
          customer_id: user!.sub,
          booking_date,
          booking_time,
          total_price: totalPrice,
          notes: notes ?? null,
        }),
      })

      if (res.ok) {
        const n8nData = await res.json().catch(() => null)
        squarePaymentUrl = n8nData?.square_payment_url ?? null

        // Persist the payment URL back to the booking row
        if (squarePaymentUrl) {
          await supabaseAdmin
            .from('bookings')
            .update({ square_payment_url: squarePaymentUrl })
            .eq('id', booking.id)
        }
      }
    } catch {
      // Webhook failure is non-fatal — booking is already persisted
    }
  }

  // Remove the booked time slot from artist_availability
  try {
    const { data: avail } = await supabaseAdmin
      .from('artist_availability')
      .select('id, time_slots_json')
      .eq('artist_id', artist_id)
      .eq('date', booking_date)
      .single()

    if (avail && Array.isArray(avail.time_slots_json)) {
      const updatedSlots = avail.time_slots_json.filter(
        (slot: string) => slot !== booking_time
      )
      await supabaseAdmin
        .from('artist_availability')
        .update({ time_slots_json: updatedSlots })
        .eq('id', avail.id)
    }
  } catch {
    // Non-fatal — availability cleanup failure should not block the response
  }

  return NextResponse.json(
    { ...booking, square_payment_url: squarePaymentUrl },
    { status: 201 }
  )
}
