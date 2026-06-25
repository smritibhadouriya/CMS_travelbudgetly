import { runRoute } from '@/lib/express-adapter';
import { getAllComments } from '@/controllers/comment.controller.js';

export async function GET(req, ctx) {
  return runRoute(req, ctx, getAllComments);
}
