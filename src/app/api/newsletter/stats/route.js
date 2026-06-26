// app/api/newsletter/stats/route.js
// Native Next.js App Router handler (Phase-4 / Newsletter API). Public.
// Business logic stays in newsletter.service.

import { NextResponse } from 'next/server';
import * as newsletterService from '@/lib/services/newsletter.service';

/* ── GET /api/newsletter/stats ── */
export async function GET() {
  try {
    const data = await newsletterService.getSubscriberStats();
    return new NextResponse(JSON.stringify({ success: true, data }), { status: 200, headers: { 'content-type': 'application/json; charset=utf-8' } });
  } catch (err) {
    console.error('Newsletter stats error:', err);
    return new NextResponse(JSON.stringify({ success: false, message: 'Server error' }), { status: 500, headers: { 'content-type': 'application/json; charset=utf-8' } });
  }
}
