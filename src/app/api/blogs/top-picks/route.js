import { runRoute } from '@/lib/express-adapter';
import { getTopPicks } from '@/controllers/blog.controller.js';

export async function GET(req, ctx) {
  return runRoute(req, ctx, getTopPicks);
}
