/**
 * GET /api/messages/get-conversations-list
 * Authorization: Bearer <token> | cookie: salon_token=<token>
 *
 * Returns a list of conversations for the current user.
 * Each entry represents a unique conversation partner with:
 *   - partner_id, partner_name
 *   - last_message text and timestamp
 *   - unread_count (messages sent to me that I haven't read)
 *
 * Implementation note:
 *   Supabase JS doesn't support complex GROUP BY natively, so we:
 *   1. Fetch all messages where sender_id = me OR recipient_id = me
 *   2. Group in JS by conversation partner (the other party's id)
 *   3. Find the latest message per group + count unreads
 *   4. Batch-fetch user profiles for all partners
 */

import { NextRequest, NextResponse } from 'next/server'
import { getAuthUser } from '@/lib/jwt'
import { createClient } from '@supabase/supabase-js'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

interface RawMessage {
  id: string
  sender_id: string
  recipient_id: string
  message_text: string
  is_read: boolean
  created_at: string
}

interface ConversationEntry {
  partner_id: string
  partner_name: string | null
  last_message: string
  last_message_at: string
  unread_count: number
}

export async function GET(req: NextRequest) {
  // --- Auth ---
  const user = await getAuthUser(req)
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    // --- Fetch all messages involving the current user ---
    // We pull all messages and group in JS. For very high-volume systems a DB
    // view or RPC would be preferable, but this is correct for typical salon scale.
    const { data: messages, error: fetchError } = await supabaseAdmin
      .from('messages')
      .select('id, sender_id, recipient_id, message_text, is_read, created_at')
      .or(`sender_id.eq.${user.sub},recipient_id.eq.${user.sub}`)
      .order('created_at', { ascending: false })

    if (fetchError) {
      throw new Error(fetchError.message)
    }

    if (!messages || messages.length === 0) {
      return NextResponse.json({ conversations: [] })
    }

    // --- Group by conversation partner ---
    // Key = partner's user id (the other party in each message)
    interface GroupAccumulator {
      latestMessage: RawMessage
      unreadCount: number
    }

    const groupMap = new Map<string, GroupAccumulator>()

    for (const msg of messages as RawMessage[]) {
      const partnerId =
        msg.sender_id === user.sub ? msg.recipient_id : msg.sender_id

      const existing = groupMap.get(partnerId)

      if (!existing) {
        groupMap.set(partnerId, {
          latestMessage: msg, // already sorted DESC so first seen = latest
          unreadCount:
            msg.recipient_id === user.sub && !msg.is_read ? 1 : 0,
        })
      } else {
        // Still count unreads even for older messages
        if (msg.recipient_id === user.sub && !msg.is_read) {
          existing.unreadCount += 1
        }
      }
    }

    if (groupMap.size === 0) {
      return NextResponse.json({ conversations: [] })
    }

    // --- Batch-fetch partner user profiles ---
    const partnerIds = Array.from(groupMap.keys())

    const { data: partnerUsers, error: usersError } = await supabaseAdmin
      .from('users')
      .select('id, display_name, avatar_url')
      .in('id', partnerIds)

    if (usersError) {
      throw new Error(`Failed to fetch partner profiles: ${usersError.message}`)
    }

    const userProfileMap = new Map(
      (partnerUsers ?? []).map((u) => [u.id, u])
    )

    // --- Assemble conversations list ---
    const conversations: ConversationEntry[] = []

    for (const [partnerId, group] of Array.from(groupMap.entries())) {
      const profile = userProfileMap.get(partnerId)
      conversations.push({
        partner_id: partnerId,
        partner_name: profile?.display_name ?? null,
        last_message: group.latestMessage.message_text,
        last_message_at: group.latestMessage.created_at,
        unread_count: group.unreadCount,
      })
    }

    // Sort by last_message_at DESC
    conversations.sort(
      (a, b) =>
        new Date(b.last_message_at).getTime() -
        new Date(a.last_message_at).getTime()
    )

    return NextResponse.json({ conversations })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Internal server error'
    console.error('[get-conversations-list]', message)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
