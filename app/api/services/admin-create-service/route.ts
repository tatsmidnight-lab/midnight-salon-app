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

  const { category_id, artist_id, name, description, base_price, duration, image_url } = body as {
    category_id?: string
    artist_id?: string
    name?: string
    description?: string
    base_price?: number
    duration?: number
    image_url?: string
  }

  if (!category_id || !name || base_price === undefined || duration === undefined) {
    return NextResponse.json(
      { error: 'category_id, name, base_price, and duration are required' },
      { status: 400 }
    )
  }

  const { data, error } = await supabaseAdmin
    .from('services')
    .insert({
      category_id,
      artist_id: artist_id ?? null,
      name,
      description: description ?? null,
      base_price: Number(base_price),
      duration: Number(duration),
      image_url: image_url ?? null,
      is_active: true,
    })
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(data, { status: 201 })
}
