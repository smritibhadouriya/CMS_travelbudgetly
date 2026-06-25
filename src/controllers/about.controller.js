// controllers/about.controller.js
// GET  /api/pages/about → about page content
// POST /api/pages/about → save

import prisma from "../config/prisma.js";
import { cleanHTML, normalizeImage, parseSeo, parseBody, fileUrl } from "../utils/helpers.js";

/* ── GET /api/pages/about ── */
export const getAboutPage = async (req, res) => {
  try {
    const page = await prisma.about.findUnique({ where: { slug: "about" } });
    res.json({ success: true, data: page || { slug: "about" } });
  } catch (err) {
    console.error("❌ getAboutPage:", err.message);
    res.status(500).json({ success: false, message: "Failed to load About page" });
  }
};

/* ── POST /api/pages/about ── */
export const saveAboutPage = async (req, res) => {
  try {
    const raw = parseBody(req);

    const payload = {
      slug: "about",

      // Hero
      heroHeading: (raw.heroHeading || "").trim(),
      heroSubtext: cleanHTML(raw.heroSubtext || ""),
      heroImage:   normalizeImage(raw.heroImage),

      // Mission
      missionHeading: (raw.missionHeading || "").trim(),
      missionText:    cleanHTML(raw.missionText || ""),

      // Journey
      journeyHeading: (raw.journeyHeading || "").trim(),
      journeyBody:    cleanHTML(raw.journeyBody || ""),
      journeyImage:   normalizeImage(raw.journeyImage),

      // Stats: [{ value, label }]
      stats: Array.isArray(raw.stats)
        ? raw.stats.slice(0, 12).map((s) => ({
            value: (s?.value || "").toString().trim(),
            label: (s?.label || "").trim(),
          }))
        : [],

      seo: parseSeo(raw.seo),
    };

    // File uploads
    (req.files || []).forEach((file) => {
      const src = fileUrl(file.path || "");
      if (file.fieldname === "heroImage")    payload.heroImage    = normalizeImage({ src, alt: payload.heroHeading });
      if (file.fieldname === "journeyImage") payload.journeyImage = normalizeImage({ src, alt: payload.journeyHeading });
      if (file.fieldname === "seoImage")     payload.seo.image    = normalizeImage({ src });
    });

    const updated = await prisma.about.upsert({
      where:  { slug: "about" },
      update: payload,
      create: payload,
    });

    res.json({ success: true, message: "About page saved", data: updated });
  } catch (err) {
    console.error("❌ saveAboutPage:", err.message);
    res.status(500).json({ success: false, message: "Failed to save About page" });
  }
};
