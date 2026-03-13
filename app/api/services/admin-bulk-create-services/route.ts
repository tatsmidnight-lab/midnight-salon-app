import { NextResponse } from 'next/server'
import { getAuthUser, requireRole } from '@/lib/jwt'

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

  const { category_id, artist_id, count, style, description } = body as {
    category_id?: string
    artist_id?: string
    count?: number
    style?: string
    description?: string
  }

  if (!category_id || !count || !style || !description) {
    return NextResponse.json(
      { error: 'category_id, count, style, and description are required' },
      { status: 400 }
    )
  }

  const webhookUrl = process.env.N8N_WEBHOOK_BULK_SERVICES
  if (!webhookUrl) {
    return NextResponse.json({ error: 'Bulk services webhook is not configured' }, { status: 500 })
  }

  let n8nResponse: unknown
  try {
    const res = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ category_id, artist_id, count, style, description }),
    })

    if (!res.ok) {
      const text = await res.text()
      throw new Error(`n8n webhook responded with ${res.status}: ${text}`)
    }

    n8nResponse = await res.json().catch(() => ({ ok: true }))
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Webhook call failed'
    return NextResponse.json({ error: msg }, { status: 502 })
  }

  return NextResponse.json(n8nResponse, { status: 201 })
}
