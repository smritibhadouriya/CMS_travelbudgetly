import { runRoute } from '@/lib/express-adapter';
import { togglePublish } from '@/controllers/blog.controller.js';

export async function PATCH(req, ctx) {
  return runRoute(req, ctx, togglePublish);
}
