// backend/controllers/blog.controller.js
import prisma from "../config/prisma.js";
import { normalizeImage, parseBody, fileUrl } from "../utils/helpers.js";

/* author fields ko populate karne ke liye reusable select */
const AUTHOR_SELECT = {
  select: { id: true, name: true, email: true, image: true, bio: true, designation: true, socialLinks: true },
};

/* ── Slug helpers ── */
const toSlug = (t = "") =>
  t.toLowerCase().trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "");

const uniqueSlug = async (title, excludeId = null) => {
  let base = toSlug(title), n = 0;
  while (true) {
    const s = n === 0 ? base : `${base}-${n}`;
    const existing = await prisma.blog.findFirst({
      where: { slug: s, ...(excludeId ? { id: { not: excludeId } } : {}) },
      select: { id: true },
    });
    if (!existing) return s;
    n++;
  }
};

/* ── Auto SEO ── */
const stripHtml = (html = "") => html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();

const buildSeo = (rawSeo = {}, title = "", content = "", blogImage = null) => ({
  metaTitle:       rawSeo.metaTitle?.trim()       || title.slice(0, 60),
  metaDescription: rawSeo.metaDescription?.trim() || stripHtml(content).slice(0, 160),
  metaKeywords:    Array.isArray(rawSeo.metaKeywords)
                     ? rawSeo.metaKeywords.map(k => k.trim()).filter(Boolean)
                     : [],
  canonicalUrl:    rawSeo.canonicalUrl?.trim() || "",
  index:           rawSeo.index  !== false,
  follow:          rawSeo.follow !== false,
  image:           rawSeo.image
                     ? normalizeImage(rawSeo.image)
                     : (blogImage ? normalizeImage(blogImage) : {}),
  h1:              rawSeo.h1?.trim()          || "",
  jsonSchema:      rawSeo.jsonSchema && typeof rawSeo.jsonSchema === "object"
                     ? rawSeo.jsonSchema
                     : {},
});

/* ── Parse tags ── */
const parseTags = (raw) => {
  if (!raw) return [];
  if (Array.isArray(raw)) return raw.map(t => t.trim()).filter(Boolean);
  if (typeof raw === "string") return raw.split(",").map(t => t.trim()).filter(Boolean);
  return [];
};

/* ══════════════════════════════════════
   BUILD PAYLOAD
══════════════════════════════════════ */
const buildBlogPayload = (raw, files = []) => {
  const payload = {
    title:       raw.title?.trim()    || "",
    category:    raw.category?.trim() || "",
    content:     raw.content          || "",
    readtime:    Number(raw.readtime) || 5,
    destination: raw.Destination?.trim() || "",
    isPublished: raw.isPublished === true || raw.isPublished === "true",
    isFeatured:  raw.isFeatured  === true || raw.isFeatured  === "true",
    order:       Number(raw.order) || 0,
    applyUrl:    raw.applyUrl?.trim()  || "",
    applyText:   raw.applyText?.trim() || "",

    tags:    parseTags(raw.tags),
    // ✅ Prisma relation FK — null clears the author
    authorId: raw.author || null,

    image:       normalizeImage(raw.image),
    bannerImage: normalizeImage(raw.bannerImage),

    layoutConfig: raw.layoutConfig && typeof raw.layoutConfig === "object"
      ? {
          layout:        raw.layoutConfig.layout        || "grid",
          columns:       Number(raw.layoutConfig.columns) || 3,
          cardShape:     raw.layoutConfig.cardShape     || "rounded",
          imageShape:    raw.layoutConfig.imageShape    || "rounded",
          fullWidth:     Boolean(raw.layoutConfig.fullWidth),
          imagePosition: raw.layoutConfig.imagePosition || "top",
        }
      : undefined,

    _rawSeo: raw.seo || {},
  };

  /* ── File uploads ── */
  files.forEach(file => {
    const src = fileUrl(file.path || "");
    const img = { mode: "upload", src, alt: "", title: "" };
    if (file.fieldname === "imageFile")       payload.image       = { ...img, alt: payload.title || "" };
    if (file.fieldname === "bannerImageFile") payload.bannerImage = img;
    if (file.fieldname === "seoImageFile")    payload._rawSeo.image = img;
  });

  return payload;
};

