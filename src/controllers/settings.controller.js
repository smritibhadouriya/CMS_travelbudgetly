// backend/controllers/settings.controller.js
// Global site settings + sitemap.xml / robots.txt generation.
import * as settingsService from '../lib/services/settings.service.js';
import { parseBody, fileUrl } from "../utils/helpers.js";

/* ══════════════════════════════
   GET /api/settings
══════════════════════════════ */
export const getSettings = async (req, res) => {
  try {
    const settings = await settingsService.getSettings();
    res.json({ success: true, data: settings || {} });
  } catch (err) {
    console.error("❌ getSettings:", err.message);
    res.status(500).json({ success: false, message: "Failed to load settings" });
  }
};

/* ══════════════════════════════
   POST /api/settings
══════════════════════════════ */
export const saveSettings = async (req, res) => {
  try {
    const raw = parseBody(req);

    const payload = {
      slug:        "global",
      siteName:    raw.siteName?.trim()    || "TravelBudgetly",
      siteUrl:     raw.siteUrl?.trim()     || "https://www.TravelBudgetly.com",
      defaultMeta: raw.defaultMeta?.trim() || "",

      social: {
        twitter:   raw.social?.twitter?.trim()   || "",
        instagram: raw.social?.instagram?.trim() || "",
        linkedin:  raw.social?.linkedin?.trim()  || "",
        youtube:   raw.social?.youtube?.trim()   || "",
        facebook:  raw.social?.facebook?.trim()  || "",
      },

      robotsExtra:      raw.robotsExtra?.trim() || "",
      sitemapExtraUrls: Array.isArray(raw.sitemapExtraUrls)
        ? raw.sitemapExtraUrls.filter(Boolean)
        : [],

      googleAnalyticsId:  raw.googleAnalyticsId?.trim()  || "",
      googleTagManagerId: raw.googleTagManagerId?.trim() || "",

      logoUrl:    (raw.logoUrl    || "").trim(),
      faviconUrl: (raw.faviconUrl || "").trim(),
    };

    /* Logo / favicon file uploads (override the text URL if a file is sent) */
    (req.files || []).forEach(file => {
      const src = fileUrl(file.path || "");
      if (file.fieldname === "logoFile")    payload.logoUrl    = src;
      if (file.fieldname === "faviconFile") payload.faviconUrl = src;
    });

    const updated = await settingsService.upsertSettings(payload);
    res.json({ success: true, message: "Settings saved", data: updated });
  } catch (err) {
    console.error("❌ saveSettings:", err.message);
    res.status(500).json({ success: false, message: "Failed to save settings" });
  }
};

/* ══════════════════════════════
   GET /sitemap.xml
══════════════════════════════ */
export const generateSitemap = async (req, res) => {
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

    const staticPages = [
      { url: "/",        priority: "1.0", changefreq: "weekly"  },
      { url: "/blog",    priority: "0.8", changefreq: "daily"   },
      { url: "/packages",priority: "0.8", changefreq: "weekly"  },
      { url: "/about",   priority: "0.6", changefreq: "monthly" },
    ];

    const entries = [
      ...staticPages.map(p =>
        `\n  <url>\n    <loc>${baseUrl}${p.url}</loc>\n    <changefreq>${p.changefreq}</changefreq>\n    <priority>${p.priority}</priority>\n  </url>`
      ),
      ...blogs.map(b =>
        `\n  <url>\n    <loc>${baseUrl}/blog/${b.slug}</loc>\n    <lastmod>${new Date(b.updatedAt).toISOString().split("T")[0]}</lastmod>\n    <changefreq>monthly</changefreq>\n    <priority>0.7</priority>\n  </url>`
      ),
      ...packages.map(p =>
        `\n  <url>\n    <loc>${baseUrl}/packages/${p.slug}</loc>\n    <lastmod>${new Date(p.updatedAt).toISOString().split("T")[0]}</lastmod>\n    <changefreq>weekly</changefreq>\n    <priority>0.7</priority>\n  </url>`
      ),
       ...authors.map(a =>
        `\n  <url>\n    <loc>${baseUrl}/blog/author/${a.slug}</loc>\n    <lastmod>${new Date(a.updatedAt).toISOString().split("T")[0]}</lastmod>\n    <changefreq>monthly</changefreq>\n    <priority>0.7</priority>\n  </url>`
      ),
      ...(settings?.sitemapExtraUrls || []).map(u =>
        `\n  <url>\n    <loc>${u.startsWith("http") ? u : baseUrl + u}</loc>\n    <changefreq>monthly</changefreq>\n    <priority>0.5</priority>\n  </url>`
      ),
    ];

    const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${entries.join("")}\n</urlset>`;

    res.setHeader("Content-Type", "application/xml");
    res.setHeader("Cache-Control", "public, max-age=3600");
    res.send(xml);
  } catch (err) {
    console.error("❌ generateSitemap:", err.message);
    res.status(500).send("Failed to generate sitemap");
  }
};

/* ══════════════════════════════
   GET /robots.txt
══════════════════════════════ */
export const generateRobots = async (req, res) => {
  try {
    const settings = await settingsService.getSettings();
    const baseUrl  = (settings?.siteUrl || "https://www.TravelBudgetly.com").replace(/\/$/, "");

    let txt = [
      "User-agent: *",
      "Allow: /",
      "Disallow: /admin/",
      "Disallow: /api/",
      "",
      `Sitemap: ${baseUrl}/sitemap.xml`,
    ].join("\n");

    if (settings?.robotsExtra?.trim()) {
      txt += "\n\n" + settings.robotsExtra.trim();
    }

    res.setHeader("Content-Type", "text/plain");
    res.setHeader("Cache-Control", "public, max-age=86400");
    res.send(txt);
  } catch (err) {
    console.error("❌ generateRobots:", err.message);
    res.status(500).send("Failed to generate robots.txt");
  }
};
