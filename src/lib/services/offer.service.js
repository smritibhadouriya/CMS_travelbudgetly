import prisma from '@/config/prisma';

/* ── List offers ── */
export const listOffers = async (where) =>
  prisma.offer.findMany({ where, orderBy: { createdAt: "desc" } });

/* ── Find one offer by slug ── */
export const findOfferBySlug = async (slug) =>
  prisma.offer.findUnique({ where: { slug } });

/* ── Create an offer ── */
export const createOffer = async (data) =>
  prisma.offer.create({ data });

/* ── Update an offer by id ── */
export const updateOffer = async (id, data) =>
  prisma.offer.update({ where: { id }, data });

/* ── Delete an offer by id ── */
export const deleteOffer = async (id) =>
  prisma.offer.delete({ where: { id } });
