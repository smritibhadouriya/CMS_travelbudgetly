import { runRoute } from '@/lib/express-adapter';
import { uploadAny, convertMultipleToWebP } from '@/lib/upload';
import { cleanupUnusedImages } from '@/controllers/cleanupImages.controller.js';

export async function POST(req, ctx) {
  return runRoute(req, ctx, uploadAny(), convertMultipleToWebP, cleanupUnusedImages);
}
