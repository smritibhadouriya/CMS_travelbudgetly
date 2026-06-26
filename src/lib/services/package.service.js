import prisma from '@/config/prisma';
import slugify from "slugify";
import { parseSeo } from "@/lib/utils/seo.js";
import { fileUrl } from "@/lib/utils/url.js";
import { bool, num, strArr } from "@/lib/utils/coerce.js";

/* Build the Package DB payload from parsed FormData (raw) + uploaded files. */
export const buildPackagePayload = (raw, files = []) => {
  const payload = {
    slug:     raw.slug?.trim() || slugify(raw.title || "", { lower: true, strict: true }),
    title:    raw.title?.trim()    || "",
    location: raw.location?.trim() || "",
    duration: raw.duration?.trim() || "",

    allDestinations: raw.allDestinations?.trim() || "",
    destinations: Array.isArray(raw.destinations) ? raw.destinations : [],

    price:           num(raw.price),
    originalPrice:   num(raw.originalPrice),
    discountPercent: num(raw.discountPercent),
    currency:        raw.currency?.trim() || "INR",

    badge:        strArr(raw.badge),
    packageType:  raw.packageType?.trim()  || "",
    tourCategory: raw.tourCategory?.trim()  || "",
    difficulty:   raw.difficulty?.trim()    || "",

    rating:      Math.min(5, Math.max(0, num(raw.rating))),
    reviewCount: num(raw.reviewCount),

    images:    strArr(raw.images),
    imageUrls: strArr(raw.imageUrls),

    itinerary: Array.isArray(raw.itinerary) ? raw.itinerary : [],

    inclusions: strArr(raw.inclusions),
    exclusions: strArr(raw.exclusions),

    mealsIncluded:    bool(raw.mealsIncluded, false),
    hotelIncluded:    bool(raw.hotelIncluded, true),
    transferIncluded: bool(raw.transferIncluded, true),

    externalUrl: raw.externalUrl?.trim() || "",
    externalId:  raw.externalId?.trim()  || "",

    isPublished:    bool(raw.isPublished),
    isFeatured:     bool(raw.isFeatured),
    isSpecialOffer: bool(raw.isSpecialOffer),
    isSpritual:     bool(raw.isSpritual),

    tags:  strArr(raw.tags),
    order: num(raw.order),

    seo: parseSeo(raw.seo),
  };

  /* ── Uploaded gallery images get appended ── */
  files.forEach((file) => {
    if (file.fieldname === "images" || file.fieldname === "packageImage") {
      payload.images.push(fileUrl(file.path || ""));
    }
    if (file.fieldname === "seoImage") {
      payload.seo.image = { src: fileUrl(file.path || ""), alt: "", title: "" };
    }
  });

  return payload;
};

/* ── List packages (paginated) ── */
export const listPackages = async ({ where, skip, take }) =>
  prisma.package.findMany({
    where,
    orderBy: [{ isFeatured: "desc" }, { order: "asc" }, { createdAt: "desc" }],
    skip,
    take,
  });

/* ── Count packages ── */
export const countPackages = async (where) =>
  prisma.package.count({ where });

/* ── Find one package by slug ── */
export const findPackageBySlug = async (slug) =>
  prisma.package.findUnique({ where: { slug } });

/* ── Create a package ── */
export const createPackage = async (data) =>
  prisma.package.create({ data });

/* ── Update a package by id ── */
export const updatePackage = async (id, data) =>
  prisma.package.update({ where: { id }, data });

/* ── Delete a package by id ── */
export const deletePackage = async (id) =>
  prisma.package.delete({ where: { id } });
