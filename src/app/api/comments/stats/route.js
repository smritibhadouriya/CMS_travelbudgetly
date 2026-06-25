import { runRoute } from '@/lib/express-adapter';
import { getCommentStats } from '@/controllers/comment.controller.js';

export async function GET(req, ctx) {
  return runRoute(req, ctx, getCommentStats);
}
