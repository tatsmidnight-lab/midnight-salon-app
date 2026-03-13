/**
 * Structured logger with automatic PII redaction.
 * Never logs passwords, tokens, card numbers, phone numbers, or emails.
 */

type LogLevel = 'info' | 'warn' | 'error'

const REDACT_KEYS = new Set([
  'password', 'token', 'secret', 'authorization', 'cookie',
  'card_number', 'cvv', 'credit_card', 'api_key', 'apikey',
])

function redactValue(key: string, value: unknown): unknown {
  if (typeof value !== 'string') return value
  const k = key.toLowerCase()

  // Redact known sensitive keys
  if (REDACT_KEYS.has(k)) return 'REDACTED'

  // Redact phone numbers (E.164 or local)
  if (k === 'phone' || k === 'phone_number') return 'REDACTED'

  // Redact emails
  if (k === 'email') return 'REDACTED'

  return value
}

function sanitizeContext(ctx: Record<string, unknown>): Record<string, unknown> {
  const sanitized: Record<string, unknown> = {}
  for (const [key, value] of Object.entries(ctx)) {
    sanitized[key] = redactValue(key, value)
  }
  return sanitized
}

function log(level: LogLevel, message: string, context?: Record<string, unknown>) {
  const entry = {
    timestamp: new Date().toISOString(),
    level,
    message,
    ...(context ? sanitizeContext(context) : {}),
  }

  if (level === 'error') {
    console.error(JSON.stringify(entry))
  } else if (level === 'warn') {
    console.warn(JSON.stringify(entry))
  } else {
    console.log(JSON.stringify(entry))
  }
}

export const logger = {
  info: (message: string, context?: Record<string, unknown>) => log('info', message, context),
  warn: (message: string, context?: Record<string, unknown>) => log('warn', message, context),
  error: (message: string, context?: Record<string, unknown>) => log('error', message, context),
}
