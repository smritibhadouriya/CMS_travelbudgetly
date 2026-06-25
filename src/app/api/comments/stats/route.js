import { runRoute } from '@/lib/express-adapter';
import { verifyToken } from '@/middleware/auth.middleware';
import { getCommentStats } from '@/controllers/comment.controller.js';

export async function GET(req, ctx) {
  return runRoute(req, ctx, verifyToken, getCommentStats);
}
