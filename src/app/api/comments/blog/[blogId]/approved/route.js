// app/api/comments/blog/[blogId]/approved/route.js
// Native Next.js App Router handler (Phase-4 / Comments API). Public read.
// Business logic stays in comment.service.

import { NextResponse } from 'next/server';
import * as commentService from '@/lib/services/comment.service';

/* ── GET /api/comments/blog/:blogId/approved ── */
export async function GET(req, ctx) {
  try {
    const { blogId } = (await ctx.params) || {};
    const comments = await commentService.findApprovedComments(blogId);
    return new NextResponse(JSON.stringify({ success: true, comments }), { status: 200, headers: { 'content-type': 'application/json; charset=utf-8' } });
  } catch (err) {
    console.error("GET APPROVED ERROR:", err);
    return new NextResponse(JSON.stringify({ success: false, message: err.message }), { status: 500, headers: { 'content-type': 'application/json; charset=utf-8' } });
  }
}
