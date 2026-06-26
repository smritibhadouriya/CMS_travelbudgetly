// app/api/authors/profile/[slug]/route.js
//
// Native Next.js App Router handler for an author profile + their published
// blogs (Phase-4 / P3.13). Public read; business logic stays in author.service.

import { NextResponse } from 'next/server';
import * as authorService from '@/lib/services/author.service';

const json = (data, status = 200) =>
  new NextResponse(JSON.stringify(data), {
    status,
    headers: { 'content-type': 'application/json; charset=utf-8' },
  });

/* ── GET /api/authors/profile/:slug ── */
export async function GET(req, ctx) {
  const { slug } = (await ctx.params) || {};
  try {
    const author = await authorService.findAuthorBySlug(slug);
    if (!author) {
      return json({ success: false, message: "Author not found" }, 404);
    }

    const blogs = await authorService.findPublishedBlogsByAuthor(author.id);

    return json({ success: true, author, blogs });
  } catch (err) {
    console.error("Author profile error:", err);
    return json({ success: false, message: err.message }, 500);
  }
}
