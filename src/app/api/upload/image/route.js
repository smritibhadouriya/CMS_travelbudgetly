import { runRoute } from '@/lib/express-adapter';
import { uploadSingle, convertToWebP } from '@/lib/upload';
import { uploadImage } from '@/controllers/uploadController.js';

export async function POST(req, ctx) {
  return runRoute(req, ctx, uploadSingle('image'), convertToWebP, uploadImage);
}
