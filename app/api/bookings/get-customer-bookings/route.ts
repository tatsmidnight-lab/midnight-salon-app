import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'
import { getAuthUser, requireRole } from '@/lib/jwt'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const VALID_STATUSES = ['pending', 'confirmed', 'completed', 'cancelled'] as const
type BookingStatus = (typeof VALID_STATUSES)[number]

export async function GET(request: Request) {
  const user = await getAuthUser(request)

  try {
    requireRole(user, 'customer', 'admin')
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    return NextResponse.json({ error: msg }, { status: msg === 'UNAUTHORIZED' ? 401 : 403 })
  }

  const { searchParams } = new URL(request.url)
  const statusParam = searchParams.get('status') as BookingStatus | null

  if (statusParam && !VALID_STATUSES.includes(statusParam)) {
    return NextResponse.json(
      { error: `status must be one of: ${VALID_STATUSES.join(', ')}` },
      { status: 400 }
    )
  }

  let query = supabaseAdmin
    .from('bookings')
    .select(`
      *,
      services(id, name),
      package_services(id, name),
      artists(
        id,
        users(display_name)
      )
    `)
    .eq('customer_id', user!.sub)
    .order('booking_date', { ascending: false })

  if (statusParam) {
    query = query.eq('status', statusParam)
  }

  const { data, error } = await query

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(data ?? [])
}
