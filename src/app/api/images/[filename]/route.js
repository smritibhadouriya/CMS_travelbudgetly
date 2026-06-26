// app/api/images/[filename]/route.js
// Native Next.js App Router handler.
// Business logic stays in images.service. (Original route exposed DELETE only.)

import { NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import * as imagesService from '@/lib/services/images.service';

// Filename safety check.
const isValidFilename = (f) =>
  f && typeof f === 'string' &&
  !f.includes('..') && !f.includes('/') &&
  !f.includes('\\') && !f.includes('%') &&
  f.length < 255;

/* ── DELETE /api/images/:filename ── */
export async function DELETE(req, ctx) {
  // Auth — this route reads no request body
  const token = req.cookies.get('token')?.value;
  if (!token) return new NextResponse(JSON.stringify({ message: 'Unauthorized' }), { status: 401, headers: { 'content-type': 'application/json; charset=utf-8' } });
  try { jwt.verify(token, process.env.JWT_SECRET); } catch { return new NextResponse(JSON.stringify({ message: 'Invalid token' }), { status: 401, headers: { 'content-type': 'application/json; charset=utf-8' } }); }

  try {
    let { filename } = (await ctx.params) || {};
    filename = decodeURIComponent(filename);

    if (!isValidFilename(filename)) {
      return new NextResponse(JSON.stringify({ success: false, message: 'Invalid filename' }), { status: 400, headers: { 'content-type': 'application/json; charset=utf-8' } });
    }

    if (!imagesService.imageExists(filename)) {
      return new NextResponse(JSON.stringify({ success: false, message: 'Image not found on server' }), { status: 404, headers: { 'content-type': 'application/json; charset=utf-8' } });
    }

    // Check if in use (Prisma version — JSON field mein search)
    const inUse = await imagesService.isImageInUse(filename);
    if (inUse) {
      return new NextResponse(JSON.stringify({ success: false, message: 'This image is currently used in content. Cannot delete.' }), { status: 400, headers: { 'content-type': 'application/json; charset=utf-8' } });
    }

    await imagesService.deleteImageFile(filename);
    return new NextResponse(JSON.stringify({ success: true, message: 'Image deleted', filename }), { status: 200, headers: { 'content-type': 'application/json; charset=utf-8' } });
  } catch (err) {
    return new NextResponse(JSON.stringify({ success: false, message: err.message }), { status: 500, headers: { 'content-type': 'application/json; charset=utf-8' } });
  }
}
