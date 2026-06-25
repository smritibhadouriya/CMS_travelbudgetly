import { runRoute } from '@/lib/express-adapter';
import { getAllSubscribers } from '@/controllers/newsletter.controller.js';

export async function GET(req, ctx) {
  return runRoute(req, ctx, getAllSubscribers);
}
