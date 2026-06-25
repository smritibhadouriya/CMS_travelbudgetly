import { runRoute } from '@/lib/express-adapter';
import { unsubscribe } from '@/controllers/newsletter.controller.js';

export async function POST(req, ctx) {
  return runRoute(req, ctx, unsubscribe);
}
