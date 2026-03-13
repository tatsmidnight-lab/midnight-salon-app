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
    requireRole(user, 'admin')
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

  const { artist_id, service_ids } = body as {
    artist_id?: string
    service_ids?: string[]
  }

  if (!artist_id || !Array.isArray(service_ids) || service_ids.length === 0) {
    return NextResponse.json(
      { error: 'artist_id and a non-empty service_ids array are required' },
      { status: 400 }
    )
  }

  const { data, error, count } = await supabaseAdmin
    .from('services')
    .update({ artist_id })
    .in('id', service_ids)
    .select()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ updated: count ?? data?.length ?? 0 })
}
