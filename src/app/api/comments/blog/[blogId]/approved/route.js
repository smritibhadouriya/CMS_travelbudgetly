import { runRoute } from '@/lib/express-adapter';
import { getApprovedComments } from '@/controllers/comment.controller.js';

export async function GET(req, ctx) {
  return runRoute(req, ctx, getApprovedComments);
}
