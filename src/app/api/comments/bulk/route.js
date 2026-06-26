// app/api/comments/bulk/route.js
// Native Next.js App Router handler (Phase-4 / Comments API).
// Business logic stays in comment.service.

import { NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import * as commentService from '@/lib/services/comment.service';

/* ── PUT /api/comments/bulk ── (bulk update / delete) */
export async function PUT(req) {
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
    const { ids, status, action } = body;

    if (!ids?.length) {
      return new NextResponse(JSON.stringify({ success: false, message: "No IDs provided" }), { status: 400, headers: { 'content-type': 'application/json; charset=utf-8' } });
    }

    /* 🗑 Bulk delete */
    if (action === "delete") {
      await commentService.deleteManyComments(ids);
      return new NextResponse(JSON.stringify({ success: true, message: `${ids.length} comments deleted` }), { status: 200, headers: { 'content-type': 'application/json; charset=utf-8' } });
    }

    if (!["approved", "rejected", "pending"].includes(status)) {
      return new NextResponse(JSON.stringify({ success: false, message: "Invalid status" }), { status: 400, headers: { 'content-type': 'application/json; charset=utf-8' } });
    }

    await commentService.updateManyCommentStatus(ids, status);
    return new NextResponse(JSON.stringify({ success: true, message: `${ids.length} comments updated to ${status}` }), { status: 200, headers: { 'content-type': 'application/json; charset=utf-8' } });
  } catch (err) {
    console.error("BULK ERROR:", err);
    return new NextResponse(JSON.stringify({ success: false, message: err.message }), { status: 500, headers: { 'content-type': 'application/json; charset=utf-8' } });
  }
}
