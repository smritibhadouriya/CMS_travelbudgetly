import prisma from '@/config/prisma';
import { cleanHTML } from "@/lib/utils/sanitize.js";
import { normalizeImage } from "@/lib/utils/image.js";
import { parseSeo } from "@/lib/utils/seo.js";
import { fileUrl } from "@/lib/utils/url.js";

const bool = (v, def = true) => (v === undefined || v === null ? def : v !== false && v !== "false");

/* Build the Home DB payload from parsed FormData (raw) + uploaded files. */
export const buildHomePayload = (raw, files = []) => {
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
  files.forEach((file) => {
    const src = fileUrl(file.path || "");
    if (file.fieldname === "heroImageMobile")  payload.heroImageMobile  = src;
    if (file.fieldname === "heroImageTablet")  payload.heroImageTablet  = src;
    if (file.fieldname === "heroImageDesktop") payload.heroImageDesktop = src;
    if (file.fieldname === "heroImageLaptop")  payload.heroImageLaptop  = src;
    if (file.fieldname === "seoImage")         payload.seo.image        = normalizeImage({ src });
  });

  return payload;
};

export const getHome = async (slug) =>
  prisma.home.findUnique({ where: { slug } });

export const upsertHome = async (slug, payload) =>
  prisma.home.upsert({
    where:  { slug },
    update: payload,
    create: payload,
  });
