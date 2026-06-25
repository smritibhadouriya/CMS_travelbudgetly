import prisma from '@/config/prisma';

export const findAllRedirects = () =>
  prisma.redirect.findMany({ orderBy: { oldSlug: "asc" } });

export const createRedirect = (data) =>
  prisma.redirect.create({ data });

export const updateRedirect = (id, data) =>
  prisma.redirect.update({ where: { id }, data });

export const deleteRedirect = (id) =>
  prisma.redirect.delete({ where: { id } });
