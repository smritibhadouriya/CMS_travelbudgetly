// Proxy (Next.js 16's renamed Middleware) — route-level auth guard.
//
// Runs on every matched request BEFORE the page renders. It does an
// *optimistic* check only: presence of the httpOnly `token` cookie set at
// login. Per the Next.js auth guide, proxy runs on the edge and on every
// (incl. prefetched) request, so it must NOT decode/verify the JWT or hit the
// DB here — the real verification lives in the API routes.
import { NextResponse } from 'next/server';

// Only this app route is reachable without a token.
const PUBLIC_ROUTES = ['/login'];

export default function proxy(req) {
  const { pathname } = req.nextUrl;
  const hasToken = Boolean(req.cookies.get('token')?.value);

  // Index: bounce straight to the right place (replaces the client redirect).
  if (pathname === '/') {
    return NextResponse.redirect(new URL(hasToken ? '/dashboard' : '/login', req.nextUrl));
  }

  const isPublic = PUBLIC_ROUTES.includes(pathname);

  // Not logged in + protected page -> login.
  if (!hasToken && !isPublic) {
    return NextResponse.redirect(new URL('/login', req.nextUrl));
  }

  // Already logged in + on /login -> dashboard.
  if (hasToken && isPublic) {
    return NextResponse.redirect(new URL('/dashboard', req.nextUrl));
  }

  return NextResponse.next();
}

// Skip API routes, Next internals, and static assets (anything with a dot).
export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico|.*\\..*).*)'],
};
