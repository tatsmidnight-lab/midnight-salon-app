/**
 * GET /api/messages/get-conversation?with=USER_UUID
 * Authorization: Bearer <token> | cookie: salon_token=<token>
 *
 * - Returns all messages between current user and the target user
 * - Ordered by created_at ASC
 * - Marks all unread messages where recipient_id = me as read
 */

import { NextRequest, NextResponse } from 'next/server'
import { getAuthUser } from '@/lib/jwt'
import { createClient } from '@supabase/supabase-js'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export async function GET(req: NextRequest) {
  // --- Auth ---
  const user = await getAuthUser(req)
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { searchParams } = new URL(req.url)
  const withUserId = searchParams.get('with')

  // --- Validate query param ---
  if (!withUserId) {
    return NextResponse.json(
      { error: 'Query param "with" is required' },
      { status: 400 }
    )
  }
  if (!UUID_REGEX.test(withUserId)) {
    return NextResponse.json(
      { error: '"with" must be a valid UUID' },
      { status: 400 }
    )
  }

  if (withUserId === user.sub) {
    return NextResponse.json(
      { error: 'Cannot fetch conversation with yourself' },
      { status: 400 }
    )
  }

  try {
    // --- Verify the other user exists ---
    const { data: otherUser, error: userError } = await supabaseAdmin
      .from('users')
      .select('id, display_name')
      .eq('id', withUserId)
      .single()

    if (userError || !otherUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // --- Fetch all messages in the conversation ---
    // (sender=me AND recipient=them) OR (sender=them AND recipient=me)
    const { data: messages, error: fetchError } = await supabaseAdmin
      .from('messages')
      .select('id, sender_id, recipient_id, message_text, is_read, created_at')
      .or(
        `and(sender_id.eq.${user.sub},recipient_id.eq.${withUserId}),and(sender_id.eq.${withUserId},recipient_id.eq.${user.sub})`
      )
      .order('created_at', { ascending: true })

    if (fetchError) {
      throw new Error(fetchError.message)
    }

    // --- Mark unread messages sent to me as read ---
    const unreadIds = (messages ?? [])
      .filter((m) => m.recipient_id === user.sub && !m.is_read)
      .map((m) => m.id)

    if (unreadIds.length > 0) {
      const { error: markReadError } = await supabaseAdmin
        .from('messages')
        .update({ is_read: true })
        .in('id', unreadIds)

      if (markReadError) {
        // Non-fatal: log but don't fail the request
        console.warn('[get-conversation] Failed to mark messages as read:', markReadError.message)
      }
    }

    // Return messages with is_read updated for the ones we just marked
    const unreadSet = new Set(unreadIds)
    const enrichedMessages = (messages ?? []).map((m) =>
      unreadSet.has(m.id) ? { ...m, is_read: true } : m
    )

    return NextResponse.json({
      messages: enrichedMessages,
      partner: { id: otherUser.id, display_name: otherUser.display_name },
    })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Internal server error'
    console.error('[get-conversation]', message)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
