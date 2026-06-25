// backend/controllers/comment.controller.js
import prisma from "../config/prisma.js";

const BLOG_SELECT = { select: { id: true, title: true, slug: true } };

/* ─────────────────────────────────────────
   PUBLIC: Submit comment
───────────────────────────────────────── */
export const addComment = async (req, res) => {
  try {
    const { blogId } = req.params;
    const { name, email, message } = req.body;

    if (!name?.trim() || !email?.trim() || !message?.trim()) {
      return res.status(400).json({
        success: false,
        message: "Name, email and message are required",
      });
    }

    const blog = await prisma.blog.findUnique({ where: { id: blogId }, select: { id: true } });
    if (!blog) {
      return res.status(404).json({
        success: false,
        message: "Blog not found",
      });
    }

    const comment = await prisma.comment.create({
      data: {
        blogId,
        name: name.trim(),
        email: email.toLowerCase().trim(),
        message: message.trim(),
        status: "pending",
      },
    });

    res.status(201).json({
      success: true,
      message: "Comment submitted for review",
      comment,
    });
  } catch (err) {
    console.error("ADD COMMENT ERROR:", err);
    res.status(500).json({ success: false, message: err.message });
  }
};

/* ─────────────────────────────────────────
   PUBLIC: Get approved comments
───────────────────────────────────────── */
export const getApprovedComments = async (req, res) => {
  try {
    const comments = await prisma.comment.findMany({
      where:   { blogId: req.params.blogId, status: "approved" },
      orderBy: { createdAt: "desc" },
      select:  { id: true, name: true, message: true, createdAt: true },
    });

    res.json({ success: true, comments });
  } catch (err) {
    console.error("GET APPROVED ERROR:", err);
    res.status(500).json({ success: false, message: err.message });
  }
};

