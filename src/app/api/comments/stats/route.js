// app/api/comments/stats/route.js
// Native Next.js App Router handler (Phase-4 / Comments API).
// Aggregation reads (groupCommentStats / findBlogsByIds) stay in comment.service.

import { NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import * as commentService from '@/lib/services/comment.service';

/* ── GET /api/comments/stats ── */
export async function GET(req) {
  // Auth
  const token = req.cookies.get('token')?.value;
  if (!token) {
    return new NextResponse(JSON.stringify({ message: 'Unauthorized' }), { status: 401, headers: { 'content-type': 'application/json; charset=utf-8' } });
  }
  try {
    jwt.verify(token, process.env.JWT_SECRET);
  } catch {
    return new NextResponse(JSON.stringify({ message: 'Invalid token' }), { status: 401, headers: { 'content-type': 'application/json; charset=utf-8' } });
  }

  try {
    const [statusCounts, totalByBlog, pendingByBlog] = await commentService.groupCommentStats();

    /* top 5 blogs by total comments */
    const pendingMap = new Map(pendingByBlog.map(p => [p.blogId, p._count._all]));
    const topRanked = [...totalByBlog]
      .sort((a, b) => b._count._all - a._count._all)
      .slice(0, 5);

    const blogs = await commentService.findBlogsByIds(topRanked.map(t => t.blogId));
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

    return new NextResponse(JSON.stringify({ success: true, stats: { ...stats, topBlogs } }), { status: 200, headers: { 'content-type': 'application/json; charset=utf-8' } });
  } catch (err) {
    console.error("STATS ERROR:", err);
    return new NextResponse(JSON.stringify({ success: false, message: err.message }), { status: 500, headers: { 'content-type': 'application/json; charset=utf-8' } });
  }
}
