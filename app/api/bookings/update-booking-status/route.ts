import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'
import { getAuthUser, requireRole } from '@/lib/jwt'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const VALID_STATUSES = ['confirmed', 'completed', 'cancelled', 'no_show'] as const
type BookingStatus = (typeof VALID_STATUSES)[number]

export async function PUT(request: Request) {
  const user = await getAuthUser(request)

  try {
    requireRole(user, 'artist', 'admin')
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

  const { booking_id, status } = body as {
    booking_id?: string
    status?: BookingStatus
  }

  if (!booking_id || !status) {
    return NextResponse.json({ error: 'booking_id and status are required' }, { status: 400 })
  }

  if (!VALID_STATUSES.includes(status)) {
    return NextResponse.json(
      { error: `status must be one of: ${VALID_STATUSES.join(', ')}` },
      { status: 400 }
    )
  }

  // Fetch the booking to verify ownership for non-admin artists
  const { data: booking, error: fetchError } = await supabaseAdmin
    .from('bookings')
    .select('id, artist_id')
    .eq('id', booking_id)
    .single()

  if (fetchError || !booking) {
    return NextResponse.json({ error: 'Booking not found' }, { status: 404 })
  }

  // Artists can only update their own bookings; admins can update any
  if (user!.role !== 'admin') {
    // Resolve artist for this user
    const { data: artist } = await supabaseAdmin
      .from('artists')
      .select('id')
      .eq('user_id', user!.sub)
      .single()

    if (!artist || artist.id !== booking.artist_id) {
      return NextResponse.json(
        { error: 'You are not authorized to update this booking' },
        { status: 403 }
      )
    }
  }

  const { data: updated, error: updateError } = await supabaseAdmin
    .from('bookings')
    .update({ status })
    .eq('id', booking_id)
    .select()
    .single()

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 })
  }

  return NextResponse.json(updated)
}
