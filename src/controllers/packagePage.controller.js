// controllers/packagePage.controller.js
// GET  /api/package-page → package listing page content
// POST /api/package-page → save

import prisma from "../config/prisma.js";
import { cleanHTML, parseSeo, parseBody, fileUrl } from "../utils/helpers.js";

/* ── GET /api/package-page ── */
export const getPackagePage = async (req, res) => {
  try {
    const page = await prisma.packagePage.findUnique({ where: { slug: "package_page" } });
    res.json({ success: true, data: page || { slug: "package_page" } });
  } catch (err) {
    console.error("❌ getPackagePage:", err.message);
    res.status(500).json({ success: false, message: "Failed to load package page settings" });
  }
};

/* ── POST /api/package-page ── */
export const savePackagePage = async (req, res) => {
  try {
    const raw = parseBody(req);

    const payload = {
      slug: "package_page",

      heroLabel:   (raw.heroLabel   || "").trim(),
      heroHeading: (raw.heroHeading || "").trim(),
      heroSubtext: cleanHTML(raw.heroSubtext || ""),

      helpText:     cleanHTML(raw.helpText || ""),
      blogsHeading: (raw.blogsHeading || "Travel Blogs").trim(),

      seo: parseSeo(raw.seo),
    };

    (req.files || []).forEach((file) => {
      if (file.fieldname === "seoImage") {
        payload.seo.image = { src: fileUrl(file.path || ""), alt: "", title: "" };
      }
    });

    const updated = await prisma.packagePage.upsert({
      where:  { slug: "package_page" },
      update: payload,
      create: payload,
    });

    res.json({ success: true, message: "Package page settings saved", data: updated });
  } catch (err) {
    console.error("❌ savePackagePage:", err.message);
    res.status(500).json({ success: false, message: "Failed to save package page settings" });
  }
};