/* ══════════════════════════════════════ READ ══════════════════════════════════════ */

export const getBlogs = async (req, res) => {
  try {
    const {
      category,
      isFeatured,
      isPublished,
      page = 1,
      limit = 100,
      search,
      tag,
      destination,
    } = req.query;

    const where = {};

    if (category)                  where.category    = category;
    if (isFeatured !== undefined)  where.isFeatured  = isFeatured  === "true";
    if (isPublished !== undefined) where.isPublished = isPublished === "true";
    if (tag)                       where.tags        = { has: tag };
    if (destination)               where.destination = destination;

    if (search) {
      where.OR = [
        { title:    { contains: search, mode: "insensitive" } },
        { content:  { contains: search, mode: "insensitive" } },
        { category: { contains: search, mode: "insensitive" } },
        { tags:     { has: search } },
      ];
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const [docs, total] = await Promise.all([
      prisma.blog.findMany({
        where,
        include: { author: AUTHOR_SELECT },
        orderBy: [{ order: "asc" }, { publishedDate: "desc" }],
        skip,
        take: +limit,
      }),
      prisma.blog.count({ where }),
    ]);

    res.json({
      success: true,
      data: docs,
      pagination: { page: +page, limit: +limit, total, pages: Math.ceil(total / +limit) },
    });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
};

export const getFeaturedBlogs = async (_q, res) => {
  try {
    const docs = await prisma.blog.findMany({
      where:   { isFeatured: true, isPublished: true },
      include: { author: AUTHOR_SELECT },
      orderBy: [{ order: "asc" }, { publishedDate: "desc" }],
      take:    6,
    });
    res.json({ success: true, data: docs });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
};

export const getTopPicks = async (_q, res) => {
  try {
    const docs = await prisma.blog.findMany({
      where:   { isPublished: true },
      include: { author: AUTHOR_SELECT },
      orderBy: [{ order: "asc" }, { publishedDate: "desc" }],
      take:    3,
    });
    res.json({ success: true, data: docs });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
};

export const getBlogBySlug = async (req, res) => {
  try {
    // increment views + return; throws P2025 if slug not found
    const doc = await prisma.blog.update({
      where:   { slug: req.params.slug },
      data:    { views: { increment: 1 } },
      include: { author: AUTHOR_SELECT },
    });
    res.json({ success: true, data: doc });
  } catch (e) {
    if (e.code === "P2025") return res.status(404).json({ success: false, message: "Not found" });
    res.status(500).json({ success: false, message: e.message });
  }
};

export const getBlogById = async (req, res) => {
  try {
    const doc = await prisma.blog.findUnique({
      where:   { id: req.params.id },
      include: { author: AUTHOR_SELECT },
    });
    if (!doc) return res.status(404).json({ success: false, message: "Not found" });
    res.json({ success: true, data: doc });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
};

export const getBlogsByCategory = async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const skip  = (parseInt(page) - 1) * parseInt(limit);
    const where = { category: req.params.category, isPublished: true };
    const [docs, total] = await Promise.all([
      prisma.blog.findMany({
        where,
        include: { author: AUTHOR_SELECT },
        orderBy: { publishedDate: "desc" },
        skip,
        take: +limit,
      }),
      prisma.blog.count({ where }),
    ]);
    res.json({
      success: true,
      data: docs,
      pagination: { page: +page, limit: +limit, total, pages: Math.ceil(total / +limit) },
    });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
};

export const getBlogsByTag = async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const skip  = (parseInt(page) - 1) * parseInt(limit);
    const where = { tags: { has: req.params.tag }, isPublished: true };
    const [docs, total] = await Promise.all([
      prisma.blog.findMany({
        where,
        include: { author: AUTHOR_SELECT },
        orderBy: { publishedDate: "desc" },
        skip,
        take: +limit,
      }),
      prisma.blog.count({ where }),
    ]);
    res.json({
      success: true,
      data: docs,
      pagination: { page: +page, limit: +limit, total, pages: Math.ceil(total / +limit) },
    });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
};

/* ══════════════════════════════════════ CREATE ══════════════════════════════════════ */
export const createBlog = async (req, res) => {
  try {
    const raw     = parseBody(req);
    const payload = buildBlogPayload(raw, req.files || []);

    if (!payload.title) return res.status(400).json({ success: false, message: "Title is required" });

    payload.slug = await uniqueSlug(payload.title);

    payload.seo = buildSeo(
      payload._rawSeo,
      payload.title,
      payload.content,
      payload.image,
    );
    delete payload._rawSeo;

    if (payload.isPublished) payload.publishedDate = new Date();

    const doc = await prisma.blog.create({
      data:    payload,
      include: { author: AUTHOR_SELECT },
    });

    res.status(201).json({ success: true, message: "Blog created", data: doc });
  } catch (e) {
    console.error("❌ createBlog:", e.message);
    if (e.code === "P2002") return res.status(400).json({ success: false, message: "Slug conflict — try a different title" });
    res.status(500).json({ success: false, message: e.message });
  }
};

/* ══════════════════════════════════════ UPDATE ══════════════════════════════════════ */
export const updateBlog = async (req, res) => {
  try {
    const raw      = parseBody(req);
    const payload  = buildBlogPayload(raw, req.files || []);

    if (payload.title) payload.slug = await uniqueSlug(payload.title, req.params.id);

    const existing = await prisma.blog.findUnique({ where: { id: req.params.id } });
    if (!existing) return res.status(404).json({ success: false, message: "Blog not found" });

    payload.seo = buildSeo(
      payload._rawSeo,
      payload.title        || existing?.title        || "",
      payload.content      || existing?.content      || "",
      payload.image        || existing?.image        || null,
    );
    delete payload._rawSeo;

    payload.updatedDate = new Date();

    const doc = await prisma.blog.update({
      where:   { id: req.params.id },
      data:    payload,
      include: { author: AUTHOR_SELECT },
    });

    res.json({ success: true, message: "Blog updated", data: doc });
  } catch (e) {
    console.error("❌ updateBlog:", e.message);
    if (e.code === "P2025") return res.status(404).json({ success: false, message: "Blog not found" });
    if (e.code === "P2002") return res.status(400).json({ success: false, message: "Slug conflict" });
    res.status(500).json({ success: false, message: e.message });
  }
};

/* ══════════════════════════════════════ DELETE / TOGGLE ══════════════════════════════════════ */

export const deleteBlog = async (req, res) => {
  try {
    await prisma.blog.delete({ where: { id: req.params.id } });
    res.json({ success: true, message: "Blog deleted" });
  } catch (e) {
    if (e.code === "P2025") return res.status(404).json({ success: false, message: "Not found" });
    res.status(500).json({ success: false, message: e.message });
  }
};

export const togglePublish = async (req, res) => {
  try {
    const doc = await prisma.blog.findUnique({ where: { id: req.params.id } });
    if (!doc) return res.status(404).json({ success: false, message: "Not found" });

    const isPublished = !doc.isPublished;
    const updated = await prisma.blog.update({
      where: { id: req.params.id },
      data: {
        isPublished,
        publishedDate: isPublished && !doc.publishedDate ? new Date() : doc.publishedDate,
        updatedDate:   new Date(),
      },
      include: { author: AUTHOR_SELECT },
    });
    res.json({ success: true, data: updated });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
};

export const toggleFeatured = async (req, res) => {
  try {
    const doc = await prisma.blog.findUnique({ where: { id: req.params.id } });
    if (!doc) return res.status(404).json({ success: false, message: "Not found" });

    const updated = await prisma.blog.update({
      where: { id: req.params.id },
      data:  { isFeatured: !doc.isFeatured, updatedDate: new Date() },
    });
    res.json({ success: true, data: updated });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
};
