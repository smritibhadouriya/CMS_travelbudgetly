// app/api/blogs/[id]/route.js
//
// Native Next.js App Router handlers for a single Blog (Phase-4 / P3.10).
//
//   Route → parse/auth → service → Prisma
//
// All business logic stays in blog.service (buildBlogPayload / uniqueSlug /
// buildSeo / findBlogById / findBlogByIdRaw / updateBlog / deleteBlog); sharp
// conversion in upload.service. The handler only parses the request, enforces
// auth, wires the services, and shapes the response — byte-identically to the original behavior.

import { NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import * as blogService from '@/lib/services/blog.service';
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

/* ── GET /api/blogs/:id ── */
export async function GET(req, ctx) {
  try {
    const { id } = (await ctx.params) || {};
    const doc = await blogService.findBlogById(id);
    if (!doc) return json({ success: false, message: "Not found" }, 404);
    return json({ success: true, data: doc });
  } catch (e) {
    return json({ success: false, message: e.message }, 500);
  }
}

/* ── PUT /api/blogs/:id ── */
export async function PUT(req, ctx) {
  const { id } = (await ctx.params) || {};

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

  // 4. Orchestrate (was updateBlog) — business logic stays in the service
  try {
    const raw     = parseBody({ body });
    const payload = blogService.buildBlogPayload(raw, files);

    if (payload.title) payload.slug = await blogService.uniqueSlug(payload.title, id);

    const existing = await blogService.findBlogByIdRaw(id);
    if (!existing) return json({ success: false, message: "Blog not found" }, 404);

    payload.seo = blogService.buildSeo(
      payload._rawSeo,
      payload.title        || existing?.title        || "",
      payload.content      || existing?.content      || "",
      payload.image        || existing?.image        || null,
    );
    delete payload._rawSeo;

    payload.updatedDate = new Date();

    const doc = await blogService.updateBlog(id, payload);

    return json({ success: true, message: "Blog updated", data: doc });
  } catch (e) {
    console.error("❌ updateBlog:", e.message);
    if (e.code === "P2025") return json({ success: false, message: "Blog not found" }, 404);
    if (e.code === "P2002") return json({ success: false, message: "Slug conflict" }, 400);
    return json({ success: false, message: e.message }, 500);
  }
}

/* ── DELETE /api/blogs/:id ── */
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
    await blogService.deleteBlog(id);
    return json({ success: true, message: "Blog deleted" });
  } catch (e) {
    if (e.code === "P2025") return json({ success: false, message: "Not found" }, 404);
    return json({ success: false, message: e.message }, 500);
  }
}
