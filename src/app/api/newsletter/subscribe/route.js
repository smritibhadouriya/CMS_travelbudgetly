// app/api/newsletter/subscribe/route.js
// Native Next.js App Router handler (Phase-4 / Newsletter API). Public.
// Business logic stays in newsletter.service.

import { NextResponse } from 'next/server';
import * as newsletterService from '@/lib/services/newsletter.service';

/* ── POST /api/newsletter/subscribe ── */
export async function POST(req) {
  // Parse JSON body (bad JSON → {})
  let body = {};
  try { body = await req.json(); } catch { body = {}; }

  try {
    const { email } = body;
    if (!email || !email.includes('@')) {
      return new NextResponse(JSON.stringify({ success: false, message: 'Valid email is required' }), { status: 400, headers: { 'content-type': 'application/json; charset=utf-8' } });
    }

    const normalizedEmail = email.toLowerCase().trim();

    // Already subscribed and active (active = not unsubscribed)
    const existing = await newsletterService.findSubscriberByEmail(normalizedEmail);
    if (existing) {
      if (existing.unsubscribedAt === null) {
        return new NextResponse(JSON.stringify({ success: false, message: 'Email already subscribed' }), { status: 409, headers: { 'content-type': 'application/json; charset=utf-8' } });
      }
      // Re-subscribe if previously unsubscribed
      await newsletterService.reactivateSubscriber(normalizedEmail);
      return new NextResponse(JSON.stringify({ success: true, message: 'Re-subscribed successfully' }), { status: 200, headers: { 'content-type': 'application/json; charset=utf-8' } });
    }

    const subscriber = await newsletterService.createSubscriber({ email: normalizedEmail });
    return new NextResponse(JSON.stringify({ success: true, message: 'Subscribed successfully', data: { id: subscriber.id, email: subscriber.email } }), { status: 201, headers: { 'content-type': 'application/json; charset=utf-8' } });
  } catch (err) {
    if (err.code === "P2002") {
      return new NextResponse(JSON.stringify({ success: false, message: 'Email already subscribed' }), { status: 409, headers: { 'content-type': 'application/json; charset=utf-8' } });
    }
    console.error('Newsletter subscribe error:', err);
    return new NextResponse(JSON.stringify({ success: false, message: 'Server error' }), { status: 500, headers: { 'content-type': 'application/json; charset=utf-8' } });
  }
}
