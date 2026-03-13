import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const categoryId = searchParams.get('category_id')

  if (!categoryId) {
    return NextResponse.json({ error: 'category_id is required' }, { status: 400 })
  }

  const { data, error } = await supabaseAdmin
    .from('services')
    .select(`
      *,
      service_categories(name),
      artists(
        id,
        users(display_name, avatar_url)
      )
    `)
    .eq('category_id', categoryId)
    .eq('is_active', true)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  // Flatten artist name for convenience
  const result = (data ?? []).map((service: Record<string, unknown>) => {
    const artist = service.artists as { id: string; users: { display_name: string; avatar_url: string } } | null
    return {
      ...service,
      artist_name: artist?.users?.display_name ?? null,
      artist_avatar_url: artist?.users?.avatar_url ?? null,
    }
  })

  return NextResponse.json(result)
}
