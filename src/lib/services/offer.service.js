import prisma from '@/config/prisma';
import slugify from "slugify";
import { normalizeImage } from "@/lib/utils/image.js";
import { fileUrl } from "@/lib/utils/url.js";
import { bool } from "@/lib/utils/coerce.js";

/* Build the Offer DB payload from parsed FormData (raw) + uploaded files. */
export const buildOfferPayload = (raw, files = []) => {
  const payload = {
    slug:        raw.slug?.trim() || slugify(raw.Heading || raw.heading || "", { lower: true, strict: true }),
    banner:      normalizeImage(raw.banner),
    Heading:     (raw.Heading || raw.heading || "").trim(),
    Subtext:     (raw.Subtext || raw.subtext || "").trim(),
    isPublished: bool(raw.isPublished),
  };

  files.forEach((file) => {
    if (file.fieldname === "banner") {
      payload.banner = { src: fileUrl(file.path || ""), alt: payload.Heading || "", title: "" };
    }
  });

  return payload;
};

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
