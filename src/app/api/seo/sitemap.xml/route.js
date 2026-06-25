import { runRoute } from '@/lib/express-adapter';
import { generateSitemap } from '@/controllers/settings.controller.js';

export async function GET(req, ctx) {
  return runRoute(req, ctx, generateSitemap);
}
