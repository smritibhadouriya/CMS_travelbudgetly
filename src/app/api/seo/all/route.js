// app/api/seo/all/route.js
//
// Native Next.js App Router handler for the SEO admin grid (Phase-4 / SEO API).
// Business logic stays in seo.service (getAllSeoEntries).

import { NextResponse } from 'next/server';
import * as seoService from '@/lib/services/seo.service';

// JSON response body (content-type: application/json; charset=utf-8).
const json = (data, status = 200) =>
  new NextResponse(JSON.stringify(data), {
    status,
    headers: { 'content-type': 'application/json; charset=utf-8' },
  });

/* ── GET /api/seo/all ── */
export async function GET() {
  try {
    const results = await seoService.getAllSeoEntries();
    return json({ success: true, data: results });
  } catch (err) {
    console.error("❌ getAllSeo:", err.message);
    return json({ success: false, message: "Failed to load SEO data" }, 500);
  }
}
