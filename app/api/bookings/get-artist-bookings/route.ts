import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'
import { getAuthUser, requireRole } from '@/lib/jwt'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const VALID_STATUSES = ['pending', 'confirmed', 'completed', 'cancelled', 'no_show'] as const
type BookingStatus = (typeof VALID_STATUSES)[number]

export async function GET(request: Request) {
  const user = await getAuthUser(request)

  try {
    requireRole(user, 'artist', 'admin')
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    return NextResponse.json({ error: msg }, { status: msg === 'UNAUTHORIZED' ? 401 : 403 })
  }

  const { searchParams } = new URL(request.url)
  const statusParam = searchParams.get('status') as BookingStatus | null
  const dateParam = searchParams.get('date')

  if (statusParam && !VALID_STATUSES.includes(statusParam)) {
    return NextResponse.json(
      { error: `status must be one of: ${VALID_STATUSES.join(', ')}` },
      { status: 400 }
    )
  }

  if (dateParam && !/^\d{4}-\d{2}-\d{2}$/.test(dateParam)) {
    return NextResponse.json({ error: 'date must be in YYYY-MM-DD format' }, { status: 400 })
  }

  // Resolve artist row for this user
  const { data: artist, error: artistError } = await supabaseAdmin
    .from('artists')
    .select('id')
    .eq('user_id', user!.sub)
    .single()

  if (artistError || !artist) {
    return NextResponse.json({ error: 'Artist profile not found for this user' }, { status: 404 })
  }

  let query = supabaseAdmin
    .from('bookings')
    .select(`
      *,
      services(id, name),
      package_services(id, name),
      users!bookings_customer_id_fkey(id, display_name, phone)
    `)
    .eq('artist_id', artist.id)
    .order('booking_date', { ascending: true })
    .order('booking_time', { ascending: true })

  if (statusParam) {
    query = query.eq('status', statusParam)
  }

  if (dateParam) {
    query = query.eq('booking_date', dateParam)
  }

  const { data, error } = await query

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(data ?? [])
}
