import prisma from '@/config/prisma';
import { fileUrl } from "@/lib/utils/url.js";

/* ── Static singleton page docs ── */
export const getHomeDoc = () =>
  prisma.home.findUnique({ where: { slug: "home" } });
export const saveHomeDoc = (seo) =>
  prisma.home.upsert({ where: { slug: "home" }, update: { seo }, create: { slug: "home", seo } });

export const getAboutDoc = () =>
  prisma.about.findUnique({ where: { slug: "about" } });
export const saveAboutDoc = (seo) =>
  prisma.about.upsert({ where: { slug: "about" }, update: { seo }, create: { slug: "about", seo } });

export const getBlogPageDoc = () =>
  prisma.blogPage.findUnique({ where: { slug: "blogpage" } });
export const saveBlogPageDoc = (seo) =>
  prisma.blogPage.upsert({ where: { slug: "blogpage" }, update: { seo }, create: { slug: "blogpage", seo } });

export const getPackagePageDoc = () =>
  prisma.packagePage.findUnique({ where: { slug: "package_page" } });
export const savePackagePageDoc = (seo) =>
  prisma.packagePage.upsert({ where: { slug: "package_page" }, update: { seo }, create: { slug: "package_page", seo } });

/* ── Dynamic blog/package SEO ── */
export const findAllBlogsSeo = () =>
  prisma.blog.findMany({
    select: { slug: true, title: true, seo: true, isPublished: true, updatedAt: true },
  });

export const findAllPackagesSeo = () =>
  prisma.package.findMany({
    select: { slug: true, title: true, seo: true, isPublished: true, updatedAt: true },
  });

export const findBlogSeoBySlug = (slug) =>
  prisma.blog.findUnique({ where: { slug }, select: { seo: true } });

export const findPackageSeoBySlug = (slug) =>
  prisma.package.findUnique({ where: { slug }, select: { seo: true } });

export const updateBlogSeoBySlug = (slug, seo) =>
  prisma.blog.updateMany({ where: { slug }, data: { seo } });

export const updatePackageSeoBySlug = (slug, seo) =>
  prisma.package.updateMany({ where: { slug }, data: { seo } });

/* ── Aggregated read for the SEO admin grid: shapes each page's SEO + score so
   a Server Component can seed initialData without the API hop. Read-only. ── */
const SEO_PAGE_CONFIGS = [
  { page: "home",         label: "Home Page",            group: "Pages", getDoc: getHomeDoc,        saveDoc: saveHomeDoc },
  { page: "about",        label: "About Page",           group: "Pages", getDoc: getAboutDoc,       saveDoc: saveAboutDoc },
  { page: "blogpage",     label: "Blog Listing Page",    group: "Pages", getDoc: getBlogPageDoc,    saveDoc: saveBlogPageDoc },
  { page: "package_page", label: "Package Listing Page", group: "Pages", getDoc: getPackagePageDoc, saveDoc: savePackagePageDoc },
];

export const calcSeoScore = (seo = {}) => {
  let score = 0;
  if (seo.metaTitle?.trim())       score += 25;
  if (seo.metaDescription?.trim()) score += 25;
  if (seo.metaKeywords?.length)    score += 20;
  if (seo.canonicalUrl?.trim())    score += 15;
  if (seo.image?.src?.trim())      score += 15;
  return score;
};

export const getAllSeoEntries = async () => {
  const results = await Promise.all(
    SEO_PAGE_CONFIGS.map(async (config) => {
      try {
        const doc = await config.getDoc();
        const seo = doc?.seo || {};
        return { page: config.page, label: config.label, group: config.group, seo, score: calcSeoScore(seo) };
      } catch (_) {
        return { page: config.page, label: config.label, group: config.group, seo: {}, score: 0 };
      }
    })
  );

  try {
    const blogs = await findAllBlogsSeo();
    blogs.forEach((b) =>
      results.push({
        page: `blog/${b.slug}`, label: b.title || b.slug, group: "Blogs",
        status: b.isPublished ? "published" : "draft",
        seo: b.seo || {}, score: calcSeoScore(b.seo || {}),
      })
    );
  } catch (_) {}

  try {
    const packages = await findAllPackagesSeo();
    packages.forEach((p) =>
      results.push({
        page: `package/${p.slug}`, label: p.title || p.slug, group: "Packages",
        status: p.isPublished ? "published" : "draft",
        seo: p.seo || {}, score: calcSeoScore(p.seo || {}),
      })
    );
  } catch (_) {}

  return results;
};

/* ── Build the SEO payload from parsed body (raw) + uploaded files. ── */
export const buildSeoPayload = (raw, files = []) => {
  const incomingSeo = raw.seo || {};

  const seoPayload = {
    metaTitle:       (incomingSeo.metaTitle       || "").trim(),
    metaDescription: (incomingSeo.metaDescription || "").trim(),
    metaKeywords:    Array.isArray(incomingSeo.metaKeywords) ? incomingSeo.metaKeywords : [],
    canonicalUrl:    (incomingSeo.canonicalUrl    || "").trim(),
    index:           incomingSeo.index  !== false,
    follow:          incomingSeo.follow !== false,
    jsonSchema:      (typeof incomingSeo.jsonSchema === "object" && incomingSeo.jsonSchema !== null) ? incomingSeo.jsonSchema : {},
    image: {
      mode:  incomingSeo.image?.mode  || "url",
      src:   incomingSeo.image?.src   || "",
      alt:   incomingSeo.image?.alt   || "",
      title: incomingSeo.image?.title || "",
    },
  };

  const imgFile = files.find((f) => f.fieldname === "seoImage");
  if (imgFile) {
    seoPayload.image = { mode: "upload", src: fileUrl(imgFile.path), alt: seoPayload.metaTitle || "", title: seoPayload.metaTitle || "" };
  }

  return seoPayload;
};

/* ── Resolve a page slug → its current SEO object.
   Returns { found: false } for unknown static pages (the route maps to 404). ── */
export const getSeoForPage = async (page) => {
  if (page.startsWith("blog/")) {
    const doc = await findBlogSeoBySlug(page.replace("blog/", ""));
    return { found: true, seo: doc?.seo || {} };
  }
  if (page.startsWith("package/")) {
    const doc = await findPackageSeoBySlug(page.replace("package/", ""));
    return { found: true, seo: doc?.seo || {} };
  }

  const config = SEO_PAGE_CONFIGS.find((c) => c.page === page);
  if (!config) return { found: false };

  const doc = await config.getDoc();
  return { found: true, seo: doc?.seo || {} };
};

/* ── Persist the SEO payload to the page's target.
   Returns { found: false } for unknown static pages (the route maps to 404). ── */
export const saveSeoForPage = async (page, seoPayload) => {
  if (page.startsWith("blog/")) {
    await updateBlogSeoBySlug(page.replace("blog/", ""), seoPayload);
    return { found: true };
  }
  if (page.startsWith("package/")) {
    await updatePackageSeoBySlug(page.replace("package/", ""), seoPayload);
    return { found: true };
  }

  const config = SEO_PAGE_CONFIGS.find((c) => c.page === page);
  if (!config) return { found: false };

  await config.saveDoc(seoPayload);
  return { found: true };
};
