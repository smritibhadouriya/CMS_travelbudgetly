// app/api/blogs/route.js
//
// Native Next.js App Router handlers for Blogs list/create (Phase-4 / P3.10).
//
//   Route → parse/auth → service → Prisma
//
// All business logic stays in blog.service (buildBlogPayload / uniqueSlug /
// buildSeo / listBlogs / countBlogs / createBlog); sharp conversion in
// upload.service. The handler only parses the request, enforces auth, wires the
// services, and shapes the response — byte-identically to the original behavior.

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

/* ── GET /api/blogs ── (filters, search, pagination) */
export async function GET(req) {
  try {
    const sp = req.nextUrl.searchParams;
    const category    = sp.get('category');
    const isFeatured  = sp.get('isFeatured');
    const isPublished = sp.get('isPublished');
    const page        = sp.get('page')  ?? 1;
    const limit       = sp.get('limit') ?? 100;
    const search      = sp.get('search');
    const tag         = sp.get('tag');
    const destination = sp.get('destination');

    const where = {};

    if (category)                  where.category    = category;
    if (isFeatured  !== null)       where.isFeatured  = isFeatured  === "true";
    if (isPublished !== null)       where.isPublished = isPublished === "true";
    if (tag)                        where.tags        = { has: tag };
    if (destination)                where.destination = destination;

    if (search) {
      where.OR = [
        { title:    { contains: search, mode: "insensitive" } },
        { content:  { contains: search, mode: "insensitive" } },
        { category: { contains: search, mode: "insensitive" } },
        { tags:     { has: search } },
      ];
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const [docs, total] = await Promise.all([
      blogService.listBlogs({ where, skip, take: +limit }),
      blogService.countBlogs(where),
    ]);

    return json({
      success: true,
      data: docs,
      pagination: { page: +page, limit: +limit, total, pages: Math.ceil(total / +limit) },
    });
  } catch (e) {
    return json({ success: false, message: e.message }, 500);
  }
}

/* ── POST /api/blogs ── */
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

  // 4. Orchestrate (was createBlog) — business logic stays in the service
  try {
    const raw     = parseBody({ body });
    const payload = blogService.buildBlogPayload(raw, files);

    if (!payload.title) return json({ success: false, message: "Title is required" }, 400);

    payload.slug = await blogService.uniqueSlug(payload.title);

    payload.seo = blogService.buildSeo(
      payload._rawSeo,
      payload.title,
      payload.content,
      payload.image,
    );
    delete payload._rawSeo;

    if (payload.isPublished) payload.publishedDate = new Date();

    const doc = await blogService.createBlog(payload);

    return json({ success: true, message: "Blog created", data: doc }, 201);
  } catch (e) {
    console.error("❌ createBlog:", e.message);
    if (e.code === "P2002") return json({ success: false, message: "Slug conflict — try a different title" }, 400);
    return json({ success: false, message: e.message }, 500);
  }
}
