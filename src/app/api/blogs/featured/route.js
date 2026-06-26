// app/api/blogs/featured/route.js
// Native Next.js handler (Phase-4 / P3.11). Business logic stays in blog.service.

import { NextResponse } from 'next/server';
import * as blogService from '@/lib/services/blog.service';

const json = (data, status = 200) =>
  new NextResponse(JSON.stringify(data), {
    status,
    headers: { 'content-type': 'application/json; charset=utf-8' },
  });

/* ── GET /api/blogs/featured ── */
export async function GET() {
  try {
    const docs = await blogService.listFeaturedBlogs();
    return json({ success: true, data: docs });
  } catch (e) {
    return json({ success: false, message: e.message }, 500);
  }
}
