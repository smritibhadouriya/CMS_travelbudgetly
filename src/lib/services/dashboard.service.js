import prisma from '@/config/prisma';

/**
 * Aggregate CMS stats for the dashboard.
 * Pure data-access (service → Prisma) — no req/res, no HTTP hop.
 * All counts run in a single Promise.all batch.
 */
export async function getDashboardStats() {
  const [
    blogsTotal,
    blogsPublished,
    packagesTotal,
    packagesPublished,
    authorsTotal,
    commentsTotal,
    commentsPending,
    subscribersTotal,
    recentBlogs,
  ] = await Promise.all([
    prisma.blog.count(),
    prisma.blog.count({ where: { isPublished: true } }),
    prisma.package.count(),
    prisma.package.count({ where: { isPublished: true } }),
    prisma.author.count({ where: { isActive: true } }),
    prisma.comment.count(),
    prisma.comment.count({ where: { status: 'pending' } }),
    prisma.newsletter.count({ where: { unsubscribedAt: null } }),
    prisma.blog.findMany({
      orderBy: { createdAt: 'desc' },
      take: 5,
      select: { id: true, title: true, slug: true, isPublished: true, createdAt: true },
    }),
  ]);

  return {
    blogs: { total: blogsTotal, published: blogsPublished, draft: blogsTotal - blogsPublished },
    packages: { total: packagesTotal, published: packagesPublished, draft: packagesTotal - packagesPublished },
    authors: { total: authorsTotal },
    comments: { total: commentsTotal, pending: commentsPending },
    subscribers: { total: subscribersTotal },
    recentBlogs,
  };
}
