import prisma from '@/config/prisma';
import { cleanHTML } from "@/lib/utils/sanitize.js";
import { parseSeo } from "@/lib/utils/seo.js";
import { fileUrl } from "@/lib/utils/url.js";

/* Build the BlogPage DB payload from parsed FormData (raw) + uploaded files. */
export const buildBlogPagePayload = (raw, files = []) => {
  const payload = {
    slug: "blogpage",

    heroHeading:    (raw.heroHeading    || "").trim(),
    heroSubheading: cleanHTML(raw.heroSubheading || ""),

    connectHeading: (raw.connectHeading || "").trim(),
    connectSubtext: cleanHTML(raw.connectSubtext || ""),

    seo: parseSeo(raw.seo),
  };

  files.forEach((file) => {
    if (file.fieldname === "seoImage") {
      payload.seo.image = { src: fileUrl(file.path || ""), alt: "", title: "" };
    }
  });

  return payload;
};

export const getBlogPage = async (slug) =>
  prisma.blogPage.findUnique({ where: { slug } });

export const upsertBlogPage = async (slug, payload) =>
  prisma.blogPage.upsert({
    where:  { slug },
    update: payload,
    create: payload,
  });
