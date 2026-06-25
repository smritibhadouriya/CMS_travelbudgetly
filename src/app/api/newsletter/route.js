import { runRoute } from '@/lib/express-adapter';
import { verifyToken } from '@/middleware/auth.middleware';
import { getAllSubscribers } from '@/controllers/newsletter.controller.js';

export async function GET(req, ctx) {
  return runRoute(req, ctx, verifyToken, getAllSubscribers);
}
