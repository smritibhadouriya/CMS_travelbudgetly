// app/api/pages/about/route.js
//
// Native Next.js App Router handlers for the About page (Phase-4 pilot).
//
//   Route → parse/auth → service → Prisma
//
// All business logic stays in services (buildAboutPayload / upsertAbout in
// about.service; sharp conversion in upload.service). The handler only parses
// the request, enforces auth, wires the services, and shapes the response —

import { NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import * as aboutService from '@/lib/services/about.service';
import { processImageToWebP } from '@/lib/services/upload.service';
import { parseBody } from '@/lib/utils/request';

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

/* ── GET /api/pages/about ── */
export async function GET() {
  try {
    const page = await aboutService.getAbout("about");
    return json({ success: true, data: page || { slug: "about" } });
  } catch (err) {
    console.error("❌ getAboutPage:", err.message);
    return json({ success: false, message: "Failed to load About page" }, 500);
  }
}

/* ── POST /api/pages/about ── */
export async function POST(req) {
  // 1. Parse request
  let body, files;
  try {
    ({ body, files } = await parseRequest(req));
  } catch (e) {
    return json({ success: false, message: 'Bad request', error: String(e?.message || e) }, 400);
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
    return json({ success: false, message: 'Image processing failed for one or more files' }, 500);
  }

  // 4. Orchestrate (was saveAboutPage) — business logic stays in the service
  try {
    const raw     = parseBody({ body });
    const payload = aboutService.buildAboutPayload(raw, files);
    const updated = await aboutService.upsertAbout("about", payload);

    return json({ success: true, message: "About page saved", data: updated });
  } catch (err) {
    console.error("❌ saveAboutPage:", err.message);
    return json({ success: false, message: "Failed to save About page" }, 500);
  }
}
