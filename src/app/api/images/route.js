// app/api/images/route.js
// Native Next.js App Router handler.
// Business logic stays in images.service. (Public route — no auth.)

import { NextResponse } from 'next/server';
import * as imagesService from '@/lib/services/images.service';

/* ── GET /api/images ── */
export async function GET() {
  try {
    if (!imagesService.uploadDirExists()) {
      return new NextResponse(JSON.stringify({ error: 'Upload folder not found' }), { status: 404, headers: { 'content-type': 'application/json; charset=utf-8' } });
    }

    return new NextResponse(JSON.stringify({ images: imagesService.listImages() }), { status: 200, headers: { 'content-type': 'application/json; charset=utf-8' } });
  } catch (err) {
    return new NextResponse(JSON.stringify({ error: 'Failed to fetch images', message: err.message }), { status: 500, headers: { 'content-type': 'application/json; charset=utf-8' } });
  }
}
