import { runRoute } from '@/lib/express-adapter';
import { getStats } from '@/controllers/newsletter.controller.js';

export async function GET(req, ctx) {
  return runRoute(req, ctx, getStats);
}
