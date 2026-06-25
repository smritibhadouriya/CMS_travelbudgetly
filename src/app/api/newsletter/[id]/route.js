import { runRoute } from '@/lib/express-adapter';
import { verifyToken } from '@/middleware/auth.middleware';
import { deleteSubscriber } from '@/controllers/newsletter.controller.js';

export async function DELETE(req, ctx) {
  return runRoute(req, ctx, verifyToken, deleteSubscriber);
}
