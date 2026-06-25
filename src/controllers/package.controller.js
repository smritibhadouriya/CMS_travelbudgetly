// controllers/package.controller.js
// Travel packages CRUD — maps 1:1 to the `Package` model.
import * as packageService from '../lib/services/package.service.js';
import { parseSeo, parseBody, fileUrl } from "../utils/helpers.js";
import slugify from "slugify";

/* ── helpers ── */
const strArr = (v) =>
  Array.isArray(v)
    ? v.map((s) => String(s || "").trim()).filter(Boolean)
    : typeof v === "string" && v.trim()
    ? v.split(",").map((s) => s.trim()).filter(Boolean)
    : [];

const num = (v, def = 0) => (Number.isFinite(Number(v)) ? Number(v) : def);
const bool = (v, def = false) => (v === undefined || v === null ? def : v === true || v === "true");

/* ─────────────────────────────────────────────
   BUILD PAYLOAD from raw (parsed FormData JSON)
───────────────────────────────────────────── */
const buildPackagePayload = (raw, files = []) => {
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

/* ─────────────────────────────────────────────
   GET ALL — filters, search, pagination
───────────────────────────────────────────── */
export const getPackages = async (req, res) => {
  try {
    const {
      tourCategory, packageType, location, difficulty,
      isFeatured, isPublished, isSpecialOffer, isSpritual,
      page = 1, limit = 100, search,
    } = req.query;

    const where = {};
    if (tourCategory) where.tourCategory = tourCategory;
    if (packageType)  where.packageType  = packageType;
    if (location)     where.location     = location;
    if (difficulty)   where.difficulty   = difficulty;
    if (isFeatured     !== undefined) where.isFeatured     = isFeatured     === "true";
    if (isPublished    !== undefined) where.isPublished    = isPublished    === "true";
    if (isSpecialOffer !== undefined) where.isSpecialOffer = isSpecialOffer === "true";
    if (isSpritual     !== undefined) where.isSpritual     = isSpritual     === "true";
    if (search) where.OR = [
      { title:        { contains: search, mode: "insensitive" } },
      { location:     { contains: search, mode: "insensitive" } },
      { tourCategory: { contains: search, mode: "insensitive" } },
    ];

    const [total, packages] = await Promise.all([
      packageService.countPackages(where),
      packageService.listPackages({
        where,
        skip: (+page - 1) * +limit,
        take: +limit,
      }),
    ]);

    res.json({ success: true, data: packages, total, page: +page, pages: Math.ceil(total / +limit) });
  } catch (err) {
    console.error("❌ getPackages:", err.message);
    res.status(500).json({ success: false, message: "Failed to fetch packages" });
  }
};

/* ── GET ONE by slug ── */
export const getPackage = async (req, res) => {
  try {
    const pkg = await packageService.findPackageBySlug(req.params.slug);
    if (!pkg) return res.status(404).json({ success: false, message: "Package not found" });
    res.json({ success: true, data: pkg });
  } catch (err) {
    console.error("❌ getPackage:", err.message);
    res.status(500).json({ success: false, message: "Failed to fetch package" });
  }
};

/* ── CREATE ── */
export const createPackage = async (req, res, next) => {
  try {
    const raw     = parseBody(req);
    const payload = buildPackagePayload(raw, req.files || []);
    if (!payload.title) return res.status(400).json({ success: false, message: "Title is required" });

    const pkg = await packageService.createPackage(payload);
    return res.status(201).json({ success: true, message: "Package created successfully", data: pkg });
  } catch (err) {
    if (err.code === "P2002") {
      return res.status(400).json({ success: false, message: "A package with this slug already exists." });
    }
    console.error("❌ createPackage:", err);
    return next(err);
  }
};

/* ── UPDATE ── */
export const updatePackage = async (req, res) => {
  try {
    const raw     = parseBody(req);
    const payload = buildPackagePayload(raw, req.files || []);
    const pkg = await packageService.updatePackage(req.params.id, payload);
    res.json({ success: true, message: "Package updated successfully", data: pkg });
  } catch (err) {
    if (err.code === "P2025") return res.status(404).json({ success: false, message: "Package not found" });
    if (err.code === "P2002") return res.status(400).json({ success: false, message: "Slug already taken by another package." });
    console.error("❌ updatePackage:", err.message);
    res.status(500).json({ success: false, message: "Failed to update package" });
  }
};

/* ── DELETE ── */
export const deletePackage = async (req, res) => {
  try {
    await packageService.deletePackage(req.params.id);
    res.json({ success: true, message: "Package deleted successfully" });
  } catch (err) {
    if (err.code === "P2025") return res.status(404).json({ success: false, message: "Package not found" });
    console.error("❌ deletePackage:", err.message);
    res.status(500).json({ success: false, message: "Failed to delete package" });
  }
};
