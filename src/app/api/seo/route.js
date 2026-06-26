// app/api/seo/route.js
//
// Native Next.js App Router handlers for page-level SEO (Phase-4 / SEO API).
//
//   Route → parse/auth → upload conversion → service → response
//
// All business logic stays in seo.service (getSeoForPage / buildSeoPayload /
// saveSeoForPage / calcSeoScore); sharp conversion in upload.service.

import { NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import * as seoService from '@/lib/services/seo.service';
import { processImageToWebP } from '@/lib/services/upload.service';

// JSON response body (content-type: application/json; charset=utf-8).
const json = (data, status = 200) =>
  new NextResponse(JSON.stringify(data), {
    status,
    headers: { 'content-type': 'application/json; charset=utf-8' },
  });

// Parse the multipart request into body + files.
function isFileLike(v) {
  return v && typeof v === 'object' && typeof v.arrayBuffer === 'function' && 'name' in v;
}

async function parseRequest(req) {
  const ct = (req.headers.get('content-type') || '').toLowerCase();
  let body = {};
  const files = [];

  if (ct.includes('application/json')) {
    try { body = await req.json(); } catch { body = {}; }
  } else if (ct.includes('multipart/form-data')) {
    const form = await req.formData();
    for (const [key, value] of form.entries()) {
      if (isFileLike(value)) {
        const buffer = Buffer.from(await value.arrayBuffer());
        files.push({ fieldname: key, originalname: value.name, mimetype: value.type, size: buffer.length, buffer });
      } else {
        body[key] = value;
      }
    }
  } else if (ct.includes('application/x-www-form-urlencoded')) {
    try {
      const form = await req.formData();
      for (const [k, v] of form.entries()) body[k] = v;
    } catch { body = {}; }
  } else {
    try {
      const text = await req.text();
      body = text ? { _raw: text } : {};
    } catch { body = {}; }
  }

  return { body, files };
}

/* ── GET /api/seo?page=home ── */
export async function GET(req) {
  try {
    const page = req.nextUrl.searchParams.get('page');
    if (!page) return json({ success: false, message: "page param required" }, 400);

    const { found, seo } = await seoService.getSeoForPage(page);
    if (!found) return json({ success: false, message: "Page not found" }, 404);

    return json({ success: true, data: seo });
  } catch (err) {
    return json({ success: false, message: "Failed to load SEO" }, 500);
  }
}

/* ── PUT /api/seo?page=home ── */
export async function PUT(req) {
  // 1. Parse request
  let body, files;
  try {
    ({ body, files } = await parseRequest(req));
  } catch (e) {
    return Response.json({ success: false, message: 'Bad request', error: String(e?.message || e) }, { status: 400 });
  }

  // 2. Auth
  const token = req.cookies.get('token')?.value;
  if (!token) return json({ message: 'Unauthorized' }, 401);
  try {
    jwt.verify(token, process.env.JWT_SECRET);
  } catch {
    return json({ message: 'Invalid token' }, 401);
  }

  // 3. Convert uploaded images → WebP
  try {
    for (const file of files) {
      const r = await processImageToWebP(file.buffer);
      file.path = r.path;
      file.filename = r.filename;
      file.mimetype = r.mimetype;
      file.size = r.size;
    }
  } catch (err) {
    console.error('❌ Multiple files conversion error:', err);
    const mwErr = new Error('Image processing failed for one or more files');
    console.error('Route middleware error:', mwErr);
    return Response.json({ success: false, message: mwErr.message || 'Server error' }, { status: 500 });
  }

  // 4. Orchestrate (was saveSeoByPage) — business logic stays in the service
  try {
    const page = req.nextUrl.searchParams.get('page');
    if (!page) return json({ success: false, message: "page param required" }, 400);

    let raw = {};
    if (body?.data) {
      try { raw = JSON.parse(body.data); } catch (_) { raw = body; }
    } else {
      raw = body || {};
    }

    const seoPayload = seoService.buildSeoPayload(raw, files);

    const { found } = await seoService.saveSeoForPage(page, seoPayload);
    if (!found) return json({ success: false, message: "Page not found" }, 404);

    return json({ success: true, seo: seoPayload, score: seoService.calcSeoScore(seoPayload) });
  } catch (err) {
    console.error("❌ saveSeoByPage:", err.message);
    return json({ success: false, message: "Failed to save SEO" }, 500);
  }
}
