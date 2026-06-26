// app/api/newsletter/[id]/route.js
// Native Next.js App Router handler (Phase-4 / Newsletter API).
// Business logic stays in newsletter.service.

import { NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import * as newsletterService from '@/lib/services/newsletter.service';

/* ── DELETE /api/newsletter/:id ── */
export async function DELETE(req, ctx) {
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
    const { id } = (await ctx.params) || {};
    await newsletterService.deleteSubscriber(id);
    return new NextResponse(JSON.stringify({ success: true, message: 'Deleted successfully' }), { status: 200, headers: { 'content-type': 'application/json; charset=utf-8' } });
  } catch (err) {
    if (err.code === "P2025") {
      return new NextResponse(JSON.stringify({ success: false, message: 'Subscriber not found' }), { status: 404, headers: { 'content-type': 'application/json; charset=utf-8' } });
    }
    console.error('Newsletter delete error:', err);
    return new NextResponse(JSON.stringify({ success: false, message: 'Server error' }), { status: 500, headers: { 'content-type': 'application/json; charset=utf-8' } });
  }
}
