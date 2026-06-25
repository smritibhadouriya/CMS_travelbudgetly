import { runRoute } from '@/lib/express-adapter';
import { toggleFeatured } from '@/controllers/blog.controller.js';

export async function PATCH(req, ctx) {
  return runRoute(req, ctx, toggleFeatured);
}
