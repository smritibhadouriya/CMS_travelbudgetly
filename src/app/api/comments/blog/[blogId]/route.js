import { runRoute } from '@/lib/express-adapter';
import { addComment } from '@/controllers/comment.controller.js';

export async function POST(req, ctx) {
  return runRoute(req, ctx, addComment);
}
