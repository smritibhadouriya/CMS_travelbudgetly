import prisma from '@/config/prisma';

export const getPackagePage = async (slug) =>
  prisma.packagePage.findUnique({ where: { slug } });

export const upsertPackagePage = async (slug, payload) =>
  prisma.packagePage.upsert({
    where:  { slug },
    update: payload,
    create: payload,
  });
