import { runRoute } from '@/lib/express-adapter';
import { getBlogBySlug } from '@/controllers/blog.controller.js';

export async function GET(req, ctx) {
  return runRoute(req, ctx, getBlogBySlug);
}
