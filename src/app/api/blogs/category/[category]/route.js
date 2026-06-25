import { runRoute } from '@/lib/express-adapter';
import { getBlogsByCategory } from '@/controllers/blog.controller.js';

export async function GET(req, ctx) {
  return runRoute(req, ctx, getBlogsByCategory);
}
