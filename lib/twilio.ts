/**
 * Twilio Verify helpers.
 * Uses the Verify v2 service (not the legacy SMS API directly).
 * TWILIO_VERIFY_SERVICE_SID must be set.
 */

const TWILIO_BASE = 'https://verify.twilio.com/v2'

function twilioAuth(): string {
  const sid = process.env.TWILIO_ACCOUNT_SID!
  const token = process.env.TWILIO_AUTH_TOKEN!
  return 'Basic ' + Buffer.from(`${sid}:${token}`).toString('base64')
}

/**
 * Send an OTP to the given phone number via Twilio Verify.
 * Returns the Twilio verification SID on success.
 */
export async function sendOtp(phone: string): Promise<{ sid: string }> {
  const serviceSid = process.env.TWILIO_VERIFY_SERVICE_SID!
  const url = `${TWILIO_BASE}/Services/${serviceSid}/Verifications`

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: twilioAuth(),
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({ To: phone, Channel: 'sms' }).toString(),
  })

  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(
      `Twilio sendOtp failed: ${err.message || res.statusText} (${res.status})`
    )
  }

  const data = await res.json()
  return { sid: data.sid }
}

/**
 * Verify the OTP code.
 * Returns true if approved, false if incorrect.
 * Throws on Twilio API errors.
 */
export async function verifyOtp(
  phone: string,
  code: string
): Promise<boolean> {
  const serviceSid = process.env.TWILIO_VERIFY_SERVICE_SID!
  const url = `${TWILIO_BASE}/Services/${serviceSid}/VerificationCheck`

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: twilioAuth(),
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({ To: phone, Code: code }).toString(),
  })

  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    // 404 = code not found / already used — treat as invalid
    if (res.status === 404) return false
    throw new Error(
      `Twilio verifyOtp failed: ${err.message || res.statusText} (${res.status})`
    )
  }

  const data = await res.json()
  return data.status === 'approved'
}

/**
 * Send a plain SMS via Twilio Messaging (for bulk SMS, not OTP).
 */
export async function sendSms(to: string, body: string): Promise<void> {
  const accountSid = process.env.TWILIO_ACCOUNT_SID!
  const from = process.env.TWILIO_PHONE_NUMBER!
  const url = `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: twilioAuth(),
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({ To: to, From: from, Body: body }).toString(),
  })

  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(
      `Twilio sendSms failed: ${err.message || res.statusText} (${res.status})`
    )
  }
}
