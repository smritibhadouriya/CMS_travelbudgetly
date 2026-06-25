import { runRoute } from '@/lib/express-adapter';
import { verifyToken } from '@/middleware/auth.middleware';
import { getRedirects, createRedirect } from '@/controllers/redirect.controller.js';

export async function GET(req, ctx) {
  return runRoute(req, ctx, getRedirects);
}

export async function POST(req, ctx) {
  return runRoute(req, ctx, verifyToken, createRedirect);
}
