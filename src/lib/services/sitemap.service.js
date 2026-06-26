// src/lib/services/sitemap.service.js
// Pure sitemap.xml / robots.txt STRING generation (no DB, no req/res).
// Data is fetched by the caller (the route handler via settings.service) and
// passed in; this module only formats the output.

export const buildSitemapXml = ({ baseUrl, blogs = [], packages = [], authors = [], sitemapExtraUrls = [] }) => {
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
    ...(sitemapExtraUrls || []).map(u =>
      `\n  <url>\n    <loc>${u.startsWith("http") ? u : baseUrl + u}</loc>\n    <changefreq>monthly</changefreq>\n    <priority>0.5</priority>\n  </url>`
    ),
  ];

  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${entries.join("")}\n</urlset>`;
};

export const buildRobotsTxt = ({ baseUrl, robotsExtra = "" }) => {
  let txt = [
    "User-agent: *",
    "Allow: /",
    "Disallow: /admin/",
    "Disallow: /api/",
    "",
    `Sitemap: ${baseUrl}/sitemap.xml`,
  ].join("\n");

  if (robotsExtra?.trim()) {
    txt += "\n\n" + robotsExtra.trim();
  }

  return txt;
};
