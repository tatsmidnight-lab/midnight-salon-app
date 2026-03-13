/**
 * JWT utilities for custom phone-based auth.
 *
 * We sign JWTs with the Supabase project JWT secret so that
 * Supabase RLS policies (auth.jwt()) accept our tokens natively.
 *
 * Payload shape matches what Supabase expects:
 *   { sub, role, iss, iat, exp }
 */

export interface JwtPayload {
  sub: string      // users.id (UUID)
  phone: string
  role: 'admin' | 'artist' | 'customer'
  iss: string
  iat: number
  exp: number
}

// -------------------------------------------------------------------
// Pure base64url helpers (no external deps — runs in Edge Runtime)
// -------------------------------------------------------------------

function base64url(input: string | Uint8Array): string {
  const bytes =
    typeof input === 'string' ? new TextEncoder().encode(input) : input
  let binary = ''
  bytes.forEach((b) => (binary += String.fromCharCode(b)))
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '')
}

function base64urlDecode(input: string): Uint8Array {
  const padded = input.replace(/-/g, '+').replace(/_/g, '/').padEnd(
    input.length + ((4 - (input.length % 4)) % 4),
    '='
  )
  const binary = atob(padded)
  return new Uint8Array([...binary].map((c) => c.charCodeAt(0)))
}

async function hmacKey(secret: string): Promise<CryptoKey> {
  return crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign', 'verify']
  )
}

// -------------------------------------------------------------------
// Sign
// -------------------------------------------------------------------

export async function signJwt(
  payload: Omit<JwtPayload, 'iss' | 'iat' | 'exp'>,
  expiresInSeconds = 60 * 60 * 24 * 7 // 7 days
): Promise<string> {
  const secret = process.env.SUPABASE_JWT_SECRET
  if (!secret) throw new Error('SUPABASE_JWT_SECRET is not set')

  const now = Math.floor(Date.now() / 1000)
  const fullPayload: JwtPayload = {
    ...payload,
    iss: 'supabase',
    iat: now,
    exp: now + expiresInSeconds,
  }

  const header = base64url(JSON.stringify({ alg: 'HS256', typ: 'JWT' }))
  const body = base64url(JSON.stringify(fullPayload))
  const unsigned = `${header}.${body}`

  const key = await hmacKey(secret)
  const sigBytes = await crypto.subtle.sign(
    'HMAC',
    key,
    new TextEncoder().encode(unsigned)
  )
  const sig = base64url(new Uint8Array(sigBytes))

  return `${unsigned}.${sig}`
}

// -------------------------------------------------------------------
// Verify & decode
// -------------------------------------------------------------------

export async function verifyJwt(token: string): Promise<JwtPayload> {
  const secret = process.env.SUPABASE_JWT_SECRET
  if (!secret) throw new Error('SUPABASE_JWT_SECRET is not set')

  const parts = token.split('.')
  if (parts.length !== 3) throw new Error('Invalid JWT format')

  const [header, body, sig] = parts
  const unsigned = `${header}.${body}`

  const key = await hmacKey(secret)
  const valid = await crypto.subtle.verify(
    'HMAC',
    key,
    base64urlDecode(sig) as any,
    new TextEncoder().encode(unsigned) as any
  )
  if (!valid) throw new Error('Invalid JWT signature')

  const payload: JwtPayload = JSON.parse(
    new TextDecoder().decode(base64urlDecode(body))
  )

  if (payload.exp < Math.floor(Date.now() / 1000)) {
    throw new Error('JWT expired')
  }

  return payload
}

// -------------------------------------------------------------------
// Extract from request (Bearer header or cookie)
// -------------------------------------------------------------------

export function extractToken(request: Request): string | null {
  const auth = request.headers.get('authorization')
  if (auth?.startsWith('Bearer ')) return auth.slice(7)

  const cookie = request.headers.get('cookie')
  if (cookie) {
    const match = cookie.match(/(?:^|;\s*)salon_token=([^;]+)/)
    if (match) return match[1]
  }

  return null
}

export async function getAuthUser(
  request: Request
): Promise<JwtPayload | null> {
  const token = extractToken(request)
  if (!token) return null
  try {
    return await verifyJwt(token)
  } catch {
    return null
  }
}

export function requireRole(
  user: JwtPayload | null,
  ...roles: Array<'admin' | 'artist' | 'customer'>
): void {
  if (!user) throw new Error('UNAUTHORIZED')
  if (!roles.includes(user.role)) throw new Error('FORBIDDEN')
}
