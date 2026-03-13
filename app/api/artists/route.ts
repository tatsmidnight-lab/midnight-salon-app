import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET() {
  const supabase = createClient()

  // Get artists
  const { data: artists, error } = await supabase
    .from('artists')
    .select('*')
    .eq('is_active', true)
    .order('created_at')

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  if (!artists || artists.length === 0) {
    return NextResponse.json([])
  }

  // Get user profiles for display names
  const userIds = artists.map((a) => a.user_id).filter(Boolean)
  const { data: users } = await supabase
    .from('users')
    .select('id, display_name, phone, avatar_url')
    .in('id', userIds)

  const userMap = new Map((users ?? []).map((u) => [u.id, u]))

  // Merge artist + user data
  const merged = artists.map((a) => {
    const user = userMap.get(a.user_id)
    return {
      id: a.id,
      user_id: a.user_id,
      name: user?.display_name || 'Artist',
      bio: a.bio || '',
      avatar_url: a.profile_image || user?.avatar_url || null,
      specialties: a.specialties || [],
      instagram_url: a.instagram_url,
      is_active: a.is_active,
      services: a.specialties || [],
    }
  })

  return NextResponse.json(merged)
}
