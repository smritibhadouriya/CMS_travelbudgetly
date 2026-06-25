import { runRoute } from '@/lib/express-adapter';
import { verifyToken } from '@/middleware/auth.middleware';
import { deleteComment } from '@/controllers/comment.controller.js';

export async function DELETE(req, ctx) {
  return runRoute(req, ctx, verifyToken, deleteComment);
}
