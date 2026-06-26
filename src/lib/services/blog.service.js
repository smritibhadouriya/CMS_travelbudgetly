import prisma from '@/config/prisma';
import { normalizeImage } from "@/lib/utils/image.js";
import { fileUrl } from "@/lib/utils/url.js";

/* author fields ko populate karne ke liye reusable select */
export const AUTHOR_SELECT = {
  select: { id: true, name: true, email: true, image: true, bio: true, designation: true, socialLinks: true },
};

/* ── Slug helpers ── */
const toSlug = (t = "") =>
  t.toLowerCase().trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "");

export const uniqueSlug = async (title, excludeId = null) => {
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

export const buildSeo = (rawSeo = {}, title = "", content = "", blogImage = null) => ({
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
   BUILD PAYLOAD from parsed FormData (raw) + uploaded files.
══════════════════════════════════════ */
export const buildBlogPayload = (raw, files = []) => {
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

export const listBlogs = async ({ where, skip, take }) =>
  prisma.blog.findMany({
    where,
    include: { author: AUTHOR_SELECT },
    orderBy: [{ order: "asc" }, { publishedDate: "desc" }],
    skip,
    take,
  });

export const countBlogs = async (where) => prisma.blog.count({ where });

export const listFeaturedBlogs = async () =>
  prisma.blog.findMany({
    where:   { isFeatured: true, isPublished: true },
    include: { author: AUTHOR_SELECT },
    orderBy: [{ order: "asc" }, { publishedDate: "desc" }],
    take:    6,
  });

export const listTopPicks = async () =>
  prisma.blog.findMany({
    where:   { isPublished: true },
    include: { author: AUTHOR_SELECT },
    orderBy: [{ order: "asc" }, { publishedDate: "desc" }],
    take:    3,
  });

export const findBlogBySlugAndIncrementViews = async (slug) =>
  prisma.blog.update({
    where:   { slug },
    data:    { views: { increment: 1 } },
    include: { author: AUTHOR_SELECT },
  });

export const findBlogById = async (id) =>
  prisma.blog.findUnique({
    where:   { id },
    include: { author: AUTHOR_SELECT },
  });

export const listBlogsByWhere = async ({ where, skip, take }) =>
  prisma.blog.findMany({
    where,
    include: { author: AUTHOR_SELECT },
    orderBy: { publishedDate: "desc" },
    skip,
    take,
  });

/* ══════════════════════════════════════ CREATE ══════════════════════════════════════ */

export const createBlog = async (data) =>
  prisma.blog.create({
    data,
    include: { author: AUTHOR_SELECT },
  });

/* ══════════════════════════════════════ UPDATE ══════════════════════════════════════ */

export const findBlogByIdRaw = async (id) =>
  prisma.blog.findUnique({ where: { id } });

export const updateBlog = async (id, data) =>
  prisma.blog.update({
    where:   { id },
    data,
    include: { author: AUTHOR_SELECT },
  });

export const updateBlogBasic = async (id, data) =>
  prisma.blog.update({
    where: { id },
    data,
  });

/* ══════════════════════════════════════ DELETE ══════════════════════════════════════ */

export const deleteBlog = async (id) =>
  prisma.blog.delete({ where: { id } });
