// controllers/blogPage.controller.js
// GET  /api/blogpage → blog listing page content
// POST /api/blogpage → save

import prisma from "../config/prisma.js";
import { cleanHTML, parseSeo, parseBody, fileUrl } from "../utils/helpers.js";

/* ── GET /api/blogpage ── */
export const getBlogPage = async (req, res) => {
  try {
    const page = await prisma.blogPage.findUnique({ where: { slug: "blogpage" } });
    res.json({ success: true, data: page || { slug: "blogpage" } });
  } catch (err) {
    console.error("❌ getBlogPage:", err.message);
    res.status(500).json({ success: false, message: "Failed to load blog page settings" });
  }
};

/* ── POST /api/blogpage ── */
export const saveBlogPage = async (req, res) => {
  try {
    const raw = parseBody(req);

    const payload = {
      slug: "blogpage",

      heroHeading:    (raw.heroHeading    || "").trim(),
      heroSubheading: cleanHTML(raw.heroSubheading || ""),

      connectHeading: (raw.connectHeading || "").trim(),
      connectSubtext: cleanHTML(raw.connectSubtext || ""),

      seo: parseSeo(raw.seo),
    };

    (req.files || []).forEach((file) => {
      if (file.fieldname === "seoImage") {
        payload.seo.image = { src: fileUrl(file.path || ""), alt: "", title: "" };
      }
    });

    const updated = await prisma.blogPage.upsert({
      where:  { slug: "blogpage" },
      update: payload,
      create: payload,
    });

    res.json({ success: true, message: "Blog page settings saved", data: updated });
  } catch (err) {
    console.error("❌ saveBlogPage:", err.message);
    res.status(500).json({ success: false, message: "Failed to save blog page settings" });
  }
};
