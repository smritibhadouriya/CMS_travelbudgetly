// controllers/seo.controller.js
// Page-level SEO management
//   GET  /api/seo/all           → all pages SEO data + score
//   GET  /api/seo?page=home     → fetch one page's SEO
//   PUT  /api/seo?page=home     → save one page's SEO

import * as seoService from "../lib/services/seo.service.js";
import { fileUrl } from "../utils/helpers.js";

// ── Static singleton pages ──
const PAGE_CONFIGS = [
  {
    page: "home", label: "Home Page", group: "Pages",
    getDoc:  () => seoService.getHomeDoc(),
    saveDoc: (seo) => seoService.saveHomeDoc(seo),
  },
  {
    page: "about", label: "About Page", group: "Pages",
    getDoc:  () => seoService.getAboutDoc(),
    saveDoc: (seo) => seoService.saveAboutDoc(seo),
  },
  {
    page: "blogpage", label: "Blog Listing Page", group: "Pages",
    getDoc:  () => seoService.getBlogPageDoc(),
    saveDoc: (seo) => seoService.saveBlogPageDoc(seo),
  },
  {
    page: "package_page", label: "Package Listing Page", group: "Pages",
    getDoc:  () => seoService.getPackagePageDoc(),
    saveDoc: (seo) => seoService.savePackagePageDoc(seo),
  },
];

const calcScore = (seo = {}) => {
  let score = 0;
  if (seo.metaTitle?.trim())       score += 25;
  if (seo.metaDescription?.trim()) score += 25;
  if (seo.metaKeywords?.length)    score += 20;
  if (seo.canonicalUrl?.trim())    score += 15;
  if (seo.image?.src?.trim())      score += 15;
  return score;
};

/* ══════════════════════════════════════ GET /api/seo/all ══════════════════════════════════════ */
export const getAllSeo = async (req, res) => {
  try {
    const results = await Promise.all(
      PAGE_CONFIGS.map(async (config) => {
        try {
          const doc = await config.getDoc();
          const seo = doc?.seo || {};
          return { page: config.page, label: config.label, group: config.group, seo, score: calcScore(seo) };
        } catch (_) {
          return { page: config.page, label: config.label, group: config.group, seo: {}, score: 0 };
        }
      })
    );

    // Dynamic: blogs
    try {
      const blogs = await seoService.findAllBlogsSeo();
      blogs.forEach((b) =>
        results.push({
          page: `blog/${b.slug}`, label: b.title || b.slug, group: "Blogs",
          status: b.isPublished ? "published" : "draft",
          seo: b.seo || {}, score: calcScore(b.seo || {}),
        })
      );
    } catch (_) {}

    // Dynamic: packages
    try {
      const packages = await seoService.findAllPackagesSeo();
      packages.forEach((p) =>
        results.push({
          page: `package/${p.slug}`, label: p.title || p.slug, group: "Packages",
          status: p.isPublished ? "published" : "draft",
          seo: p.seo || {}, score: calcScore(p.seo || {}),
        })
      );
    } catch (_) {}

    res.json({ success: true, data: results });
  } catch (err) {
    console.error("❌ getAllSeo:", err.message);
    res.status(500).json({ success: false, message: "Failed to load SEO data" });
  }
};

/* ══════════════════════════════════════ GET /api/seo?page=home ══════════════════════════════════════ */
export const getSeoByPage = async (req, res) => {
  try {
    const { page } = req.query;
    if (!page) return res.status(400).json({ success: false, message: "page param required" });

    if (page.startsWith("blog/")) {
      const doc = await seoService.findBlogSeoBySlug(page.replace("blog/", ""));
      return res.json({ success: true, data: doc?.seo || {} });
    }
    if (page.startsWith("package/")) {
      const doc = await seoService.findPackageSeoBySlug(page.replace("package/", ""));
      return res.json({ success: true, data: doc?.seo || {} });
    }

    const config = PAGE_CONFIGS.find((c) => c.page === page);
    if (!config) return res.status(404).json({ success: false, message: "Page not found" });

    const doc = await config.getDoc();
    res.json({ success: true, data: doc?.seo || {} });
  } catch (err) {
    res.status(500).json({ success: false, message: "Failed to load SEO" });
  }
};

/* ══════════════════════════════════════ PUT /api/seo?page=home ══════════════════════════════════════ */
export const saveSeoByPage = async (req, res) => {
  try {
    const { page } = req.query;
    if (!page) return res.status(400).json({ success: false, message: "page param required" });

    let raw = {};
    if (req.body?.data) {
      try { raw = JSON.parse(req.body.data); } catch (_) { raw = req.body; }
    } else {
      raw = req.body || {};
    }

    const incomingSeo = raw.seo || {};

    const seoPayload = {
      metaTitle:       (incomingSeo.metaTitle       || "").trim(),
      metaDescription: (incomingSeo.metaDescription || "").trim(),
      metaKeywords:    Array.isArray(incomingSeo.metaKeywords) ? incomingSeo.metaKeywords : [],
      canonicalUrl:    (incomingSeo.canonicalUrl    || "").trim(),
      index:           incomingSeo.index  !== false,
      follow:          incomingSeo.follow !== false,
      jsonSchema:      (typeof incomingSeo.jsonSchema === "object" && incomingSeo.jsonSchema !== null) ? incomingSeo.jsonSchema : {},
      image: {
        mode:  incomingSeo.image?.mode  || "url",
        src:   incomingSeo.image?.src   || "",
        alt:   incomingSeo.image?.alt   || "",
        title: incomingSeo.image?.title || "",
      },
    };

    const imgFile = (req.files || []).find((f) => f.fieldname === "seoImage");
    if (imgFile) {
      seoPayload.image = { mode: "upload", src: fileUrl(imgFile.path), alt: seoPayload.metaTitle || "", title: seoPayload.metaTitle || "" };
    }

    // Dynamic targets
    if (page.startsWith("blog/")) {
      await seoService.updateBlogSeoBySlug(page.replace("blog/", ""), seoPayload);
      return res.json({ success: true, seo: seoPayload, score: calcScore(seoPayload) });
    }
    if (page.startsWith("package/")) {
      await seoService.updatePackageSeoBySlug(page.replace("package/", ""), seoPayload);
      return res.json({ success: true, seo: seoPayload, score: calcScore(seoPayload) });
    }

    const config = PAGE_CONFIGS.find((c) => c.page === page);
    if (!config) return res.status(404).json({ success: false, message: "Page not found" });

    await config.saveDoc(seoPayload);
    res.json({ success: true, seo: seoPayload, score: calcScore(seoPayload) });
  } catch (err) {
    console.error("❌ saveSeoByPage:", err.message);
    res.status(500).json({ success: false, message: "Failed to save SEO" });
  }
};
