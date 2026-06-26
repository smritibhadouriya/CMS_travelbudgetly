// app/api/authors/[id]/route.js
//
// Native Next.js App Router handlers for a single Author (Phase-4 / P3.13).
//
//   Route → parse/auth → upload conversion → service → Prisma
//
// All business logic stays in author.service (parseJSON / resolveAuthorImageUpdate
// / uniqueAuthorSlug / findDuplicateEmail / findAuthorById / updateAuthor /
// deleteAuthor); sharp conversion in upload.service.

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

/* ── GET /api/authors/:id ── */
export async function GET(req, ctx) {
  const { id } = (await ctx.params) || {};
  try {
    const author = await authorService.findAuthorById(id);
    if (!author) {
      return json({ success: false, message: "Author not found" }, 404);
    }
    return json({ success: true, author });
  } catch (err) {
    console.error("Get author error:", err);
    return json({ success: false, message: err.message }, 500);
  }
}

/* ── PUT /api/authors/:id ── */
export async function PUT(req, ctx) {
  const { id } = (await ctx.params) || {};

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

  // 4. Orchestrate (was updateAuthor) — reads req.body directly (no parseBody)
  try {
    const author = await authorService.findAuthorById(id);
    if (!author) {
      return json({ success: false, message: "Author not found" }, 404);
    }

    const imageData = body.imageData ? authorService.parseJSON(body.imageData) : null;

    const parsedSocialLinks = body.socialLinks
      ? authorService.parseJSON(body.socialLinks)
      : author.socialLinks;

    const incomingEmail = body.email?.trim() || null;
    if (incomingEmail && incomingEmail.toLowerCase() !== author.email) {
      const dup = await authorService.findDuplicateEmail(incomingEmail.toLowerCase(), author.id);
      if (dup) {
        return json({ success: false, message: "Email already in use" }, 409);
      }
    }

    let slug = author.slug;
    if (body.name?.trim()) {
      slug = await authorService.uniqueAuthorSlug(body.name.trim(), author.id);
    }

    const updates = {
      name:        body.name?.trim()  || author.name,
      slug,
      bio:         body.bio         !== undefined ? body.bio         : author.bio,
      designation: body.designation !== undefined ? body.designation : author.designation,
      isActive:    body.isActive    !== undefined
                     ? body.isActive === "true" || body.isActive === true
                     : author.isActive,
      socialLinks: parsedSocialLinks,
    };

    if (body.email !== undefined) {
      updates.email = incomingEmail ? incomingEmail.toLowerCase() : null;
    }

    if (imageData) {
      updates.image = authorService.resolveAuthorImageUpdate(imageData, imageFile, author.image?.src || "");
    }

    const updated = await authorService.updateAuthor(author.id, updates);

    return json({ success: true, author: updated });
  } catch (err) {
    console.error("Update author error:", err);
    if (err.code === "P2002") {
      return json({ success: false, message: "Email already in use" }, 409);
    }
    return json({ success: false, message: err.message }, 500);
  }
}

/* ── DELETE /api/authors/:id ── */
export async function DELETE(req, ctx) {
  const { id } = (await ctx.params) || {};

  // Auth
  const token = req.cookies.get('token')?.value;
  if (!token) return json({ message: 'Unauthorized' }, 401);
  try {
    jwt.verify(token, process.env.JWT_SECRET);
  } catch {
    return json({ message: 'Invalid token' }, 401);
  }

  try {
    await authorService.deleteAuthor(id);
    return json({ success: true, message: "Author deleted" });
  } catch (err) {
    if (err.code === "P2025") {
      return json({ success: false, message: "Author not found" }, 404);
    }
    console.error("Delete author error:", err);
    return json({ success: false, message: err.message }, 500);
  }
}
