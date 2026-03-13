import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'
import { getAuthUser, requireRole } from '@/lib/jwt'
import { triggerWebhook } from '@/lib/n8n'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(request: Request) {
  try {
    // Authenticate: artist or admin only
    const user = await getAuthUser(request)
    requireRole(user, 'artist', 'admin')

    const body = await request.json()
    const { artist_id, date, slots } = body as {
      artist_id: string
      date: string
      slots: Array<{ time: string; available: boolean }>
    }

    // Validate required fields
    if (!artist_id || !date || !Array.isArray(slots)) {
      return NextResponse.json(
        { error: 'artist_id, date, and slots are required' },
        { status: 400 }
      )
    }

    // Validate date format
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return NextResponse.json(
        { error: 'date must be in YYYY-MM-DD format' },
        { status: 400 }
      )
    }

    // Artists can only update their own availability
    if (user!.role === 'artist' && user!.sub !== artist_id) {
      return NextResponse.json(
        { error: 'Artists can only update their own availability' },
        { status: 403 }
      )
    }

    // Upsert artist_availability row
    const { data, error } = await supabaseAdmin
      .from('artist_availability')
      .upsert(
        {
          artist_id,
          date,
          time_slots_json: slots,
          synced_at: new Date().toISOString(),
        },
        { onConflict: 'artist_id,date' }
      )
      .select()
      .single()

    if (error) {
      console.error('[availability/sync] Supabase upsert error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Trigger n8n booking-calendar webhook with availability data
    const webhookUrl = process.env.N8N_WEBHOOK_BOOKING_CALENDAR
    if (webhookUrl) {
      await triggerWebhook(webhookUrl, {
        type: 'availability_sync',
        artist_id,
        date,
        slots,
        synced_at: data.synced_at,
      })
    } else {
      console.error('[availability/sync] N8N_WEBHOOK_BOOKING_CALENDAR is not set')
    }

    return NextResponse.json(data)
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    if (message === 'UNAUTHORIZED') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    if (message === 'FORBIDDEN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }
    console.error('[availability/sync] Unexpected error:', err)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
