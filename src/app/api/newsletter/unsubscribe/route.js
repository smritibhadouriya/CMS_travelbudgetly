// app/api/newsletter/unsubscribe/route.js
// Native Next.js App Router handler (Phase-4 / Newsletter API). Public.
// Business logic stays in newsletter.service.

import { NextResponse } from 'next/server';
import * as newsletterService from '@/lib/services/newsletter.service';

/* ── POST /api/newsletter/unsubscribe ── */
export async function POST(req) {
  // Parse JSON body (bad JSON → {})
  let body = {};
  try { body = await req.json(); } catch { body = {}; }

  try {
    const { email } = body;
    if (!email) {
      return new NextResponse(JSON.stringify({ success: false, message: 'Email is required' }), { status: 400, headers: { 'content-type': 'application/json; charset=utf-8' } });
    }

    const normalizedEmail = email.toLowerCase().trim();
    const subscriber = await newsletterService.findSubscriberByEmail(normalizedEmail);
    if (!subscriber) {
      return new NextResponse(JSON.stringify({ success: false, message: 'Email not found' }), { status: 404, headers: { 'content-type': 'application/json; charset=utf-8' } });
    }

    await newsletterService.deactivateSubscriber(normalizedEmail);

    return new NextResponse(JSON.stringify({ success: true, message: 'Unsubscribed successfully' }), { status: 200, headers: { 'content-type': 'application/json; charset=utf-8' } });
  } catch (err) {
    console.error('Newsletter unsubscribe error:', err);
    return new NextResponse(JSON.stringify({ success: false, message: 'Server error' }), { status: 500, headers: { 'content-type': 'application/json; charset=utf-8' } });
  }
}
