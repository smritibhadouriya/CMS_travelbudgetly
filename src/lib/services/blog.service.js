import prisma from '@/config/prisma';

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
