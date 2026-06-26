// app/api/redirects/route.js
// Native Next.js App Router handlers.
// Business logic stays in redirect.service.

import { NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import * as redirectService from '@/lib/services/redirect.service';
import { parseBody } from '@/lib/utils/request';

// Slug normalizer.
const normalizeSlug = (s = "") => "/" + String(s || "").trim().replace(/^\/+|\/+$/g, "");

/* ── GET /api/redirects ── */
export async function GET() {
  try {
    const redirects = await redirectService.findAllRedirects();
    return new NextResponse(JSON.stringify({ success: true, data: redirects }), { status: 200, headers: { 'content-type': 'application/json; charset=utf-8' } });
  } catch (err) {
    console.error("❌ getRedirects:", err.message);
    return new NextResponse(JSON.stringify({ success: false, message: "Failed to fetch redirects" }), { status: 500, headers: { 'content-type': 'application/json; charset=utf-8' } });
  }
}

/* ── POST /api/redirects ── */
export async function POST(req) {
  // Parse request
  const ct = (req.headers.get('content-type') || '').toLowerCase();
  let body = {};
  try {
    if (ct.includes('application/json')) {
      try { body = await req.json(); } catch { body = {}; }
    } else if (ct.includes('multipart/form-data')) {
      const form = await req.formData();
      for (const [key, value] of form.entries()) {
        if (value && typeof value === 'object' && typeof value.arrayBuffer === 'function' && 'name' in value) {
          // ignored — redirects take no files
        } else {
          body[key] = value;
        }
      }
    } else if (ct.includes('application/x-www-form-urlencoded')) {
      try { const form = await req.formData(); for (const [k, v] of form.entries()) body[k] = v; } catch { body = {}; }
    } else {
      try { const text = await req.text(); body = text ? { _raw: text } : {}; } catch { body = {}; }
    }
  } catch (e) {
    return Response.json({ success: false, message: 'Bad request', error: String(e?.message || e) }, { status: 400 });
  }

  // Auth
  const token = req.cookies.get('token')?.value;
  if (!token) return new NextResponse(JSON.stringify({ message: 'Unauthorized' }), { status: 401, headers: { 'content-type': 'application/json; charset=utf-8' } });
  try { jwt.verify(token, process.env.JWT_SECRET); } catch { return new NextResponse(JSON.stringify({ message: 'Invalid token' }), { status: 401, headers: { 'content-type': 'application/json; charset=utf-8' } }); }

  // Orchestrate (was createRedirect)
  try {
    const raw = parseBody({ body });
    const oldSlug = normalizeSlug(raw.oldSlug);
    const newSlug = normalizeSlug(raw.newSlug);
    if (!raw.oldSlug || !raw.newSlug) {
      return new NextResponse(JSON.stringify({ success: false, message: "oldSlug and newSlug are required" }), { status: 400, headers: { 'content-type': 'application/json; charset=utf-8' } });
    }

    const redirect = await redirectService.createRedirect({ oldSlug, newSlug, pageType: raw.pageType?.trim() || null });
    return new NextResponse(JSON.stringify({ success: true, message: "Redirect created", data: redirect }), { status: 201, headers: { 'content-type': 'application/json; charset=utf-8' } });
  } catch (err) {
    console.error("❌ createRedirect:", err.message);
    return new NextResponse(JSON.stringify({ success: false, message: "Failed to create redirect" }), { status: 500, headers: { 'content-type': 'application/json; charset=utf-8' } });
  }
}
