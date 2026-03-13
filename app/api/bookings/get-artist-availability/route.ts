import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const ONE_HOUR_MS = 60 * 60 * 1000

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const artistId = searchParams.get('artist_id')
  const date = searchParams.get('date')

  if (!artistId || !date) {
    return NextResponse.json({ error: 'artist_id and date are required' }, { status: 400 })
  }

  // Validate date format
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return NextResponse.json({ error: 'date must be in YYYY-MM-DD format' }, { status: 400 })
  }

  const { data, error } = await supabaseAdmin
    .from('artist_availability')
    .select('*')
    .eq('artist_id', artistId)
    .eq('date', date)
    .single()

  if (error && error.code !== 'PGRST116') {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  // No row found
  if (!data) {
    return NextResponse.json({ time_slots: [], needs_sync: true })
  }

  // Check if synced_at is older than 1 hour
  const syncedAt = data.synced_at ? new Date(data.synced_at).getTime() : 0
  const isStale = Date.now() - syncedAt > ONE_HOUR_MS

  if (isStale) {
    return NextResponse.json({ time_slots: [], needs_sync: true })
  }

  return NextResponse.json({
    time_slots: data.time_slots_json ?? [],
    needs_sync: false,
    synced_at: data.synced_at,
  })
}
