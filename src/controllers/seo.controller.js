// controllers/seo.controller.js
// Page-level SEO management
//   GET  /api/seo/all           → all pages SEO data + score
//   GET  /api/seo?page=home     → fetch one page's SEO
//   PUT  /api/seo?page=home     → save one page's SEO

import prisma from "../config/prisma.js";
import { fileUrl } from "../utils/helpers.js";

// ── Static singleton pages ──
const PAGE_CONFIGS = [
  {
    page: "home", label: "Home Page", group: "Pages",
    getDoc:  () => prisma.home.findUnique({ where: { slug: "home" } }),
    saveDoc: (seo) => prisma.home.upsert({ where: { slug: "home" }, update: { seo }, create: { slug: "home", seo } }),
  },
  {
    page: "about", label: "About Page", group: "Pages",
    getDoc:  () => prisma.about.findUnique({ where: { slug: "about" } }),
    saveDoc: (seo) => prisma.about.upsert({ where: { slug: "about" }, update: { seo }, create: { slug: "about", seo } }),
  },
  {
    page: "blogpage", label: "Blog Listing Page", group: "Pages",
    getDoc:  () => prisma.blogPage.findUnique({ where: { slug: "blogpage" } }),
    saveDoc: (seo) => prisma.blogPage.upsert({ where: { slug: "blogpage" }, update: { seo }, create: { slug: "blogpage", seo } }),
  },
  {
    page: "package_page", label: "Package Listing Page", group: "Pages",
    getDoc:  () => prisma.packagePage.findUnique({ where: { slug: "package_page" } }),
    saveDoc: (seo) => prisma.packagePage.upsert({ where: { slug: "package_page" }, update: { seo }, create: { slug: "package_page", seo } }),
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
      const blogs = await prisma.blog.findMany({
        select: { slug: true, title: true, seo: true, isPublished: true, updatedAt: true },
      });
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
      const packages = await prisma.package.findMany({
        select: { slug: true, title: true, seo: true, isPublished: true, updatedAt: true },
      });
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
      const doc = await prisma.blog.findUnique({ where: { slug: page.replace("blog/", "") }, select: { seo: true } });
      return res.json({ success: true, data: doc?.seo || {} });
    }
    if (page.startsWith("package/")) {
      const doc = await prisma.package.findUnique({ where: { slug: page.replace("package/", "") }, select: { seo: true } });
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
      await prisma.blog.updateMany({ where: { slug: page.replace("blog/", "") }, data: { seo: seoPayload } });
      return res.json({ success: true, seo: seoPayload, score: calcScore(seoPayload) });
    }
    if (page.startsWith("package/")) {
      await prisma.package.updateMany({ where: { slug: page.replace("package/", "") }, data: { seo: seoPayload } });
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
