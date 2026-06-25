import prisma from '@/config/prisma';

export const BLOG_SELECT = { select: { id: true, title: true, slug: true } };

export const findBlogById = (id) =>
  prisma.blog.findUnique({ where: { id }, select: { id: true } });

export const createComment = (data) =>
  prisma.comment.create({ data });

export const findApprovedComments = (blogId) =>
  prisma.comment.findMany({
    where:   { blogId, status: "approved" },
    orderBy: { createdAt: "desc" },
    select:  { id: true, name: true, message: true, createdAt: true },
  });

export const findCommentsWithBlog = (where, sortOrder) =>
  prisma.comment.findMany({
    where,
    include: { blog: BLOG_SELECT },
    orderBy: { createdAt: sortOrder },
  });

/* Build the admin-list `where` from query params (mirrors the controller). */
const buildCommentWhere = ({ status, blogId, q, date } = {}) => {
  const where = {};
  if (status) where.status = status;
  if (blogId) where.blogId = blogId;
  if (q?.trim()) {
    const term = q.trim();
    where.OR = [
      { name:    { contains: term, mode: "insensitive" } },
      { email:   { contains: term, mode: "insensitive" } },
      { message: { contains: term, mode: "insensitive" } },
    ];
  }
  if (date === "today") {
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    where.createdAt = { gte: start };
  } else if (date === "week") {
    where.createdAt = { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) };
  }
  return where;
};

/* Grouped admin listing — same shape the controller's grouped branch returns
   (groups: { blog, comments, total, pendingCount, latestAt }, sorted newest).
   NOTE: the controller still has its own copy of this grouping; this is an
   additive read fn so a Server Component can produce the grouped shape without
   the API hop. (Follow-up: point the controller at this fn to dedupe.) */
export const getGroupedComments = async (params = {}) => {
  const where     = buildCommentWhere(params);
  const sortOrder = params.sort === "oldest" ? "asc" : "desc";
  const rows      = await findCommentsWithBlog(where, sortOrder);

  const map = new Map();
  for (const c of rows) {
    const key = c.blogId;
    if (!map.has(key)) {
      map.set(key, {
        blog: c.blog
          ? { id: c.blog.id, title: c.blog.title, slug: c.blog.slug }
          : { id: key },
        comments: [],
        total: 0,
        pendingCount: 0,
        latestAt: c.createdAt,
      });
    }
    const g = map.get(key);
    g.comments.push(c);
    g.total += 1;
    if (c.status === "pending") g.pendingCount += 1;
    if (c.createdAt > g.latestAt) g.latestAt = c.createdAt;
  }
  return [...map.values()].sort((a, b) => b.latestAt - a.latestAt);
};

export const countAndFindComments = (where, sortOrder, skip, take) =>
  Promise.all([
    prisma.comment.count({ where }),
    prisma.comment.findMany({
      where,
      include: { blog: BLOG_SELECT },
      orderBy: { createdAt: sortOrder },
      skip,
      take,
    }),
  ]);

export const groupCommentStats = () =>
  Promise.all([
    prisma.comment.groupBy({ by: ["status"], _count: { _all: true } }),
    prisma.comment.groupBy({ by: ["blogId"], _count: { _all: true } }),
    prisma.comment.groupBy({
      by: ["blogId"],
      where: { status: "pending" },
      _count: { _all: true },
    }),
  ]);

export const findBlogsByIds = (ids) =>
  prisma.blog.findMany({
    where:  { id: { in: ids } },
    select: { id: true, title: true, slug: true },
  });

export const updateCommentStatus = (id, status) =>
  prisma.comment.update({
    where:   { id },
    data:    { status },
    include: { blog: BLOG_SELECT },
  });

export const deleteComment = (id) =>
  prisma.comment.delete({ where: { id } });

export const deleteManyComments = (ids) =>
  prisma.comment.deleteMany({ where: { id: { in: ids } } });

export const updateManyCommentStatus = (ids, status) =>
  prisma.comment.updateMany({ where: { id: { in: ids } }, data: { status } });
