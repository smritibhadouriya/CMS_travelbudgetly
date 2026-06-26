// app/api/auth/logout/route.js
// Native Next.js App Router handler.
//
// Clears the httpOnly `token` cookie. Set-Cookie string (cookie-clear format):
//   token=; Max-Age=0; Path=/

import { NextResponse } from 'next/server';

/* ── POST /api/auth/logout ── */
export async function POST() {
  const cookie = 'token=; Max-Age=0; Path=/';
  return new NextResponse(JSON.stringify({ message: 'Logged out' }), { status: 200, headers: { 'content-type': 'application/json; charset=utf-8', 'set-cookie': cookie } });
}
