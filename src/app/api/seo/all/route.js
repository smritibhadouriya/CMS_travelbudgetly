import { runRoute } from '@/lib/express-adapter';
import { getAllSeo } from '@/controllers/seo.controller.js';

export async function GET(req, ctx) {
  return runRoute(req, ctx, getAllSeo);
}
