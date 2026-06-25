import prisma from '@/config/prisma';

export const getAbout = async (slug) =>
  prisma.about.findUnique({ where: { slug } });

export const upsertAbout = async (slug, payload) =>
  prisma.about.upsert({
    where:  { slug },
    update: payload,
    create: payload,
  });
