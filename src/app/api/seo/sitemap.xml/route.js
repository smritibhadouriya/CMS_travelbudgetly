// app/api/seo/sitemap.xml/route.js
// Native Next.js App Router handler.
// Data retrieval stays in settings.service; XML generation in sitemap.service.

import * as settingsService from '@/lib/services/settings.service';
import * as sitemapService from '@/lib/services/sitemap.service';

// Generated per request (matches the original adapter route — never prerendered).
export const dynamic = 'force-dynamic';

/* ── GET /api/seo/sitemap.xml ── */
export async function GET() {
  try {
    const settings = await settingsService.getSettings();
    const baseUrl  = (settings?.siteUrl || "https://www.TravelBudgetly.com").replace(/\/$/, "");

    let blogs = [];
    try {
      blogs = await settingsService.getPublishedBlogsForSitemap();
    } catch (_) {}

    let authors = [];
    try {
      authors = await settingsService.getActiveAuthorsForSitemap();
    } catch (_) {}

    let packages = [];
    try {
      packages = await settingsService.getPublishedPackagesForSitemap();
    } catch (_) {}

    const xml = sitemapService.buildSitemapXml({
      baseUrl,
      blogs,
      packages,
      authors,
      sitemapExtraUrls: settings?.sitemapExtraUrls || [],
    });

    return new Response(xml, {
      status: 200,
      headers: {
        "Content-Type": "application/xml",
        "Cache-Control": "public, max-age=3600",
      },
    });
  } catch (err) {
    console.error("❌ generateSitemap:", err.message);
    return new Response("Failed to generate sitemap", { status: 500 });
  }
}
