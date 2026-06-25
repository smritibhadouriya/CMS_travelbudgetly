import { runRoute } from '@/lib/express-adapter';
import { subscribe } from '@/controllers/newsletter.controller.js';

export async function POST(req, ctx) {
  return runRoute(req, ctx, subscribe);
}
