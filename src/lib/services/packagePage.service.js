import prisma from '@/config/prisma';
import { cleanHTML } from "@/lib/utils/sanitize.js";
import { parseSeo } from "@/lib/utils/seo.js";
import { fileUrl } from "@/lib/utils/url.js";

/* Build the PackagePage DB payload from parsed FormData (raw) + uploaded files. */
export const buildPackagePagePayload = (raw, files = []) => {
  const payload = {
    slug: "package_page",

    heroLabel:   (raw.heroLabel   || "").trim(),
    heroHeading: (raw.heroHeading || "").trim(),
    heroSubtext: cleanHTML(raw.heroSubtext || ""),

    helpText:     cleanHTML(raw.helpText || ""),
    blogsHeading: (raw.blogsHeading || "Travel Blogs").trim(),

    seo: parseSeo(raw.seo),
  };

  files.forEach((file) => {
    if (file.fieldname === "seoImage") {
      payload.seo.image = { src: fileUrl(file.path || ""), alt: "", title: "" };
    }
  });

  return payload;
};

export const getPackagePage = async (slug) =>
  prisma.packagePage.findUnique({ where: { slug } });

export const upsertPackagePage = async (slug, payload) =>
  prisma.packagePage.upsert({
    where:  { slug },
    update: payload,
    create: payload,
  });
