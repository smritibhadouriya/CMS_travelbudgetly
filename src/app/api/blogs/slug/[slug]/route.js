// app/api/blogs/slug/[slug]/route.js
// Native Next.js handler (Phase-4 / P3.11). Business logic stays in blog.service.

import { NextResponse } from 'next/server';
import * as blogService from '@/lib/services/blog.service';

const json = (data, status = 200) =>
  new NextResponse(JSON.stringify(data), {
    status,
    headers: { 'content-type': 'application/json; charset=utf-8' },
  });

/* ── GET /api/blogs/slug/:slug ── (increments views; P2025 → 404) */
export async function GET(req, ctx) {
  try {
    const { slug } = (await ctx.params) || {};
    const doc = await blogService.findBlogBySlugAndIncrementViews(slug);
    return json({ success: true, data: doc });
  } catch (e) {
    if (e.code === "P2025") return json({ success: false, message: "Not found" }, 404);
    return json({ success: false, message: e.message }, 500);
  }
}
