// app/api/comments/blog/[blogId]/route.js
// Native Next.js App Router handler (Phase-4 / Comments API). Public submit.
// Business logic stays in comment.service.

import { NextResponse } from 'next/server';
import * as commentService from '@/lib/services/comment.service';

/* ── POST /api/comments/blog/:blogId ── (submit a comment) */
export async function POST(req, ctx) {
  // Parse JSON body (bad JSON → {})
  let body = {};
  try { body = await req.json(); } catch { body = {}; }

  try {
    const { blogId } = (await ctx.params) || {};
    const { name, email, message } = body;

    if (!name?.trim() || !email?.trim() || !message?.trim()) {
      return new NextResponse(JSON.stringify({ success: false, message: "Name, email and message are required" }), { status: 400, headers: { 'content-type': 'application/json; charset=utf-8' } });
    }

    const blog = await commentService.findBlogById(blogId);
    if (!blog) {
      return new NextResponse(JSON.stringify({ success: false, message: "Blog not found" }), { status: 404, headers: { 'content-type': 'application/json; charset=utf-8' } });
    }

    const comment = await commentService.createComment({
      blogId,
      name: name.trim(),
      email: email.toLowerCase().trim(),
      message: message.trim(),
      status: "pending",
    });

    return new NextResponse(JSON.stringify({ success: true, message: "Comment submitted for review", comment }), { status: 201, headers: { 'content-type': 'application/json; charset=utf-8' } });
  } catch (err) {
    console.error("ADD COMMENT ERROR:", err);
    return new NextResponse(JSON.stringify({ success: false, message: err.message }), { status: 500, headers: { 'content-type': 'application/json; charset=utf-8' } });
  }
}
