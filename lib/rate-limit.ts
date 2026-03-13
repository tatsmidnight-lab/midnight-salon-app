/**
 * Simple in-memory rate limiter for API routes (Edge-compatible).
 * Not shared across serverless instances — good enough for basic protection.
 */

const rateMap = new Map<string, { count: number; resetAt: number }>()

// Clean up expired entries every 60s
setInterval(() => {
  const now = Date.now()
  for (const [key, val] of rateMap) {
    if (val.resetAt < now) rateMap.delete(key)
  }
}, 60_000)

interface RateLimitOptions {
  /** Max requests per window */
  limit?: number
  /** Window size in seconds */
  windowSec?: number
}

export function rateLimit(
  ip: string,
  opts: RateLimitOptions = {}
): { ok: boolean; remaining: number } {
  const { limit = 30, windowSec = 60 } = opts
  const now = Date.now()
  const key = ip

  const entry = rateMap.get(key)
  if (!entry || entry.resetAt < now) {
    rateMap.set(key, { count: 1, resetAt: now + windowSec * 1000 })
    return { ok: true, remaining: limit - 1 }
  }

  entry.count++
  if (entry.count > limit) {
    return { ok: false, remaining: 0 }
  }
  return { ok: true, remaining: limit - entry.count }
}

/** Helper to get client IP from request headers */
export function getClientIp(request: Request): string {
  const forwarded = request.headers.get('x-forwarded-for')
  if (forwarded) return forwarded.split(',')[0].trim()
  return request.headers.get('x-real-ip') || '0.0.0.0'
}
