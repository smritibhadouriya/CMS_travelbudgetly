import { runRoute } from '@/lib/express-adapter';
import { getAuthorWithBlogs } from '@/controllers/author.controller.js';

export async function GET(req, ctx) {
  return runRoute(req, ctx, getAuthorWithBlogs);
}
