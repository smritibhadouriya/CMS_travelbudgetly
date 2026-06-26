import prisma from '@/config/prisma';
import { cleanHTML } from "@/lib/utils/sanitize.js";
import { normalizeImage } from "@/lib/utils/image.js";
import { parseSeo } from "@/lib/utils/seo.js";
import { fileUrl } from "@/lib/utils/url.js";

/* Build the About DB payload from parsed FormData (raw) + uploaded files. */
export const buildAboutPayload = (raw, files = []) => {
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
  files.forEach((file) => {
    const src = fileUrl(file.path || "");
    if (file.fieldname === "heroImage")    payload.heroImage    = normalizeImage({ src, alt: payload.heroHeading });
    if (file.fieldname === "journeyImage") payload.journeyImage = normalizeImage({ src, alt: payload.journeyHeading });
    if (file.fieldname === "seoImage")     payload.seo.image    = normalizeImage({ src });
  });

  return payload;
};

export const getAbout = async (slug) =>
  prisma.about.findUnique({ where: { slug } });

export const upsertAbout = async (slug, payload) =>
  prisma.about.upsert({
    where:  { slug },
    update: payload,
    create: payload,
  });
