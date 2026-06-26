// app/api/redirects/[id]/route.js
// Native Next.js App Router handlers.
// Business logic stays in redirect.service. (Original route exposed PUT + DELETE.)

import { NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import * as redirectService from '@/lib/services/redirect.service';
import { parseBody } from '@/lib/utils/request';

// Slug normalizer.
const normalizeSlug = (s = "") => "/" + String(s || "").trim().replace(/^\/+|\/+$/g, "");

/* ── PUT /api/redirects/:id ── */
export async function PUT(req, ctx) {
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

  // Orchestrate (was updateRedirect)
  try {
    const { id } = (await ctx.params) || {};
    const raw = parseBody({ body });
    const data = {};
    if (raw.oldSlug !== undefined)  data.oldSlug  = normalizeSlug(raw.oldSlug);
    if (raw.newSlug !== undefined)  data.newSlug  = normalizeSlug(raw.newSlug);
    if (raw.pageType !== undefined) data.pageType = raw.pageType?.trim() || null;

    const redirect = await redirectService.updateRedirect(id, data);
    return new NextResponse(JSON.stringify({ success: true, message: "Redirect updated", data: redirect }), { status: 200, headers: { 'content-type': 'application/json; charset=utf-8' } });
  } catch (err) {
    if (err.code === "P2025") return new NextResponse(JSON.stringify({ success: false, message: "Redirect not found" }), { status: 404, headers: { 'content-type': 'application/json; charset=utf-8' } });
    console.error("❌ updateRedirect:", err.message);
    return new NextResponse(JSON.stringify({ success: false, message: "Failed to update redirect" }), { status: 500, headers: { 'content-type': 'application/json; charset=utf-8' } });
  }
}

/* ── DELETE /api/redirects/:id ── */
export async function DELETE(req, ctx) {
  // Auth — original DELETE chain had no body parsing
  const token = req.cookies.get('token')?.value;
  if (!token) return new NextResponse(JSON.stringify({ message: 'Unauthorized' }), { status: 401, headers: { 'content-type': 'application/json; charset=utf-8' } });
  try { jwt.verify(token, process.env.JWT_SECRET); } catch { return new NextResponse(JSON.stringify({ message: 'Invalid token' }), { status: 401, headers: { 'content-type': 'application/json; charset=utf-8' } }); }

  try {
    const { id } = (await ctx.params) || {};
    await redirectService.deleteRedirect(id);
    return new NextResponse(JSON.stringify({ success: true, message: "Redirect deleted" }), { status: 200, headers: { 'content-type': 'application/json; charset=utf-8' } });
  } catch (err) {
    if (err.code === "P2025") return new NextResponse(JSON.stringify({ success: false, message: "Redirect not found" }), { status: 404, headers: { 'content-type': 'application/json; charset=utf-8' } });
    return new NextResponse(JSON.stringify({ success: false, message: "Failed to delete redirect" }), { status: 500, headers: { 'content-type': 'application/json; charset=utf-8' } });
  }
}