/* ─────────────────────────────────────────
   CMS: Get comments (flat + grouped)
───────────────────────────────────────── */
export const getAllComments = async (req, res) => {
  try {
    const {
      status,
      blogId,
      page = 1,
      limit = 20,
      q,
      sort = "latest",
      date,
      grouped,
    } = req.query;

    const where = {};

    if (status) where.status = status;
    if (blogId) where.blogId = blogId;

    /* 🔍 Search */
    if (q?.trim()) {
      const term = q.trim();
      where.OR = [
        { name:    { contains: term, mode: "insensitive" } },
        { email:   { contains: term, mode: "insensitive" } },
        { message: { contains: term, mode: "insensitive" } },
      ];
    }

    /* 📅 Date filter */
    if (date === "today") {
      const start = new Date();
      start.setHours(0, 0, 0, 0);
      where.createdAt = { gte: start };
    } else if (date === "week") {
      const start = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      where.createdAt = { gte: start };
    }

    const sortOrder = sort === "oldest" ? "asc" : "desc";

    /* ───────── GROUPED MODE ───────── */
    if (grouped === "true") {
      const rows = await prisma.comment.findMany({
        where,
        include: { blog: BLOG_SELECT },
        orderBy: { createdAt: sortOrder },
      });

      const map = new Map();
      for (const c of rows) {
        const key = c.blogId;
        if (!map.has(key)) {
          map.set(key, {
            blog: c.blog
              ? { id: c.blog.id, id: c.blog.id, title: c.blog.title, slug: c.blog.slug }
              : { id: key, id: key },
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

      const groups = [...map.values()].sort((a, b) => b.latestAt - a.latestAt);

      return res.json({
        success: true,
        grouped: true,
        groups,
      });
    }

    /* ───────── FLAT MODE ───────── */
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [total, comments] = await Promise.all([
      prisma.comment.count({ where }),
      prisma.comment.findMany({
        where,
        include: { blog: BLOG_SELECT },
        orderBy: { createdAt: sortOrder },
        skip,
        take: parseInt(limit),
      }),
    ]);

    res.json({
      success: true,
      grouped: false,
      comments,
      total,
      page: parseInt(page),
      totalPages: Math.ceil(total / parseInt(limit)),
    });
  } catch (err) {
    console.error("GET COMMENTS ERROR:", err);
    res.status(500).json({ success: false, message: err.message });
  }
};

/* ─────────────────────────────────────────
   CMS: Stats dashboard
───────────────────────────────────────── */
export const getCommentStats = async (req, res) => {
  try {
    const [statusCounts, totalByBlog, pendingByBlog] = await Promise.all([
      prisma.comment.groupBy({ by: ["status"], _count: { _all: true } }),
      prisma.comment.groupBy({ by: ["blogId"], _count: { _all: true } }),
      prisma.comment.groupBy({
        by: ["blogId"],
        where: { status: "pending" },
        _count: { _all: true },
      }),
    ]);

    /* top 5 blogs by total comments */
    const pendingMap = new Map(pendingByBlog.map(p => [p.blogId, p._count._all]));
    const topRanked = [...totalByBlog]
      .sort((a, b) => b._count._all - a._count._all)
      .slice(0, 5);

    const blogs = await prisma.blog.findMany({
      where:  { id: { in: topRanked.map(t => t.blogId) } },
      select: { id: true, title: true, slug: true },
    });
    const blogMap = new Map(blogs.map(b => [b.id, b]));

    const topBlogs = topRanked.map(t => ({
      blogId:  t.blogId,
      title:   blogMap.get(t.blogId)?.title || "",
      slug:    blogMap.get(t.blogId)?.slug  || "",
      total:   t._count._all,
      pending: pendingMap.get(t.blogId) || 0,
    }));

    const stats = { total: 0, pending: 0, approved: 0, rejected: 0 };
    statusCounts.forEach(({ status, _count }) => {
      stats[status] = _count._all;
      stats.total += _count._all;
    });

    res.json({ success: true, stats: { ...stats, topBlogs } });
  } catch (err) {
    console.error("STATS ERROR:", err);
    res.status(500).json({ success: false, message: err.message });
  }
};

/* ─────────────────────────────────────────
   CMS: Update status
───────────────────────────────────────── */
export const updateCommentStatus = async (req, res) => {
  try {
    const { status } = req.body;

    if (!["approved", "rejected", "pending"].includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Invalid status",
      });
    }

    const comment = await prisma.comment.update({
      where:   { id: req.params.id },
      data:    { status },
      include: { blog: BLOG_SELECT },
    });

    res.json({ success: true, comment });
  } catch (err) {
    if (err.code === "P2025") {
      return res.status(404).json({ success: false, message: "Comment not found" });
    }
    console.error("UPDATE STATUS ERROR:", err);
    res.status(500).json({ success: false, message: err.message });
  }
};

/* ─────────────────────────────────────────
   CMS: Delete
───────────────────────────────────────── */
export const deleteComment = async (req, res) => {
  try {
    await prisma.comment.delete({ where: { id: req.params.id } });
    res.json({ success: true, message: "Comment deleted" });
  } catch (err) {
    if (err.code === "P2025") {
      return res.status(404).json({ success: false, message: "Comment not found" });
    }
    console.error("DELETE ERROR:", err);
    res.status(500).json({ success: false, message: err.message });
  }
};

/* ─────────────────────────────────────────
   CMS: Bulk update / delete
───────────────────────────────────────── */
export const bulkUpdateComments = async (req, res) => {
  try {
    const { ids, status, action } = req.body;

    if (!ids?.length) {
      return res.status(400).json({
        success: false,
        message: "No IDs provided",
      });
    }

    /* 🗑 Bulk delete */
    if (action === "delete") {
      await prisma.comment.deleteMany({ where: { id: { in: ids } } });

      return res.json({
        success: true,
        message: `${ids.length} comments deleted`,
      });
    }

    if (!["approved", "rejected", "pending"].includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Invalid status",
      });
    }

    await prisma.comment.updateMany({ where: { id: { in: ids } }, data: { status } });

    res.json({
      success: true,
      message: `${ids.length} comments updated to ${status}`,
    });
  } catch (err) {
    console.error("BULK ERROR:", err);
    res.status(500).json({ success: false, message: err.message });
  }
};
