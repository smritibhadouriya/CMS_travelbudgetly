// app/api/pages/home/route.js
// Native Next.js App Router handlers.
// Business logic stays in home.service (buildHomePayload / getHome / upsertHome).

import { NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import * as homeService from '@/lib/services/home.service';
import { processImageToWebP } from '@/lib/services/upload.service';
import { parseBody } from '@/lib/utils/request';

/* ── GET /api/pages/home ── */
export async function GET() {
  try {
    const page = await homeService.getHome("home");
    return new NextResponse(JSON.stringify({ success: true, data: page || { slug: "home" } }), { status: 200, headers: { 'content-type': 'application/json; charset=utf-8' } });
  } catch (err) {
    console.error("❌ getHomePage:", err.message);
    return new NextResponse(JSON.stringify({ success: false, message: "Failed to load Home page" }), { status: 500, headers: { 'content-type': 'application/json; charset=utf-8' } });
  }
}

/* ── POST /api/pages/home ── */
export async function POST(req) {
  // Parse request
  const ct = (req.headers.get('content-type') || '').toLowerCase();
  let body = {};
  const files = [];
  try {
    if (ct.includes('application/json')) {
      try { body = await req.json(); } catch { body = {}; }
    } else if (ct.includes('multipart/form-data')) {
      const form = await req.formData();
      for (const [key, value] of form.entries()) {
        if (value && typeof value === 'object' && typeof value.arrayBuffer === 'function' && 'name' in value) {
          const buffer = Buffer.from(await value.arrayBuffer());
          files.push({ fieldname: key, originalname: value.name, mimetype: value.type, size: buffer.length, buffer });
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

  // Convert uploaded images → WebP
  try {
    for (const file of files) {
      const r = await processImageToWebP(file.buffer);
      file.path = r.path; file.filename = r.filename; file.mimetype = r.mimetype; file.size = r.size;
    }
  } catch (err) {
    console.error('❌ Multiple files conversion error:', err);
    const mwErr = new Error('Image processing failed for one or more files');
    console.error('Route middleware error:', mwErr);
    return Response.json({ success: false, message: mwErr.message || 'Server error' }, { status: 500 });
  }

  // Orchestrate (was saveHomePage)
  try {
    const raw     = parseBody({ body });
    const payload = homeService.buildHomePayload(raw, files);

    const updated = await homeService.upsertHome("home", payload);

    return new NextResponse(JSON.stringify({ success: true, message: "Home page saved", data: updated }), { status: 200, headers: { 'content-type': 'application/json; charset=utf-8' } });
  } catch (err) {
    console.error("❌ saveHomePage:", err.message);
    return new NextResponse(JSON.stringify({ success: false, message: "Failed to save Home page" }), { status: 500, headers: { 'content-type': 'application/json; charset=utf-8' } });
  }
}
