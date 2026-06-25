import { runRoute } from '@/lib/express-adapter';
import { updateCommentStatus } from '@/controllers/comment.controller.js';

export async function PUT(req, ctx) {
  return runRoute(req, ctx, updateCommentStatus);
}
