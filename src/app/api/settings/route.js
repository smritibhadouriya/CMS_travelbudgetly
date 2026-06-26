// app/api/settings/route.js
// Native Next.js App Router handlers.
// Business logic stays in settings.service.

import { NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import * as settingsService from '@/lib/services/settings.service';
import { processImageToWebP } from '@/lib/services/upload.service';
import { parseBody } from '@/lib/utils/request';
import { fileUrl } from '@/lib/utils/url';

/* ── GET /api/settings ── */
export async function GET() {
  try {
    const settings = await settingsService.getSettings();
    return new NextResponse(JSON.stringify({ success: true, data: settings || {} }), { status: 200, headers: { 'content-type': 'application/json; charset=utf-8' } });
  } catch (err) {
    console.error("❌ getSettings:", err.message);
    return new NextResponse(JSON.stringify({ success: false, message: "Failed to load settings" }), { status: 500, headers: { 'content-type': 'application/json; charset=utf-8' } });
  }
}

/* ── POST /api/settings ── */
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

  // Orchestrate (was saveSettings)
  try {
    const raw = parseBody({ body });

    const payload = {
      slug:        "global",
      siteName:    raw.siteName?.trim()    || "TravelBudgetly",
      siteUrl:     raw.siteUrl?.trim()     || "https://www.TravelBudgetly.com",
      defaultMeta: raw.defaultMeta?.trim() || "",

      social: {
        twitter:   raw.social?.twitter?.trim()   || "",
        instagram: raw.social?.instagram?.trim() || "",
        linkedin:  raw.social?.linkedin?.trim()  || "",
        youtube:   raw.social?.youtube?.trim()   || "",
        facebook:  raw.social?.facebook?.trim()  || "",
      },

      robotsExtra:      raw.robotsExtra?.trim() || "",
      sitemapExtraUrls: Array.isArray(raw.sitemapExtraUrls)
        ? raw.sitemapExtraUrls.filter(Boolean)
        : [],

      googleAnalyticsId:  raw.googleAnalyticsId?.trim()  || "",
      googleTagManagerId: raw.googleTagManagerId?.trim() || "",

      logoUrl:    (raw.logoUrl    || "").trim(),
      faviconUrl: (raw.faviconUrl || "").trim(),
    };

    /* Logo / favicon file uploads (override the text URL if a file is sent) */
    (files || []).forEach(file => {
      const src = fileUrl(file.path || "");
      if (file.fieldname === "logoFile")    payload.logoUrl    = src;
      if (file.fieldname === "faviconFile") payload.faviconUrl = src;
    });

    const updated = await settingsService.upsertSettings(payload);
    return new NextResponse(JSON.stringify({ success: true, message: "Settings saved", data: updated }), { status: 200, headers: { 'content-type': 'application/json; charset=utf-8' } });
  } catch (err) {
    console.error("❌ saveSettings:", err.message);
    return new NextResponse(JSON.stringify({ success: false, message: "Failed to save settings" }), { status: 500, headers: { 'content-type': 'application/json; charset=utf-8' } });
  }
}
