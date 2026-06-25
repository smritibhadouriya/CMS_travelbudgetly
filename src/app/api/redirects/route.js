import { runRoute } from '@/lib/express-adapter';
import { getRedirects, createRedirect } from '@/controllers/redirect.controller.js';

export async function GET(req, ctx) {
  return runRoute(req, ctx, getRedirects);
}

export async function POST(req, ctx) {
  return runRoute(req, ctx, createRedirect);
}
