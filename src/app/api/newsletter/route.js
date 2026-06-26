// app/api/newsletter/route.js
// Native Next.js App Router handler (Phase-4 / Newsletter API).
// Business logic stays in newsletter.service.

import { NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import * as newsletterService from '@/lib/services/newsletter.service';

/* ── GET /api/newsletter ── (admin paginated listing) */
export async function GET(req) {
  // Auth
  const token = req.cookies.get('token')?.value;
  if (!token) {
    return new NextResponse(JSON.stringify({ message: 'Unauthorized' }), { status: 401, headers: { 'content-type': 'application/json; charset=utf-8' } });
  }
  try {
    jwt.verify(token, process.env.JWT_SECRET);
  } catch {
    return new NextResponse(JSON.stringify({ message: 'Invalid token' }), { status: 401, headers: { 'content-type': 'application/json; charset=utf-8' } });
  }

  try {
    const sp = req.nextUrl.searchParams;
    const page   = sp.get('page')  ?? 1;
    const limit  = sp.get('limit') ?? 20;
    const status = sp.get('status');

    const data = await newsletterService.getSubscribersPage({ page, limit, status });

    return new NextResponse(JSON.stringify({ success: true, data }), { status: 200, headers: { 'content-type': 'application/json; charset=utf-8' } });
  } catch (err) {
    console.error('Newsletter getAll error:', err);
    return new NextResponse(JSON.stringify({ success: false, message: 'Server error' }), { status: 500, headers: { 'content-type': 'application/json; charset=utf-8' } });
  }
}
