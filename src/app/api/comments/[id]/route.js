// app/api/comments/[id]/route.js
// Native Next.js App Router handler (Phase-4 / Comments API).
// Business logic stays in comment.service.

import { NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import * as commentService from '@/lib/services/comment.service';

/* ── DELETE /api/comments/:id ── */
export async function DELETE(req, ctx) {
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
    await commentService.deleteComment(id);
    return new NextResponse(JSON.stringify({ success: true, message: "Comment deleted" }), { status: 200, headers: { 'content-type': 'application/json; charset=utf-8' } });
  } catch (err) {
    if (err.code === "P2025") {
      return new NextResponse(JSON.stringify({ success: false, message: "Comment not found" }), { status: 404, headers: { 'content-type': 'application/json; charset=utf-8' } });
    }
    console.error("DELETE ERROR:", err);
    return new NextResponse(JSON.stringify({ success: false, message: err.message }), { status: 500, headers: { 'content-type': 'application/json; charset=utf-8' } });
  }
}
