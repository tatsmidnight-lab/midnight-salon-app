// -------------------------------------------------------------------
// n8n webhook helpers
// All functions degrade gracefully on network error (return null).
// -------------------------------------------------------------------

export async function triggerWebhook(
  url: string,
  payload: unknown
): Promise<unknown> {
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })

    if (!res.ok) {
      console.error(`[n8n] Webhook POST failed: ${res.status} ${res.statusText} — ${url}`)
      return null
    }

    return res.json().catch(() => ({ ok: true }))
  } catch (err) {
    console.error(`[n8n] Network error triggering webhook ${url}:`, err)
    return null
  }
}

// -------------------------------------------------------------------
// Artist service creation
// Triggers voice-to-service AI processing for an artist.
// -------------------------------------------------------------------

export interface ArtistServiceCreationPayload {
  artist_id: string
  artist_name: string
  voice_transcript: string
}

export async function triggerArtistServiceCreation(
  payload: ArtistServiceCreationPayload
): Promise<unknown> {
  const url = process.env.N8N_WEBHOOK_ARTIST_SERVICE_CREATION
  if (!url) {
    console.error('[n8n] N8N_WEBHOOK_ARTIST_SERVICE_CREATION is not set')
    return null
  }
  return triggerWebhook(url, payload)
}

// -------------------------------------------------------------------
// Service suggestions
// Returns AI-generated service recommendations for a customer.
// -------------------------------------------------------------------

export interface ServiceSuggestionsPayload {
  customer_id: string
  voice_transcript: string
  count: number
  style_preferences: string[]
}

export async function triggerServiceSuggestions(
  payload: ServiceSuggestionsPayload
): Promise<unknown> {
  const url = process.env.N8N_WEBHOOK_SERVICE_SUGGESTIONS
  if (!url) {
    console.error('[n8n] N8N_WEBHOOK_SERVICE_SUGGESTIONS is not set')
    return null
  }
  return triggerWebhook(url, payload)
}

// -------------------------------------------------------------------
// Booking calendar
// Creates/updates a calendar event and sends confirmations.
// -------------------------------------------------------------------

export interface BookingCalendarPayload {
  booking_id: string
  customer_id: string
  artist_id: string
  service_id: string
  date: string
  time: string
  products: string[]
}

export async function triggerBookingCalendar(
  payload: BookingCalendarPayload
): Promise<unknown> {
  const url = process.env.N8N_WEBHOOK_BOOKING_CALENDAR
  if (!url) {
    console.error('[n8n] N8N_WEBHOOK_BOOKING_CALENDAR is not set')
    return null
  }
  return triggerWebhook(url, payload)
}

// -------------------------------------------------------------------
// Bulk service creation
// AI-generates and inserts N services for an artist/category.
// -------------------------------------------------------------------

export interface BulkServiceCreationPayload {
  category_id: string
  artist_id: string
  count: number
  style: string
  description: string
}

export async function triggerBulkServiceCreation(
  payload: BulkServiceCreationPayload
): Promise<unknown> {
  const url = process.env.N8N_WEBHOOK_BULK_SERVICE_CREATION
  if (!url) {
    console.error('[n8n] N8N_WEBHOOK_BULK_SERVICE_CREATION is not set')
    return null
  }
  return triggerWebhook(url, payload)
}

// -------------------------------------------------------------------
// Bulk SMS
// Sends templated SMS messages to a list of recipients.
// -------------------------------------------------------------------

export interface BulkSmsPayload {
  recipients: string[]
  message_template: string
  variables: Record<string, string>
}

export async function triggerBulkSms(
  payload: BulkSmsPayload
): Promise<unknown> {
  const url = process.env.N8N_WEBHOOK_BULK_SMS
  if (!url) {
    console.error('[n8n] N8N_WEBHOOK_BULK_SMS is not set')
    return null
  }
  return triggerWebhook(url, payload)
}
