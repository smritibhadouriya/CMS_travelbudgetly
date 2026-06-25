// controllers/home.controller.js
// GET  /api/pages/home → home page content (travel sections)
// POST /api/pages/home → save all home page content
//
// All sections map 1:1 to scalar/Json fields on the `Home` model. The actual
// destination / package / offer cards are NOT stored here — they come from the
// Package and Offer models. This page only holds section toggles + headings.

import * as homeService from "../lib/services/home.service.js";
import { cleanHTML, normalizeImage, parseSeo, parseBody, fileUrl } from "../utils/helpers.js";

const bool = (v, def = true) => (v === undefined || v === null ? def : v !== false && v !== "false");

/* ══════════════════════════════════════
   GET /api/pages/home
══════════════════════════════════════ */
export const getHomePage = async (req, res) => {
  try {
    const page = await homeService.getHome("home");
    res.json({ success: true, data: page || { slug: "home" } });
  } catch (err) {
    console.error("❌ getHomePage:", err.message);
    res.status(500).json({ success: false, message: "Failed to load Home page" });
  }
};

/* ══════════════════════════════════════
   POST /api/pages/home
══════════════════════════════════════ */
export const saveHomePage = async (req, res) => {
  try {
    const raw = parseBody(req);

    const payload = {
      slug: "home",

      /* ── Hero ── */
      heroEnabled:      bool(raw.heroEnabled),
      heroImageMobile:  (raw.heroImageMobile  || "").trim(),
      heroImageTablet:  (raw.heroImageTablet  || "").trim(),
      heroImageDesktop: (raw.heroImageDesktop || "").trim(),
      heroImageLaptop:  (raw.heroImageLaptop  || "").trim(),

      /* ── Featured Destinations ── */
      destinationsEnabled:   bool(raw.destinationsEnabled),
      destinationsWatermark: (raw.destinationsWatermark || "").trim(),
      destinationsHeading:   (raw.destinationsHeading   || "").trim(),
      destinationsSubtext:   (raw.destinationsSubtext   || "").trim(),

      /* ── Special Offers ── */
      specialOffersEnabled: bool(raw.specialOffersEnabled),
      specialOffersHeading: (raw.specialOffersHeading || "").trim(),

      /* ── Popular Cities ── */
      popularCitiesEnabled:         bool(raw.popularCitiesEnabled),
      popularCitiesHeading:         (raw.popularCitiesHeading         || "").trim(),
      popularCitiesExploreLinkText: (raw.popularCitiesExploreLinkText || "").trim(),

      /* ── Spiritual Packages ── */
      spritualpackage:        bool(raw.spritualpackage),
      spritualpackageHeading: (raw.spritualpackageHeading || "").trim(),

      /* ── Why Choose Us ── */
      whyChooseUsEnabled:   bool(raw.whyChooseUsEnabled),
      whyChooseUsWatermark: (raw.whyChooseUsWatermark || "").trim(),
      whyChooseUsHeading:   (raw.whyChooseUsHeading   || "").trim(),
      trustFeatures: Array.isArray(raw.trustFeatures)
        ? raw.trustFeatures.slice(0, 12).map((f) => ({
            icon:  (f?.icon  || "").trim(),
            title: (f?.title || "").trim(),
            desc:  cleanHTML(f?.desc || f?.description || ""),
          }))
        : [],
      whyChooseUsCenterImages: JSON.stringify(
        Array.isArray(raw.whyChooseUsCenterImages)
          ? raw.whyChooseUsCenterImages.map((s) => String(s || "").trim()).filter(Boolean)
          : []
      ),

      /* ── Popular Packages ── */
      packagesEnabled:         bool(raw.packagesEnabled),
      packagesWatermark:       (raw.packagesWatermark       || "").trim(),
      packagesHeading:         (raw.packagesHeading         || "").trim(),
      packagesSubtext:         (raw.packagesSubtext         || "").trim(),
      packagesExploreLinkText: (raw.packagesExploreLinkText || "Explore").trim(),

      /* ── Seasonal Travel ── */
      seasonalEnabled:   bool(raw.seasonalEnabled),
      seasonalWatermark: (raw.seasonalWatermark || "").trim(),
      seasonalHeading:   (raw.seasonalHeading   || "").trim(),
      seasonalSubtext:   (raw.seasonalSubtext   || "").trim(),
      seasons: Array.isArray(raw.seasons)
        ? raw.seasons.slice(0, 12).map((s) => ({
            id:    (s?.id    || "").toString(),
            label: (s?.label || "").trim(),
            image: (s?.image || "").trim(),
          }))
        : [],

      /* ── Latest Blogs ── */
      blogsEnabled:         bool(raw.blogsEnabled),
      blogsWatermark:       (raw.blogsWatermark       || "Travel Blogs").trim(),
      blogsHeading:         (raw.blogsHeading         || "").trim(),
      blogsSubheading:      (raw.blogsSubheading      || "Latest Blogs").trim(),
      blogsExploreLinkText: (raw.blogsExploreLinkText || "Explore Blogs").trim(),

      /* ── Newsletter ── */
      newsletterEnabled: bool(raw.newsletterEnabled),
      newsletterHeading: (raw.newsletterHeading || "").trim(),
      newsletterSubtext: (raw.newsletterSubtext || "").trim(),

      seo: parseSeo(raw.seo),
    };

    /* ── File uploads (responsive hero images + seo image) ── */
    (req.files || []).forEach((file) => {
      const src = fileUrl(file.path || "");
      if (file.fieldname === "heroImageMobile")  payload.heroImageMobile  = src;
      if (file.fieldname === "heroImageTablet")  payload.heroImageTablet  = src;
      if (file.fieldname === "heroImageDesktop") payload.heroImageDesktop = src;
      if (file.fieldname === "heroImageLaptop")  payload.heroImageLaptop  = src;
      if (file.fieldname === "seoImage")         payload.seo.image        = normalizeImage({ src });
    });

    const updated = await homeService.upsertHome("home", payload);

    res.json({ success: true, message: "Home page saved", data: updated });
  } catch (err) {
    console.error("❌ saveHomePage:", err.message);
    res.status(500).json({ success: false, message: "Failed to save Home page" });
  }
};
