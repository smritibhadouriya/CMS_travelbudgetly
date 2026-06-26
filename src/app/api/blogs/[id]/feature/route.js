// app/api/blogs/[id]/feature/route.js
// Native Next.js handler (Phase-4 / P3.11). Business logic stays in blog.service.

import { NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import * as blogService from '@/lib/services/blog.service';

const json = (data, status = 200) =>
  new NextResponse(JSON.stringify(data), {
    status,
    headers: { 'content-type': 'application/json; charset=utf-8' },
  });

/* ── PATCH /api/blogs/:id/feature ── (toggle isFeatured) */
export async function PATCH(req, ctx) {
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
    const doc = await blogService.findBlogByIdRaw(id);
    if (!doc) return json({ success: false, message: "Not found" }, 404);

    const updated = await blogService.updateBlogBasic(id, { isFeatured: !doc.isFeatured, updatedDate: new Date() });
    return json({ success: true, data: updated });
  } catch (e) {
    return json({ success: false, message: e.message }, 500);
  }
}
