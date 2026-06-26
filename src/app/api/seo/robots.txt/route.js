// app/api/seo/robots.txt/route.js
// Native Next.js App Router handler.
// Data retrieval stays in settings.service; robots.txt generation in sitemap.service.

import * as settingsService from '@/lib/services/settings.service';
import * as sitemapService from '@/lib/services/sitemap.service';

// Generated per request (matches the original adapter route — never prerendered).
export const dynamic = 'force-dynamic';

/* ── GET /api/seo/robots.txt ── */
export async function GET() {
  try {
    const settings = await settingsService.getSettings();
    const baseUrl  = (settings?.siteUrl || "https://www.TravelBudgetly.com").replace(/\/$/, "");

    const txt = sitemapService.buildRobotsTxt({ baseUrl, robotsExtra: settings?.robotsExtra });

    return new Response(txt, {
      status: 200,
      headers: {
        "Content-Type": "text/plain",
        "Cache-Control": "public, max-age=86400",
      },
    });
  } catch (err) {
    console.error("❌ generateRobots:", err.message);
    return new Response("Failed to generate robots.txt", { status: 500 });
  }
}
