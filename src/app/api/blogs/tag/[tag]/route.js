// app/api/blogs/tag/[tag]/route.js
// Native Next.js handler (Phase-4 / P3.11). Business logic stays in blog.service.

import { NextResponse } from 'next/server';
import * as blogService from '@/lib/services/blog.service';

const json = (data, status = 200) =>
  new NextResponse(JSON.stringify(data), {
    status,
    headers: { 'content-type': 'application/json; charset=utf-8' },
  });

/* ── GET /api/blogs/tag/:tag ── */
export async function GET(req, ctx) {
  try {
    const { tag } = (await ctx.params) || {};
    const sp = req.nextUrl.searchParams;
    const page  = sp.get('page')  ?? 1;
    const limit = sp.get('limit') ?? 10;

    const skip  = (parseInt(page) - 1) * parseInt(limit);
    const where = { tags: { has: tag }, isPublished: true };
    const [docs, total] = await Promise.all([
      blogService.listBlogsByWhere({ where, skip, take: +limit }),
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
