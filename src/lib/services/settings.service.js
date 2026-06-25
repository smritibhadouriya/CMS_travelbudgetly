import prisma from '@/config/prisma';

/* ── Read the global settings record ── */
export const getSettings = async () =>
  prisma.settings.findUnique({ where: { slug: "global" } });

/* ── Upsert the global settings record ── */
export const upsertSettings = async (payload) =>
  prisma.settings.upsert({
    where:  { slug: "global" },
    update: payload,
    create: payload,
  });

/* ── Published blogs for the sitemap ── */
export const getPublishedBlogsForSitemap = async () =>
  prisma.blog.findMany({
    where:  { isPublished: true },
    select: { slug: true, updatedAt: true },
  });

/* ── Active authors for the sitemap ── */
export const getActiveAuthorsForSitemap = async () =>
  prisma.author.findMany({
    where: { isActive: true },
    select: { slug: true, updatedAt: true },
  });

/* ── Published packages for the sitemap ── */
export const getPublishedPackagesForSitemap = async () =>
  prisma.package.findMany({
    where:  { isPublished: true },
    select: { slug: true, updatedAt: true },
  });
