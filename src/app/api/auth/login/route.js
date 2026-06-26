// app/api/auth/login/route.js
// Native Next.js App Router handler.
// Credential check stays in auth.service (verifyUserCredentials).
//
// The Set-Cookie string is built to match the prior cookie format byte-for-byte:
//   token=<enc>; Max-Age=86400; Path=/; HttpOnly[; Secure]; SameSite=lax

import { NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import * as authService from '@/lib/services/auth.service';

/* ── POST /api/auth/login ── */
export async function POST(req) {
  // Parse JSON body (bad JSON → {})
  let body = {};
  try { body = await req.json(); } catch { body = {}; }

  try {
    const { email, password } = body;

    if (!email || !password) {
      return new NextResponse(JSON.stringify({ message: 'Email and password required' }), { status: 400, headers: { 'content-type': 'application/json; charset=utf-8' } });
    }

    const user = await authService.verifyUserCredentials(email, password);
    if (!user) {
      return new NextResponse(JSON.stringify({ message: 'Invalid email or password' }), { status: 401, headers: { 'content-type': 'application/json; charset=utf-8' } });
    }

    const token = jwt.sign(
      { id: user.id },
      process.env.JWT_SECRET,
      { expiresIn: '1d' }
    );

    // Save the JWT as an httpOnly cookie so protected API routes can read it.
    let cookie = `token=${encodeURIComponent(token)}; Max-Age=86400; Path=/; HttpOnly`;
    if (process.env.NODE_ENV === 'production') cookie += '; Secure';
    cookie += '; SameSite=lax';

    return new NextResponse(JSON.stringify({ token }), { status: 200, headers: { 'content-type': 'application/json; charset=utf-8', 'set-cookie': cookie } });
  } catch (err) {
    console.error('LOGIN ERROR:', err);
    return new NextResponse(JSON.stringify({ message: 'Login failed' }), { status: 500, headers: { 'content-type': 'application/json; charset=utf-8' } });
  }
}
