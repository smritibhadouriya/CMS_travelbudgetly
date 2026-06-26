// app/api/packages/[slug]/route.js
//
// Native Next.js App Router handlers for a single Package (Phase-4 / P3.12).
//
//   Route → parse/auth → upload conversion → service → Prisma
//
// The single dynamic segment is `slug`; getPackage reads it as a slug, while
// update/delete read it as an id — both map to the
// same value, so this route uses the one segment value for both. All business
// logic stays in package.service; sharp conversion in upload.service.

import { NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import * as packageService from '@/lib/services/package.service';
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

/* ── GET /api/packages/:slug ── */
export async function GET(req, ctx) {
  const { slug } = (await ctx.params) || {};
  try {
    const pkg = await packageService.findPackageBySlug(slug);
    if (!pkg) return json({ success: false, message: "Package not found" }, 404);
    return json({ success: true, data: pkg });
  } catch (err) {
    console.error("❌ getPackage:", err.message);
    return json({ success: false, message: "Failed to fetch package" }, 500);
  }
}

/* ── PUT /api/packages/:slug  (segment used as id) ── */
export async function PUT(req, ctx) {
  const { slug } = (await ctx.params) || {};
  const id = slug;

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

  // 4. Orchestrate (was updatePackage) — business logic stays in the service
  try {
    const raw     = parseBody({ body });
    const payload = packageService.buildPackagePayload(raw, files);
    const pkg = await packageService.updatePackage(id, payload);
    return json({ success: true, message: "Package updated successfully", data: pkg });
  } catch (err) {
    if (err.code === "P2025") return json({ success: false, message: "Package not found" }, 404);
    if (err.code === "P2002") return json({ success: false, message: "Slug already taken by another package." }, 400);
    console.error("❌ updatePackage:", err.message);
    return json({ success: false, message: "Failed to update package" }, 500);
  }
}

/* ── DELETE /api/packages/:slug  (segment used as id) ── */
export async function DELETE(req, ctx) {
  const { slug } = (await ctx.params) || {};
  const id = slug;

  // Auth
  const token = req.cookies.get('token')?.value;
  if (!token) return json({ message: 'Unauthorized' }, 401);
  try {
    jwt.verify(token, process.env.JWT_SECRET);
  } catch {
    return json({ message: 'Invalid token' }, 401);
  }

  try {
    await packageService.deletePackage(id);
    return json({ success: true, message: "Package deleted successfully" });
  } catch (err) {
    if (err.code === "P2025") return json({ success: false, message: "Package not found" }, 404);
    console.error("❌ deletePackage:", err.message);
    return json({ success: false, message: "Failed to delete package" }, 500);
  }
}
