import prisma from '@/config/prisma';

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

/* ── Aggregated read for the SEO admin grid (Class-B). Mirrors the controller's
   getAllSeo shaping EXACTLY so a Server Component can seed initialData without
   the API hop. Additive & read-only — the controller keeps its own copy. ── */
const SEO_PAGE_CONFIGS = [
  { page: "home",         label: "Home Page",            group: "Pages", getDoc: getHomeDoc },
  { page: "about",        label: "About Page",           group: "Pages", getDoc: getAboutDoc },
  { page: "blogpage",     label: "Blog Listing Page",    group: "Pages", getDoc: getBlogPageDoc },
  { page: "package_page", label: "Package Listing Page", group: "Pages", getDoc: getPackagePageDoc },
];

const calcSeoScore = (seo = {}) => {
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
