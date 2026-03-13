import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

interface Params {
  params: { id: string }
}

export async function GET(_request: Request, { params }: Params) {
  const supabase = createClient()

  const { data: artist, error: artistError } = await supabase
    .from('artists')
    .select('*')
    .eq('id', params.id)
    .single()

  if (artistError) {
    return NextResponse.json({ error: artistError.message }, { status: 404 })
  }

  // Get user display name
  let name = 'Artist'
  if (artist.user_id) {
    const { data: user } = await supabase
      .from('users')
      .select('display_name, avatar_url')
      .eq('id', artist.user_id)
      .single()
    if (user) name = user.display_name || 'Artist'
  }

  // Get services
  const { data: services } = await supabase
    .from('services')
    .select('*')
    .eq('artist_id', params.id)

  return NextResponse.json({
    id: artist.id,
    user_id: artist.user_id,
    name,
    bio: artist.bio || '',
    avatar_url: artist.profile_image || null,
    specialties: artist.specialties || [],
    instagram_url: artist.instagram_url,
    is_active: artist.is_active,
    services: services ?? [],
  })
}
