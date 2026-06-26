// app/api/comments/route.js
// Native Next.js App Router handler (Phase-4 / Comments API).
// Business logic / aggregation stays in comment.service.

import { NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import * as commentService from '@/lib/services/comment.service';

/* ── GET /api/comments ── (admin list: grouped or flat) */
export async function GET(req) {
  // Auth
  const token = req.cookies.get('token')?.value;
  if (!token) {
    return new NextResponse(JSON.stringify({ message: 'Unauthorized' }), { status: 401, headers: { 'content-type': 'application/json; charset=utf-8' } });
  }
  try {
    jwt.verify(token, process.env.JWT_SECRET);
  } catch {
    return new NextResponse(JSON.stringify({ message: 'Invalid token' }), { status: 401, headers: { 'content-type': 'application/json; charset=utf-8' } });
  }

  try {
    const sp = req.nextUrl.searchParams;
    const status  = sp.get('status');
    const blogId  = sp.get('blogId');
    const page    = sp.get('page')  ?? 1;
    const limit   = sp.get('limit') ?? 20;
    const q       = sp.get('q');
    const sort    = sp.get('sort')  ?? "latest";
    const date    = sp.get('date');
    const grouped = sp.get('grouped');

    /* ───────── GROUPED MODE ───────── */
    if (grouped === "true") {
      const groups = await commentService.getGroupedComments({ status, blogId, q, date, sort });
      return new NextResponse(JSON.stringify({ success: true, grouped: true, groups }), { status: 200, headers: { 'content-type': 'application/json; charset=utf-8' } });
    }

    /* ───────── FLAT MODE ───────── */
    const { comments, total, page: pageNum, totalPages } =
      await commentService.getFlatComments({ status, blogId, q, date, sort, page, limit });

    return new NextResponse(JSON.stringify({ success: true, grouped: false, comments, total, page: pageNum, totalPages }), { status: 200, headers: { 'content-type': 'application/json; charset=utf-8' } });
  } catch (err) {
    console.error("GET COMMENTS ERROR:", err);
    return new NextResponse(JSON.stringify({ success: false, message: err.message }), { status: 500, headers: { 'content-type': 'application/json; charset=utf-8' } });
  }
}
