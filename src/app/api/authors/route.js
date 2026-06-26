// app/api/authors/route.js
//
// Native Next.js App Router handlers for Authors list/create (Phase-4 / P3.13).
//
//   Route → parse/auth → upload conversion → service → Prisma
//
// All business logic stays in author.service (parseJSON / buildAuthorImage /
// uniqueAuthorSlug / findAuthorByEmail / createAuthor / findAuthors); sharp
// conversion in upload.service.

import { NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import * as authorService from '@/lib/services/author.service';
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

// Convert the uploaded 'imageFile' to WebP (single file).
async function convertSingle(files) {
  const imageFile = files.find((f) => f.fieldname === 'imageFile');
  if (imageFile) {
    const r = await processImageToWebP(imageFile.buffer);
    imageFile.path = r.path;
    imageFile.filename = r.filename;
    imageFile.mimetype = r.mimetype;
    imageFile.size = r.size;
  }
  return imageFile;
}

/* ── GET /api/authors ── */
export async function GET(req) {
  try {
    const where = {};
    if (req.nextUrl.searchParams.get('active') === "true") where.isActive = true;

    const authors = await authorService.findAuthors(where);
    return json({ success: true, authors });
  } catch (err) {
    console.error("Get authors error:", err);
    return json({ success: false, message: err.message }, 500);
  }
}

/* ── POST /api/authors ── */
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

  // 3. Convert the uploaded 'imageFile' to WebP (single file)
  let imageFile;
  try {
    imageFile = await convertSingle(files);
  } catch (err) {
    console.error('❌ Single file conversion error:', err);
    const mwErr = new Error('Image processing failed: ' + err.message);
    console.error('Route middleware error:', mwErr);
    return Response.json({ success: false, message: mwErr.message || 'Server error' }, { status: 500 });
  }

  // 4. Orchestrate (was createAuthor) — reads req.body directly (no parseBody)
  try {
    const { name, bio, designation } = body;

    if (!name?.trim()) {
      return json({ success: false, message: "Name is required" }, 400);
    }

    const email = body.email?.trim() || null;
    if (email) {
      const exists = await authorService.findAuthorByEmail(email.toLowerCase());
      if (exists) {
        return json({ success: false, message: "Author with this email already exists" }, 409);
      }
    }

    const imageData = authorService.parseJSON(body.imageData);
    const image = authorService.buildAuthorImage(imageData, imageFile);

    const author = await authorService.createAuthor({
      name:        name.trim(),
      slug:        await authorService.uniqueAuthorSlug(name.trim()),
      email:       email ? email.toLowerCase() : null,
      bio:         bio?.trim()         || "",
      designation: designation?.trim() || "",
      image,
      socialLinks: authorService.parseJSON(body.socialLinks) || {},
    });

    return json({ success: true, author }, 201);
  } catch (err) {
    console.error("Create author error:", err);
    if (err.code === "P2002") {
      return json({ success: false, message: "Email already in use" }, 409);
    }
    return json({ success: false, message: err.message }, 500);
  }
}
