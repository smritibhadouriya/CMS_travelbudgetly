// app/api/comments/[id]/status/route.js
// Native Next.js App Router handler (Phase-4 / Comments API).
// Business logic stays in comment.service.

import { NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import * as commentService from '@/lib/services/comment.service';

/* ── PUT /api/comments/:id/status ── */
export async function PUT(req, ctx) {
  // Parse JSON body (bad JSON → {})
  let body = {};
  try { body = await req.json(); } catch { body = {}; }

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
    const { id } = (await ctx.params) || {};
    const { status } = body;

    if (!["approved", "rejected", "pending"].includes(status)) {
      return new NextResponse(JSON.stringify({ success: false, message: "Invalid status" }), { status: 400, headers: { 'content-type': 'application/json; charset=utf-8' } });
    }

    const comment = await commentService.updateCommentStatus(id, status);

    return new NextResponse(JSON.stringify({ success: true, comment }), { status: 200, headers: { 'content-type': 'application/json; charset=utf-8' } });
  } catch (err) {
    if (err.code === "P2025") {
      return new NextResponse(JSON.stringify({ success: false, message: "Comment not found" }), { status: 404, headers: { 'content-type': 'application/json; charset=utf-8' } });
    }
    console.error("UPDATE STATUS ERROR:", err);
    return new NextResponse(JSON.stringify({ success: false, message: err.message }), { status: 500, headers: { 'content-type': 'application/json; charset=utf-8' } });
  }
}
