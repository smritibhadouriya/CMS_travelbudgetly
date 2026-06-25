import { runRoute } from '@/lib/express-adapter';
import { getBlogsByTag } from '@/controllers/blog.controller.js';

export async function GET(req, ctx) {
  return runRoute(req, ctx, getBlogsByTag);
}
