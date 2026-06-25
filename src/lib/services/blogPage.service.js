import prisma from '@/config/prisma';

export const getBlogPage = async (slug) =>
  prisma.blogPage.findUnique({ where: { slug } });

export const upsertBlogPage = async (slug, payload) =>
  prisma.blogPage.upsert({
    where:  { slug },
    update: payload,
    create: payload,
  });
