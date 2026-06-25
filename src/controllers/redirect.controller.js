// controllers/redirect.controller.js
// Manage URL redirects — maps 1:1 to the `Redirect` model.
import * as redirectService from "../lib/services/redirect.service.js";
import { parseBody } from "../utils/helpers.js";

const normalizeSlug = (s = "") => "/" + String(s || "").trim().replace(/^\/+|\/+$/g, "");

/* ── GET ALL ── */
export const getRedirects = async (req, res) => {
  try {
    const redirects = await redirectService.findAllRedirects();
    res.json({ success: true, data: redirects });
  } catch (err) {
    console.error("❌ getRedirects:", err.message);
    res.status(500).json({ success: false, message: "Failed to fetch redirects" });
  }
};

/* ── CREATE ── */
export const createRedirect = async (req, res) => {
  try {
    const raw = parseBody(req);
    const oldSlug = normalizeSlug(raw.oldSlug);
    const newSlug = normalizeSlug(raw.newSlug);
    if (!raw.oldSlug || !raw.newSlug) {
      return res.status(400).json({ success: false, message: "oldSlug and newSlug are required" });
    }

    const redirect = await redirectService.createRedirect({ oldSlug, newSlug, pageType: raw.pageType?.trim() || null });
    res.status(201).json({ success: true, message: "Redirect created", data: redirect });
  } catch (err) {
    console.error("❌ createRedirect:", err.message);
    res.status(500).json({ success: false, message: "Failed to create redirect" });
  }
};

/* ── UPDATE ── */
export const updateRedirect = async (req, res) => {
  try {
    const raw = parseBody(req);
    const data = {};
    if (raw.oldSlug !== undefined)  data.oldSlug  = normalizeSlug(raw.oldSlug);
    if (raw.newSlug !== undefined)  data.newSlug  = normalizeSlug(raw.newSlug);
    if (raw.pageType !== undefined) data.pageType = raw.pageType?.trim() || null;

    const redirect = await redirectService.updateRedirect(req.params.id, data);
    res.json({ success: true, message: "Redirect updated", data: redirect });
  } catch (err) {
    if (err.code === "P2025") return res.status(404).json({ success: false, message: "Redirect not found" });
    console.error("❌ updateRedirect:", err.message);
    res.status(500).json({ success: false, message: "Failed to update redirect" });
  }
};

/* ── DELETE ── */
export const deleteRedirect = async (req, res) => {
  try {
    await redirectService.deleteRedirect(req.params.id);
    res.json({ success: true, message: "Redirect deleted" });
  } catch (err) {
    if (err.code === "P2025") return res.status(404).json({ success: false, message: "Redirect not found" });
    res.status(500).json({ success: false, message: "Failed to delete redirect" });
  }
};
