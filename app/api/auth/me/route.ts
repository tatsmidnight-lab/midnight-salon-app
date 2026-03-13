/**
 * GET /api/auth/me
 * Authorization: Bearer <token>  OR  cookie: salon_token=<token>
 *
 * Returns the current user's full profile from the users table.
 * Also returns artist profile if role=artist.
 */

import { NextRequest, NextResponse } from 'next/server'
import { getAuthUser } from '@/lib/jwt'
import { createClient } from '@supabase/supabase-js'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(req: NextRequest) {
  const user = await getAuthUser(req)

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { data: profile, error } = await supabaseAdmin
      .from('users')
      .select('id, phone, role, display_name, email, avatar_url, created_at')
      .eq('id', user.sub)
      .single()

    if (error || !profile) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // If artist, include their artist profile
    if (profile.role === 'artist') {
      const { data: artistProfile } = await supabaseAdmin
        .from('artists')
        .select(
          'id, bio, profile_image, specialties, instagram_url, gcal_email, is_active'
        )
        .eq('user_id', profile.id)
        .single()

      return NextResponse.json({
        ...profile,
        artist_profile: artistProfile ?? null,
      })
    }

    return NextResponse.json(profile)
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to fetch user'
    console.error('[me]', message)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
