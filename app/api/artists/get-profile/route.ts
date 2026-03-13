import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(request: NextRequest) {
  const userId = request.nextUrl.searchParams.get('user_id')

  if (!userId) {
    return NextResponse.json({ error: 'user_id is required' }, { status: 400 })
  }

  const { data: artist, error } = await supabaseAdmin
    .from('artists')
    .select('*')
    .eq('user_id', userId)
    .eq('is_active', true)
    .single()

  if (error || !artist) {
    return NextResponse.json({ error: 'Artist not found' }, { status: 404 })
  }

  // Get user display info
  const { data: user } = await supabaseAdmin
    .from('users')
    .select('display_name, phone, avatar_url')
    .eq('id', userId)
    .single()

  return NextResponse.json({
    id: artist.id,
    user_id: artist.user_id,
    name: user?.display_name || 'Artist',
    bio: artist.bio || '',
    avatar_url: artist.profile_image || user?.avatar_url || null,
    specialties: artist.specialties || [],
    instagram_url: artist.instagram_url,
    is_active: artist.is_active,
  })
}
