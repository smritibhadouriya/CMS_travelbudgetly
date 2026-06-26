// app/api/packages/route.js
//
// Native Next.js App Router handlers for Packages list/create (Phase-4 / P3.12).
//
//   Route → parse/auth → upload conversion → service → Prisma
//
// All business logic stays in package.service (buildPackagePayload / listPackages
// / countPackages / createPackage); sharp conversion in upload.service.

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

/* ── GET /api/packages ── (filters, search, pagination) */
export async function GET(req) {
  try {
    const sp = req.nextUrl.searchParams;
    const tourCategory   = sp.get('tourCategory');
    const packageType    = sp.get('packageType');
    const location       = sp.get('location');
    const difficulty     = sp.get('difficulty');
    const isFeatured     = sp.get('isFeatured');
    const isPublished    = sp.get('isPublished');
    const isSpecialOffer = sp.get('isSpecialOffer');
    const isSpritual     = sp.get('isSpritual');
    const page  = sp.get('page')  ?? 1;
    const limit = sp.get('limit') ?? 100;
    const search = sp.get('search');

    const where = {};
    if (tourCategory) where.tourCategory = tourCategory;
    if (packageType)  where.packageType  = packageType;
    if (location)     where.location     = location;
    if (difficulty)   where.difficulty   = difficulty;
    if (isFeatured     !== null) where.isFeatured     = isFeatured     === "true";
    if (isPublished    !== null) where.isPublished    = isPublished    === "true";
    if (isSpecialOffer !== null) where.isSpecialOffer = isSpecialOffer === "true";
    if (isSpritual     !== null) where.isSpritual     = isSpritual     === "true";
    if (search) where.OR = [
      { title:        { contains: search, mode: "insensitive" } },
      { location:     { contains: search, mode: "insensitive" } },
      { tourCategory: { contains: search, mode: "insensitive" } },
    ];

    const [total, packages] = await Promise.all([
      packageService.countPackages(where),
      packageService.listPackages({
        where,
        skip: (+page - 1) * +limit,
        take: +limit,
      }),
    ]);

    return json({ success: true, data: packages, total, page: +page, pages: Math.ceil(total / +limit) });
  } catch (err) {
    console.error("❌ getPackages:", err.message);
    return json({ success: false, message: "Failed to fetch packages" }, 500);
  }
}

/* ── POST /api/packages ── */
export async function POST(req) {
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

  // 4. Orchestrate (was createPackage) — business logic stays in the service
  try {
    const raw     = parseBody({ body });
    const payload = packageService.buildPackagePayload(raw, files);
    if (!payload.title) return json({ success: false, message: "Title is required" }, 400);

    const pkg = await packageService.createPackage(payload);
    return json({ success: true, message: "Package created successfully", data: pkg }, 201);
  } catch (err) {
    if (err.code === "P2002") {
      return json({ success: false, message: "A package with this slug already exists." }, 400);
    }
    // Original: console.error("❌ createPackage:", err); return next(err)
    console.error("❌ createPackage:", err);
    console.error('Route middleware error:', err);
    return Response.json({ success: false, message: err.message || 'Server error' }, { status: 500 });
  }
}
