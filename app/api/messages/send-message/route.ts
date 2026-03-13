/**
 * POST /api/messages/send-message
 * Authorization: Bearer <token> | cookie: salon_token=<token>
 *
 * Body: { recipient_id: string (UUID), message_text: string (max 2000 chars) }
 *
 * Logic:
 * 1. Must be authenticated (any role)
 * 2. Validate recipient_id UUID + non-empty message_text (max 2000 chars)
 * 3. Verify recipient exists in users table
 * 4. Insert into messages (sender_id = user.sub)
 * 5. Return created message
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

export async function POST(req: NextRequest) {
  // --- Auth ---
  const user = await getAuthUser(req)
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // --- Parse body ---
  let body: { recipient_id?: unknown; message_text?: unknown }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  // --- Validate recipient_id ---
  if (
    !body.recipient_id ||
    typeof body.recipient_id !== 'string' ||
    !UUID_REGEX.test(body.recipient_id)
  ) {
    return NextResponse.json(
      { error: 'recipient_id must be a valid UUID' },
      { status: 400 }
    )
  }

  // --- Validate message_text ---
  if (
    !body.message_text ||
    typeof body.message_text !== 'string' ||
    body.message_text.trim().length === 0
  ) {
    return NextResponse.json(
      { error: 'message_text must be a non-empty string' },
      { status: 400 }
    )
  }

  if (body.message_text.length > 2000) {
    return NextResponse.json(
      { error: 'message_text must not exceed 2000 characters' },
      { status: 400 }
    )
  }

  const recipientId = body.recipient_id
  const messageText = body.message_text.trim()

  // --- Prevent messaging yourself ---
  if (recipientId === user.sub) {
    return NextResponse.json(
      { error: 'Cannot send a message to yourself' },
      { status: 400 }
    )
  }

  try {
    // --- Verify recipient exists ---
    const { data: recipient, error: recipientError } = await supabaseAdmin
      .from('users')
      .select('id, display_name')
      .eq('id', recipientId)
      .single()

    if (recipientError || !recipient) {
      return NextResponse.json({ error: 'Recipient not found' }, { status: 404 })
    }

    // --- Insert message ---
    const { data: message, error: insertError } = await supabaseAdmin
      .from('messages')
      .insert({
        sender_id: user.sub,
        recipient_id: recipientId,
        message_text: messageText,
        is_read: false,
      })
      .select()
      .single()

    if (insertError || !message) {
      throw new Error(insertError?.message ?? 'Failed to send message')
    }

    return NextResponse.json({ message }, { status: 201 })
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : 'Internal server error'
    console.error('[send-message]', errorMessage)
    return NextResponse.json({ error: errorMessage }, { status: 500 })
  }
}
