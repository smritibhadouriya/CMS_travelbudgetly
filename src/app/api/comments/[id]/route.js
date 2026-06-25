import { runRoute } from '@/lib/express-adapter';
import { deleteComment } from '@/controllers/comment.controller.js';

export async function DELETE(req, ctx) {
  return runRoute(req, ctx, deleteComment);
}
