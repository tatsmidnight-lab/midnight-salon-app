import { NextResponse, type NextRequest } from 'next/server'
import { verifyJwt, extractToken } from '@/lib/jwt'

// -------------------------------------------------------------------
// Public paths that bypass all auth checks
// -------------------------------------------------------------------
const PUBLIC_EXACT = new Set(['/', '/login', '/artists', '/services', '/products', '/gift-cards', '/contact', '/terms', '/privacy'])

function isPublicPath(pathname: string): boolean {
  if (PUBLIC_EXACT.has(pathname)) return true
  if (pathname.startsWith('/services')) return true
  if (pathname.startsWith('/products')) return true
  if (pathname.startsWith('/gift-cards')) return true
  if (pathname.startsWith('/contact')) return true
  if (pathname.startsWith('/dash-admin')) return true  // Admin handles its own auth in layout
  if (pathname.startsWith('/api/auth/')) return true
  if (pathname.startsWith('/api/services')) return true
  if (pathname.startsWith('/api/products/get-')) return true
  if (pathname.startsWith('/api/artists')) return true
  if (pathname === '/api/bookings/get-artist-availability') return true
  return false
}

// -------------------------------------------------------------------
// Middleware
// -------------------------------------------------------------------
export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Always pass through API routes (they handle their own auth)
  if (pathname.startsWith('/api/')) {
    return NextResponse.next()
  }

  // Pass through public paths
  if (isPublicPath(pathname)) {
    return NextResponse.next()
  }

  // Attempt to verify the salon_token cookie using Web Crypto (Edge-compatible)
  const token = extractToken(request as unknown as Request)
  let user: Awaited<ReturnType<typeof verifyJwt>> | null = null

  if (token) {
    try {
      user = await verifyJwt(token)
    } catch {
      // Invalid or expired token — treat as unauthenticated
      user = null
    }
  }

  // /admin — require admin role
  if (pathname.startsWith('/admin')) {
    if (!user || user.role !== 'admin') {
      const url = request.nextUrl.clone()
      url.pathname = '/login'
      url.searchParams.set('redirectTo', pathname)
      url.searchParams.set('error', 'unauthorized')
      return NextResponse.redirect(url)
    }
    return NextResponse.next()
  }

  // /artist — require artist or admin role
  if (pathname.startsWith('/artist')) {
    if (!user || (user.role !== 'artist' && user.role !== 'admin')) {
      const url = request.nextUrl.clone()
      url.pathname = '/login'
      url.searchParams.set('redirectTo', pathname)
      return NextResponse.redirect(url)
    }
    return NextResponse.next()
  }

  // /profile or /customer — require any authenticated user
  if (pathname.startsWith('/profile') || pathname.startsWith('/customer')) {
    if (!user) {
      const url = request.nextUrl.clone()
      url.pathname = '/login'
      url.searchParams.set('redirectTo', pathname)
      return NextResponse.redirect(url)
    }
    return NextResponse.next()
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.png$).*)'],
}
