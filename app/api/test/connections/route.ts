import { NextResponse } from 'next/server'

interface ConnectionResult {
  status: string
  [key: string]: unknown
}

async function testSupabase(): Promise<ConnectionResult> {
  try {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY!
    const headers = { apikey: key, Authorization: `Bearer ${key}` }

    const [usersRes, servicesRes, artistsRes, bookingsRes] = await Promise.all([
      fetch(`${url}/rest/v1/users?select=count`, { headers: { ...headers, Prefer: 'count=exact' } }),
      fetch(`${url}/rest/v1/services?select=count`, { headers: { ...headers, Prefer: 'count=exact' } }),
      fetch(`${url}/rest/v1/artists?select=count`, { headers: { ...headers, Prefer: 'count=exact' } }),
      fetch(`${url}/rest/v1/bookings?select=count`, { headers: { ...headers, Prefer: 'count=exact' } }),
    ])

    const parseCount = (res: Response) => {
      const range = res.headers.get('content-range')
      return range ? parseInt(range.split('/')[1]) || 0 : 0
    }

    return {
      status: '✅',
      users_count: parseCount(usersRes),
      services_count: parseCount(servicesRes),
      artists_count: parseCount(artistsRes),
      bookings_count: parseCount(bookingsRes),
    }
  } catch (e: unknown) {
    return { status: '❌', error: e instanceof Error ? e.message : String(e) }
  }
}

async function testN8n(): Promise<ConnectionResult> {
  try {
    const baseUrl = process.env.N8N_API_URL!
    const apiKey = process.env.N8N_API_KEY!

    const res = await fetch(`${baseUrl}/api/v1/workflows`, {
      headers: { 'X-N8N-API-KEY': apiKey },
    })

    if (!res.ok) throw new Error(`n8n API returned ${res.status}`)

    const data = await res.json()
    const workflows = data.data || []
    const activeCount = workflows.filter((w: { active: boolean }) => w.active).length

    const webhookPaths = [
      process.env.N8N_WEBHOOK_ARTIST_SERVICE,
      process.env.N8N_WEBHOOK_SUGGESTIONS,
      process.env.N8N_WEBHOOK_BOOKING,
      process.env.N8N_WEBHOOK_BULK_SERVICES,
      process.env.N8N_WEBHOOK_BULK_SMS,
    ]
    const webhooksConfigured = webhookPaths.filter(Boolean).length

    return {
      status: '✅',
      total_workflows: workflows.length,
      active_workflows: activeCount,
      webhooks_configured: webhooksConfigured,
      workflow_names: workflows.map((w: { name: string; active: boolean }) => ({
        name: w.name,
        active: w.active,
      })),
    }
  } catch (e: unknown) {
    return { status: '❌', error: e instanceof Error ? e.message : String(e) }
  }
}

async function testTwilio(): Promise<ConnectionResult> {
  try {
    const sid = process.env.TWILIO_ACCOUNT_SID!
    const token = process.env.TWILIO_AUTH_TOKEN!

    const res = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${sid}.json`, {
      headers: {
        Authorization: 'Basic ' + Buffer.from(`${sid}:${token}`).toString('base64'),
      },
    })

    if (!res.ok) throw new Error(`Twilio returned ${res.status}`)

    const data = await res.json()
    return {
      status: '✅',
      account_name: data.friendly_name,
      account_status: data.status,
      phone_number: process.env.TWILIO_PHONE_NUMBER || 'not set',
      verify_service: process.env.TWILIO_VERIFY_SERVICE_SID ? 'configured' : 'not set',
    }
  } catch (e: unknown) {
    return { status: '❌', error: e instanceof Error ? e.message : String(e) }
  }
}

async function testSquare(): Promise<ConnectionResult> {
  try {
    const token = process.env.SQUARE_ACCESS_TOKEN!
    const baseUrl = process.env.NODE_ENV === 'production'
      ? 'https://connect.squareup.com/v2'
      : 'https://connect.squareupsandbox.com/v2'

    const res = await fetch(`${baseUrl}/locations`, {
      headers: {
        Authorization: `Bearer ${token}`,
        'Square-Version': '2024-01-18',
      },
    })

    if (!res.ok) throw new Error(`Square returned ${res.status}`)

    const data = await res.json()
    const locations = data.locations || []

    return {
      status: '✅',
      sandbox: process.env.NODE_ENV !== 'production',
      locations_count: locations.length,
      location_name: locations[0]?.name || 'unknown',
      location_id: process.env.SQUARE_LOCATION_ID || 'not set',
    }
  } catch (e: unknown) {
    return { status: '❌', error: e instanceof Error ? e.message : String(e) }
  }
}

async function testClaude(): Promise<ConnectionResult> {
  try {
    const apiKey = process.env.ANTHROPIC_API_KEY!
    const start = Date.now()

    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 60,
        messages: [{ role: 'user', content: 'In one sentence, describe a luxury hair treatment.' }],
      }),
    })

    const elapsed = Date.now() - start

    if (!res.ok) {
      const err = await res.text()
      throw new Error(`Claude API returned ${res.status}: ${err}`)
    }

    const data = await res.json()
    const text = data.content?.[0]?.text || ''

    return {
      status: '✅',
      response_time_ms: elapsed,
      model: data.model,
      sample_response: text,
    }
  } catch (e: unknown) {
    return { status: '❌', error: e instanceof Error ? e.message : String(e) }
  }
}

async function testGoogleCalendar(): Promise<ConnectionResult> {
  const clientId = process.env.GOOGLE_CALENDAR_CLIENT_ID
  const clientSecret = process.env.GOOGLE_CALENDAR_CLIENT_SECRET
  const apiKey = process.env.GOOGLE_CALENDAR_API_KEY

  const configured = clientId && clientId !== 'YOUR_GOOGLE_CALENDAR_CLIENT_ID'
  const hasApiKey = apiKey && apiKey !== 'YOUR_GOOGLE_CALENDAR_API_KEY'

  return {
    status: configured ? '⚠️' : '❌',
    oauth_client_configured: !!configured,
    client_secret_set: !!(clientSecret && clientSecret !== 'YOUR_GOOGLE_CALENDAR_CLIENT_SECRET'),
    api_key_set: !!hasApiKey,
    note: configured ? 'OAuth credentials set — refresh token pending' : 'Not configured',
  }
}

export async function GET() {
  const start = Date.now()

  const [supabase, n8n, twilio, square, claude, googleCalendar] = await Promise.all([
    testSupabase(),
    testN8n(),
    testTwilio(),
    testSquare(),
    testClaude(),
    testGoogleCalendar(),
  ])

  const connections = { supabase, n8n, twilio, square, claude, google_calendar: googleCalendar }

  const allStatuses = Object.values(connections).map((c) => c.status)
  const hasError = allStatuses.some((s) => s === '❌')
  const hasWarning = allStatuses.some((s) => s === '⚠️')

  const overall_status = hasError
    ? '❌ Some services failed'
    : hasWarning
      ? '⚠️ Some services pending setup'
      : '✅ All systems operational'

  return NextResponse.json({
    timestamp: new Date().toISOString(),
    duration_ms: Date.now() - start,
    overall_status,
    connections,
  })
}
