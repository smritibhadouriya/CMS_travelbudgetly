import prisma from '@/config/prisma';

/* ── slug helper ── */
const toSlug = (text = "") =>
  text.toLowerCase().trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-");

/* slug ko unique banao — Author table mein collision check */
export const uniqueAuthorSlug = async (name, excludeId = null) => {
  const baseSlug = toSlug(name);
  let slug = baseSlug;
  let counter = 1;
  while (
    await prisma.author.findFirst({
      where: { slug, ...(excludeId ? { id: { not: excludeId } } : {}) },
      select: { id: true },
    })
  ) {
    slug = `${baseSlug}-${counter++}`;
  }
  return slug;
};

export const findAuthorByEmail = (email) =>
  prisma.author.findUnique({ where: { email } });

export const findDuplicateEmail = (email, excludeId) =>
  prisma.author.findFirst({
    where: { email, id: { not: excludeId } },
    select: { id: true },
  });

export const createAuthor = (data) =>
  prisma.author.create({ data });

export const findAuthorById = (id) =>
  prisma.author.findUnique({ where: { id } });

export const findAuthorBySlug = (slug) =>
  prisma.author.findUnique({ where: { slug } });

export const updateAuthor = (id, data) =>
  prisma.author.update({ where: { id }, data });

export const findAuthors = (where) =>
  prisma.author.findMany({ where, orderBy: { createdAt: "desc" } });

export const findPublishedBlogsByAuthor = (authorId) =>
  prisma.blog.findMany({
    where:   { authorId, isPublished: true },
    orderBy: { createdAt: "desc" },
    select: {
      id: true, title: true, slug: true, content: true,
      bannerImage: true, image: true, category: true, destination: true,
      tags: true, readtime: true, createdAt: true, publishedDate: true,
    },
  });

export const deleteAuthor = (id) =>
  prisma.author.delete({ where: { id } });
