import { NextResponse } from 'next/server'
import { triggerBookingCalendar } from '@/lib/n8n'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: Request) {
  const body = await request.json()
  const supabase = createClient()

  let customerId: string | null = null

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (user) {
    customerId = user.id
  } else if (body.customerEmail) {
    const { data: existing } = await supabase
      .from('customers')
      .select('id')
      .eq('email', body.customerEmail)
      .single()

    if (existing) {
      customerId = existing.id
    } else {
      const { data: newCustomer } = await supabase
        .from('customers')
        .insert({
          email: body.customerEmail,
          name: body.customerName ?? '',
          phone: body.customerPhone ?? '',
        })
        .select('id')
        .single()
      customerId = newCustomer?.id ?? null
    }
  }

  let bookingId: string | null = null

  if (customerId && body.artistId && body.serviceId) {
    const { data: booking } = await supabase
      .from('bookings')
      .insert({
        customer_id: customerId,
        artist_id: body.artistId,
        service_id: body.serviceId,
        date: body.date,
        time: body.time + ':00',
        status: 'pending',
      })
      .select('id')
      .single()

    bookingId = booking?.id ?? null

    if (bookingId && body.productIds?.length > 0) {
      await supabase.from('booking_products').insert(
        body.productIds.map((pid: string) => ({
          booking_id: bookingId,
          product_id: pid,
        }))
      )
    }
  }

  try {
    await triggerBookingCalendar({
      booking_id: bookingId ?? 'pending',
      customer_id: customerId ?? 'guest',
      artist_id: body.artistId,
      service_id: body.serviceId,
      date: body.date,
      time: body.time,
      products: body.productIds ?? [],
    })
  } catch {
    console.warn('[webhook/booking] n8n webhook failed — booking still saved')
  }

  return NextResponse.json({
    ok: true,
    bookingId: bookingId ?? 'pending',
    customerId,
  })
}
