import { runRoute } from '@/lib/express-adapter';
import { getAllImages } from '@/controllers/cleanupImages.controller.js';

export async function GET(req, ctx) {
  return runRoute(req, ctx, getAllImages);
}
