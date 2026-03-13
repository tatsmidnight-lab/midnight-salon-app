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
    const { artist_id, availability } = body as {
      artist_id: string
      availability: Array<{
        date: string
        slots: Array<{ time: string; available: boolean }>
      }>
    }

    // Validate required fields
    if (!artist_id || !Array.isArray(availability) || availability.length === 0) {
      return NextResponse.json(
        { error: 'artist_id and availability array are required' },
        { status: 400 }
      )
    }

    // Validate each entry
    for (const entry of availability) {
      if (!entry.date || !Array.isArray(entry.slots)) {
        return NextResponse.json(
          { error: 'Each availability entry must have date and slots' },
          { status: 400 }
        )
      }
      if (!/^\d{4}-\d{2}-\d{2}$/.test(entry.date)) {
        return NextResponse.json(
          { error: `Invalid date format: ${entry.date}. Must be YYYY-MM-DD` },
          { status: 400 }
        )
      }
    }

    // Artists can only update their own availability
    if (user!.role === 'artist' && user!.sub !== artist_id) {
      return NextResponse.json(
        { error: 'Artists can only update their own availability' },
        { status: 403 }
      )
    }

    const now = new Date().toISOString()

    // Build rows for bulk upsert
    const rows = availability.map((entry) => ({
      artist_id,
      date: entry.date,
      time_slots_json: entry.slots,
      synced_at: now,
    }))

    // Upsert all rows at once
    const { data, error } = await supabaseAdmin
      .from('artist_availability')
      .upsert(rows, { onConflict: 'artist_id,date' })
      .select()

    if (error) {
      console.error('[availability/bulk-sync] Supabase upsert error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Trigger n8n booking-calendar webhook once with all the data
    const webhookUrl = process.env.N8N_WEBHOOK_BOOKING_CALENDAR
    if (webhookUrl) {
      await triggerWebhook(webhookUrl, {
        type: 'availability_bulk_sync',
        artist_id,
        availability,
        synced_at: now,
      })
    } else {
      console.error('[availability/bulk-sync] N8N_WEBHOOK_BOOKING_CALENDAR is not set')
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
    console.error('[availability/bulk-sync] Unexpected error:', err)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
