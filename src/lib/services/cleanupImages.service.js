import prisma from '@/config/prisma';

/* ── Read all records/fields needed to compute referenced images ── */
export const getRecordsForImageScan = async () =>
  Promise.all([
    prisma.blog.findMany({ select: { image: true, bannerImage: true, seo: true, content: true } }),
    prisma.package.findMany({ select: { images: true, imageUrls: true, seo: true } }),
    prisma.home.findMany(),
    prisma.about.findMany(),
    prisma.blogPage.findMany(),
    prisma.packagePage.findMany(),
    prisma.author.findMany({ select: { image: true } }),
    prisma.offer.findMany({ select: { banner: true } }),
    prisma.seo.findMany({ select: { seoImage: true } }),
  ]);
