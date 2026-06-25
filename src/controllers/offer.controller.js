// controllers/offer.controller.js
// Special-offer banners — maps 1:1 to the `Offer` model.
import * as offerService from '../lib/services/offer.service.js';
import { normalizeImage, parseBody, fileUrl } from "../utils/helpers.js";
import slugify from "slugify";

const bool = (v, def = false) => (v === undefined || v === null ? def : v === true || v === "true");

const buildOfferPayload = (raw, files = []) => {
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

/* ── GET ALL ── */
export const getOffers = async (req, res) => {
  try {
    const { isPublished } = req.query;
    const where = {};
    if (isPublished !== undefined) where.isPublished = isPublished === "true";

    const offers = await offerService.listOffers(where);
    res.json({ success: true, data: offers });
  } catch (err) {
    console.error("❌ getOffers:", err.message);
    res.status(500).json({ success: false, message: "Failed to fetch offers" });
  }
};

/* ── GET ONE by slug ── */
export const getOffer = async (req, res) => {
  try {
    const offer = await offerService.findOfferBySlug(req.params.slug);
    if (!offer) return res.status(404).json({ success: false, message: "Offer not found" });
    res.json({ success: true, data: offer });
  } catch (err) {
    res.status(500).json({ success: false, message: "Failed to fetch offer" });
  }
};

/* ── CREATE ── */
export const createOffer = async (req, res) => {
  try {
    const raw     = parseBody(req);
    const payload = buildOfferPayload(raw, req.files || []);
    if (!payload.slug) return res.status(400).json({ success: false, message: "Heading or slug is required" });

    const offer = await offerService.createOffer(payload);
    res.status(201).json({ success: true, message: "Offer created", data: offer });
  } catch (err) {
    if (err.code === "P2002") return res.status(400).json({ success: false, message: "An offer with this slug already exists." });
    console.error("❌ createOffer:", err.message);
    res.status(500).json({ success: false, message: "Failed to create offer" });
  }
};

/* ── UPDATE ── */
export const updateOffer = async (req, res) => {
  try {
    const raw     = parseBody(req);
    const payload = buildOfferPayload(raw, req.files || []);
    const offer = await offerService.updateOffer(req.params.id, payload);
    res.json({ success: true, message: "Offer updated", data: offer });
  } catch (err) {
    if (err.code === "P2025") return res.status(404).json({ success: false, message: "Offer not found" });
    if (err.code === "P2002") return res.status(400).json({ success: false, message: "Slug already taken." });
    console.error("❌ updateOffer:", err.message);
    res.status(500).json({ success: false, message: "Failed to update offer" });
  }
};

/* ── DELETE ── */
export const deleteOffer = async (req, res) => {
  try {
    await offerService.deleteOffer(req.params.id);
    res.json({ success: true, message: "Offer deleted" });
  } catch (err) {
    if (err.code === "P2025") return res.status(404).json({ success: false, message: "Offer not found" });
    res.status(500).json({ success: false, message: "Failed to delete offer" });
  }
};
