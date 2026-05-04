import { type NextRequest, NextResponse } from 'next/server'

const SESSION_COOKIE = 'gas_tracker_session'

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl
  const sessionCookie = request.cookies.get(SESSION_COOKIE)?.value
  const isAuthed = !!sessionCookie

  // Redirect logged-in users away from auth pages
  if (pathname.startsWith('/auth/') && isAuthed) {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  // Protected app routes
  if (
    pathname.startsWith('/dashboard') ||
    pathname.startsWith('/stations/nearby') ||
    pathname.startsWith('/validate') ||
    pathname.startsWith('/profile') ||
    pathname.startsWith('/settings')
  ) {
    if (!isAuthed) {
      const loginUrl = new URL('/auth/login', request.url)
      loginUrl.searchParams.set('callbackUrl', pathname)
      return NextResponse.redirect(loginUrl)
    }
  }

  // Admin-only routes — role check happens in layout (server-side)
  if (pathname.startsWith('/admin')) {
    if (!isAuthed) return NextResponse.redirect(new URL('/auth/login', request.url))
  }

  // Moderator routes
  if (pathname.startsWith('/moderator')) {
    if (!isAuthed) return NextResponse.redirect(new URL('/auth/login', request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    '/auth/:path*',
    '/dashboard/:path*',
    '/stations/nearby/:path*',
    '/validate/:path*',
    '/profile/:path*',
    '/settings/:path*',
    '/admin/:path*',
    '/moderator/:path*',
  ],
}
