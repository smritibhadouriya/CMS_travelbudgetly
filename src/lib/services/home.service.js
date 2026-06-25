import prisma from '@/config/prisma';

export const getHome = async (slug) =>
  prisma.home.findUnique({ where: { slug } });

export const upsertHome = async (slug, payload) =>
  prisma.home.upsert({
    where:  { slug },
    update: payload,
    create: payload,
  });
