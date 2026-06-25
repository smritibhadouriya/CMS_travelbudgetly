import { runRoute } from '@/lib/express-adapter';
import { verifyToken } from '@/middleware/auth.middleware';
import { togglePublish } from '@/controllers/blog.controller.js';

export async function PATCH(req, ctx) {
  return runRoute(req, ctx, verifyToken, togglePublish);
}
